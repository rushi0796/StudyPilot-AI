import crypto from 'crypto';
import { 
  normalizeEmail, 
  generateSessionToken, 
  hashSessionToken, 
  createSessionCookie, 
  createClearOAuthStateCookie,
  generateOAuthState,
  createOAuthStateCookie,
  getOAuthStateFromRequest 
} from './authUtils.ts';
import { 
  findUserByGoogleId, 
  findUserByEmail, 
  insertUser, 
  linkGoogleAccount, 
  insertSession, 
  DatabaseConfigurationError 
} from './db.ts';

export interface GoogleOAuthConfig {
  clientId: string | null;
  clientSecret: string | null;
  configured: boolean;
}

export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '').trim() || null;
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '').trim() || null;

  return {
    clientId,
    clientSecret,
    configured: Boolean(clientId && clientSecret)
  };
}

/**
 * Determine dynamic redirect URI matching current deployment or localhost
 */
export function getRedirectUri(req: any): string {
  if (process.env.APP_URL) {
    const cleanAppUrl = process.env.APP_URL.replace(/\/+$/, '');
    return `${cleanAppUrl}/api/auth/google/callback`;
  }

  const host = req?.headers?.host || req?.headers?.Host || 'localhost:5173';
  const proto = req?.headers?.['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}/api/auth/google/callback`;
}

/**
 * Process Google OAuth Start: generates authorization URL and state cookie
 */
export function processGoogleStart(req: any) {
  const config = getGoogleOAuthConfig();
  if (!config.clientId) {
    return {
      status: 302,
      redirect: '/?authError=GOOGLE_NOT_CONFIGURED',
      cookie: null
    };
  }

  const state = generateOAuthState();
  const stateCookie = createOAuthStateCookie(state);
  const redirectUri = getRedirectUri(req);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  return {
    status: 302,
    redirect: authUrl.toString(),
    cookie: stateCookie
  };
}

/**
 * Process Google OAuth Callback: validates state, exchanges code, verifies user, and establishes session
 */
export async function processGoogleCallback(req: any, query: any) {
  const code = query?.code;
  const state = query?.state;
  const errorParam = query?.error;

  // 1. Check if user cancelled in Google consent screen
  if (errorParam) {
    return {
      status: 302,
      redirect: `/?authError=${encodeURIComponent(errorParam)}`,
      cookies: [createClearOAuthStateCookie()]
    };
  }

  if (!code || !state) {
    return {
      status: 302,
      redirect: '/?authError=MISSING_OAUTH_CODE',
      cookies: [createClearOAuthStateCookie()]
    };
  }

  // 2. Validate state cookie against CSRF
  const expectedState = getOAuthStateFromRequest(req);
  if (!expectedState || expectedState !== state) {
    return {
      status: 302,
      redirect: '/?authError=INVALID_OAUTH_STATE',
      cookies: [createClearOAuthStateCookie()]
    };
  }

  // 3. Verify server configuration
  const config = getGoogleOAuthConfig();
  if (!config.configured || !config.clientId || !config.clientSecret) {
    return {
      status: 302,
      redirect: '/?authError=GOOGLE_NOT_CONFIGURED',
      cookies: [createClearOAuthStateCookie()]
    };
  }

  const redirectUri = getRedirectUri(req);

  try {
    // 4. Exchange code for Google tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('Google token exchange failed:', errBody);
      return {
        status: 302,
        redirect: '/?authError=TOKEN_EXCHANGE_FAILED',
        cookies: [createClearOAuthStateCookie()]
      };
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 5. Fetch verified user identity from Google OpenID Connect UserInfo endpoint
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userInfoResponse.ok) {
      return {
        status: 302,
        redirect: '/?authError=USER_INFO_FAILED',
        cookies: [createClearOAuthStateCookie()]
      };
    }

    const googleUser = await userInfoResponse.json();
    const googleId = googleUser.sub;
    const email = normalizeEmail(googleUser.email);
    const name = googleUser.name || 'Student';
    const avatarUrl = googleUser.picture || null;

    if (!googleId || !email) {
      return {
        status: 302,
        redirect: '/?authError=INCOMPLETE_PROFILE',
        cookies: [createClearOAuthStateCookie()]
      };
    }

    // 6. Find or create user in Neon PostgreSQL
    let user = await findUserByGoogleId(googleId);

    if (!user) {
      // Check if user with this email already exists (e.g. from prior email/password signup)
      const existingEmailUser = await findUserByEmail(email);
      if (existingEmailUser) {
        // Link the Google account to the existing account
        user = await linkGoogleAccount(existingEmailUser.id, googleId, avatarUrl);
      } else {
        // Create new student account via Google OAuth
        user = await insertUser({
          id: crypto.randomUUID(),
          email,
          password_hash: null, // Google OAuth accounts do not require a local password
          name,
          university: 'Sanjay Ghodawat University',
          course: 'B.Tech',
          branch: 'Artificial Intelligence & Machine Learning',
          year: '2nd Year',
          semester: 'Semester III',
          preferred_language: 'en',
          google_id: googleId,
          auth_provider: 'google',
          avatar_url: avatarUrl
        });
      }
    } else if (avatarUrl && !user.avatar_url) {
      // Update avatar if newly available
      try {
        user = await linkGoogleAccount(user.id, googleId, avatarUrl);
      } catch {}
    }

    // 7. Establish persistent session in Neon
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 days

    await insertSession({
      id: crypto.randomUUID(),
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt
    });

    const sessionCookie = createSessionCookie(rawToken);
    const clearStateCookie = createClearOAuthStateCookie();

    return {
      status: 302,
      redirect: '/?auth=google_success',
      cookies: [sessionCookie, clearStateCookie]
    };
  } catch (err: any) {
    console.error('Error during Google OAuth callback processing:', err);
    if (err instanceof DatabaseConfigurationError || err?.name === 'DatabaseConfigurationError') {
      return {
        status: 302,
        redirect: '/?authError=DATABASE_UNAVAILABLE',
        cookies: [createClearOAuthStateCookie()]
      };
    }
    return {
      status: 302,
      redirect: '/?authError=OAUTH_SERVER_ERROR',
      cookies: [createClearOAuthStateCookie()]
    };
  }
}
