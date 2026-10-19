import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { parseCookie, stringifySetCookie } from 'cookie';

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  university: string;
  course: string;
  branch: string;
  year: string;
  semester: string;
  preferredLanguage: string;
  avatarUrl?: string;
  authProvider?: string;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  email: string;
  password_hash?: string | null;
  name: string;
  university?: string;
  course?: string;
  branch?: string;
  year?: string;
  semester?: string;
  preferred_language?: string;
  google_id?: string | null;
  auth_provider?: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string | Date;
  created_at?: string | Date;
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return Boolean(normalized && normalized.length <= 254 && EMAIL_REGEX.test(normalized));
}

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required.' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password cannot exceed 128 characters.' };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash?: string | null): Promise<boolean> {
  if (!hash) return false;
  return await bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function generateOAuthState(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function getSessionTokenFromRequest(req: any): string | null {
  const cookieHeader = req?.headers?.cookie || req?.headers?.Cookie || '';
  if (cookieHeader) {
    try {
      const cookies = parseCookie(cookieHeader);
      if (cookies?.studypilot_session) {
        return cookies.studypilot_session;
      }
    } catch {
      // Ignore malformed cookies
    }
  }

  const authHeader = req?.headers?.authorization || req?.headers?.Authorization || '';
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export function getOAuthStateFromRequest(req: any): string | null {
  const cookieHeader = req?.headers?.cookie || req?.headers?.Cookie || '';
  if (cookieHeader) {
    try {
      const cookies = parseCookie(cookieHeader);
      if (cookies?.studypilot_oauth_state) {
        return cookies.studypilot_oauth_state;
      }
    } catch {
      // Ignore malformed cookies
    }
  }
  return null;
}

export function createSessionCookie(token: string, maxAgeSeconds: number = 30 * 24 * 3600): string {
  const isProd = process.env.NODE_ENV === 'production';
  return stringifySetCookie({
    name: 'studypilot_session',
    value: token,
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: isProd,
    maxAge: maxAgeSeconds,
    expires: new Date(Date.now() + maxAgeSeconds * 1000)
  });
}

export function createClearSessionCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  return stringifySetCookie({
    name: 'studypilot_session',
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: isProd,
    maxAge: 0,
    expires: new Date(0)
  });
}

export function createOAuthStateCookie(state: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  // State cookie valid for 10 minutes
  return stringifySetCookie({
    name: 'studypilot_oauth_state',
    value: state,
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: isProd,
    maxAge: 600,
    expires: new Date(Date.now() + 600 * 1000)
  });
}

export function createClearOAuthStateCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  return stringifySetCookie({
    name: 'studypilot_oauth_state',
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: isProd,
    maxAge: 0,
    expires: new Date(0)
  });
}

// In-memory sliding-window rate limiter
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string, 
  maxAttempts: number, 
  windowSeconds: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= maxAttempts) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(retryAfter, 1) };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(req: any): string {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req?.socket?.remoteAddress || req?.connection?.remoteAddress || '127.0.0.1';
}

export function _resetRateLimits(): void {
  rateLimitMap.clear();
}

export function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    university: user.university || 'Sanjay Ghodawat University',
    course: user.course || 'B.Tech',
    branch: user.branch || 'Artificial Intelligence & Machine Learning',
    year: user.year || '2nd Year',
    semester: user.semester || 'Semester III',
    preferredLanguage: user.preferred_language || 'en',
    avatarUrl: user.avatar_url || undefined,
    authProvider: user.auth_provider || 'local',
    createdAt: user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString()
  };
}
