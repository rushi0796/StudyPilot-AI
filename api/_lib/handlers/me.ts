import { 
  getSessionTokenFromRequest, 
  hashSessionToken, 
  createClearSessionCookie, 
  toSafeUser 
} from '../authUtils.ts';
import { findSessionWithUser, DatabaseConfigurationError } from '../db.ts';

export async function processGetCurrentUser(req: any) {
  const token = getSessionTokenFromRequest(req);
  if (!token) {
    return {
      status: 401,
      body: {
        error: {
          message: 'Not authenticated. No valid session token provided.',
          code: 'UNAUTHENTICATED'
        }
      }
    };
  }

  const tokenHash = hashSessionToken(token);

  try {
    const sessionData = await findSessionWithUser(tokenHash);

    if (!sessionData) {
      return {
        status: 401,
        cookie: createClearSessionCookie(),
        body: {
          error: {
            message: 'Session is invalid or has expired. Please sign in again.',
            code: 'SESSION_EXPIRED'
          }
        }
      };
    }

    return {
      status: 200,
      body: {
        user: toSafeUser(sessionData.user)
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method Not Allowed. Use GET.', code: 'METHOD_NOT_ALLOWED' } });
  }

  try {
    const result = await processGetCurrentUser(req);
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
        message: 'Internal server error fetching current student session.',
        code: 'SESSION_ERROR'
      }
    });
  }
}
