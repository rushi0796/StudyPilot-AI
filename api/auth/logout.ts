import { 
  getSessionTokenFromRequest, 
  hashSessionToken, 
  createClearSessionCookie 
} from '../authUtils.ts';
import { deleteSessionByTokenHash } from '../db.ts';

export async function processLogout(req: any) {
  const token = getSessionTokenFromRequest(req);
  if (token) {
    const tokenHash = hashSessionToken(token);
    try {
      await deleteSessionByTokenHash(tokenHash);
    } catch {
      // Ignore database delete errors on logout
    }
  }

  return {
    status: 200,
    cookie: createClearSessionCookie(),
    body: {
      success: true,
      message: 'Logged out successfully.'
    }
  };
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

  try {
    const result = await processLogout(req);
    res.setHeader('Set-Cookie', result.cookie);
    return res.status(result.status).json(result.body);
  } catch (err: any) {
    return res.status(500).json({
      error: {
        message: 'Internal server error during logout.',
        code: 'LOGOUT_ERROR'
      }
    });
  }
}
