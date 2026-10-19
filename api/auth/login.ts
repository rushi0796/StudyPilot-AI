import crypto from 'crypto';
import { 
  normalizeEmail, 
  comparePassword, 
  generateSessionToken, 
  hashSessionToken, 
  createSessionCookie, 
  toSafeUser,
  checkRateLimit,
  getClientIp 
} from '../authUtils.ts';
import { findUserByEmail, insertSession, DatabaseConfigurationError } from '../db.ts';

export async function processLogin(body: any) {
  const email = normalizeEmail(body?.email);
  const password = body?.password;

  if (!email || !password) {
    return {
      status: 400,
      body: {
        error: {
          message: 'Both email and password are required.',
          code: 'MISSING_CREDENTIALS'
        }
      }
    };
  }

  try {
    // 1. Find user by normalized email
    const user = await findUserByEmail(email);
    if (!user) {
      // Constant-time check simulation to protect against timing attacks
      await comparePassword('dummy_password_for_timing', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
      return {
        status: 401,
        body: {
          error: {
            message: 'Invalid email or password.',
            code: 'INVALID_CREDENTIALS'
          }
        }
      };
    }

    // 2. Verify password (if user signed up via OAuth without password, guide them)
    if (!user.password_hash) {
      return {
        status: 401,
        body: {
          error: {
            message: 'This account was created using Google Sign-In. Please click "Continue with Google".',
            code: 'OAUTH_ACCOUNT_PASSWORD_MISSING'
          }
        }
      };
    }

    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return {
        status: 401,
        body: {
          error: {
            message: 'Invalid email or password.',
            code: 'INVALID_CREDENTIALS'
          }
        }
      };
    }

    // 3. Generate session token & store hash
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 days

    await insertSession({
      id: crypto.randomUUID(),
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt
    });

    const cookieStr = createSessionCookie(rawToken);

    return {
      status: 200,
      cookie: cookieStr,
      body: {
        message: 'Logged in successfully.',
        user: toSafeUser(user),
        token: rawToken
      }
    };
  } catch (err: any) {
    if (err instanceof DatabaseConfigurationError || err?.name === 'DatabaseConfigurationError') {
      return {
        status: 503,
        body: {
          error: {
            message: 'Database service unavailable. Production database connection is not configured.',
            code: 'DATABASE_UNAVAILABLE'
          }
        }
      };
    }
    throw err;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed. Use POST.', code: 'METHOD_NOT_ALLOWED' } });
  }

  // Rate Limiting: 10 attempts per minute per IP
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`login:${clientIp}`, 10, 60);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({
      error: {
        message: `Too many login attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    } else if (!body) {
      body = {};
    }

    const result = await processLogin(body);
    if (result.cookie) {
      res.setHeader('Set-Cookie', result.cookie);
    }
    return res.status(result.status).json(result.body);
  } catch (err: any) {
    if (err instanceof DatabaseConfigurationError || err?.name === 'DatabaseConfigurationError') {
      return res.status(503).json({
        error: {
          message: 'Database service unavailable. Production database connection is not configured.',
          code: 'DATABASE_UNAVAILABLE'
        }
      });
    }
    return res.status(500).json({
      error: {
        message: 'Internal server error during student login.',
        code: 'LOGIN_ERROR'
      }
    });
  }
}
