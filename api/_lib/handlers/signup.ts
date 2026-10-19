import crypto from 'crypto';
import { 
  normalizeEmail, 
  isValidEmail, 
  validatePasswordStrength, 
  hashPassword, 
  generateSessionToken, 
  hashSessionToken, 
  createSessionCookie, 
  toSafeUser,
  checkRateLimit,
  getClientIp 
} from '../authUtils.ts';
import { findUserByEmail, insertUser, insertSession, DatabaseConfigurationError } from '../db.ts';

export async function processSignup(body: any) {
  const email = normalizeEmail(body?.email);
  const password = body?.password;
  const confirmPassword = body?.confirmPassword;
  const name = (body?.name || '').trim();

  // 1. Validate inputs
  if (!isValidEmail(email)) {
    return {
      status: 400,
      body: {
        error: {
          message: 'Please provide a valid student email address.',
          code: 'INVALID_EMAIL'
        }
      }
    };
  }

  if (!name || name.length < 2) {
    return {
      status: 400,
      body: {
        error: {
          message: 'Please provide your full student name (at least 2 characters).',
          code: 'INVALID_NAME'
        }
      }
    };
  }

  const passCheck = validatePasswordStrength(password);
  if (!passCheck.valid) {
    return {
      status: 400,
      body: {
        error: {
          message: passCheck.message || 'Password does not meet requirements.',
          code: 'WEAK_PASSWORD'
        }
      }
    };
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return {
      status: 400,
      body: {
        error: {
          message: 'Passwords do not match. Please verify your password confirmation.',
          code: 'PASSWORD_MISMATCH'
        }
      }
    };
  }

  try {
    // 2. Check for existing user
    const existing = await findUserByEmail(email);
    if (existing) {
      return {
        status: 409,
        body: {
          error: {
            message: 'A student account with this email address already exists. Please log in instead.',
            code: 'EMAIL_ALREADY_EXISTS'
          }
        }
      };
    }

    // 3. Hash password with bcryptjs
    const passwordHash = await hashPassword(password);

    // 4. Create student user record
    const userId = crypto.randomUUID();
    const user = await insertUser({
      id: userId,
      email,
      password_hash: passwordHash,
      name,
      university: (body?.university || 'Sanjay Ghodawat University').trim(),
      course: (body?.course || 'B.Tech').trim(),
      branch: (body?.branch || 'Artificial Intelligence & Machine Learning').trim(),
      year: (body?.year || '2nd Year').trim(),
      semester: (body?.semester || 'Semester III').trim(),
      preferred_language: (body?.preferredLanguage || 'en').trim(),
      auth_provider: 'local'
    });

    // 5. Generate cryptographically secure session token & store hash
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
      status: 201,
      cookie: cookieStr,
      body: {
        message: 'Account created successfully.',
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

  // Rate Limiting: 5 attempts per 10 minutes per IP
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`signup:${clientIp}`, 5, 600);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({
      error: {
        message: `Too many registration attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
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

    const result = await processSignup(body);
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
        message: 'Internal server error during student signup.',
        code: 'SIGNUP_ERROR'
      }
    });
  }
}
