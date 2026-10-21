import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { parseCookie, stringifySetCookie } from 'cookie';
import { neon } from '@neondatabase/serverless';

/* ==========================================================================
   1. TYPES & DATA MODELS
   ========================================================================== */

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string | null;
  name: string;
  university?: string;
  course?: string;
  branch?: string;
  year?: string;
  semester?: string;
  preferred_language?: string;
  avatar_url?: string;
  auth_provider?: string;
  google_id?: string;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
}

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
  authProvider: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  user_agent?: string;
  ip_address?: string;
}

export class DatabaseConfigurationError extends Error {
  constructor(message = 'Production database is not configured. Neon PostgreSQL connection string (POSTGRES_URL or DATABASE_URL) is required.') {
    super(message);
    this.name = 'DatabaseConfigurationError';
  }
}

/* ==========================================================================
   2. DATABASE CONNECTION & IN-MEMORY FALLBACK (DEV ONLY)
   ========================================================================== */

const memoryUsers = new Map<string, UserRecord>();
const memorySessions = new Map<string, SessionRecord>();
let schemaInitialized = false;

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

export function getActiveDatabaseEnvVar(): string | null {
  if (process.env.POSTGRES_URL) return 'POSTGRES_URL';
  if (process.env.DATABASE_URL) return 'DATABASE_URL';
  if (process.env.POSTGRES_PRISMA_URL) return 'POSTGRES_PRISMA_URL';
  if (process.env.POSTGRES_URL_NON_POOLING) return 'POSTGRES_URL_NON_POOLING';
  return null;
}

export function getDatabaseConnectionString(): string | null {
  const url =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    '';
  return url.trim() ? url.trim() : null;
}

export function isNeonConfigured(): boolean {
  return Boolean(getDatabaseConnectionString());
}

export function getDatabaseStatus(): {
  configured: boolean;
  activeEnvVar: string | null;
  storageType: 'neon_postgres' | 'ephemeral_memory';
  isPersistent: boolean;
  notice?: string;
} {
  const activeVar = getActiveDatabaseEnvVar();
  const configured = Boolean(activeVar);
  const isProd = isProductionEnvironment();

  if (configured) {
    return {
      configured: true,
      activeEnvVar: activeVar,
      storageType: 'neon_postgres',
      isPersistent: true
    };
  }

  return {
    configured: false,
    activeEnvVar: null,
    storageType: isProd ? 'neon_postgres' : 'ephemeral_memory',
    isPersistent: false,
    notice: isProd
      ? 'CRITICAL: Neon PostgreSQL is NOT configured in production. Ephemeral memory fallback is disabled; database operations will fail until POSTGRES_URL or DATABASE_URL is configured in Vercel.'
      : 'POSTGRES_URL is not configured. Running in ephemeral in-memory fallback mode for local development.'
  };
}

export async function queryNeon<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  const connectionString = getDatabaseConnectionString();
  if (!connectionString) {
    throw new DatabaseConfigurationError();
  }
  const sql = neon(connectionString);
  if (typeof (sql as any).query === 'function') {
    const result = await (sql as any).query(queryText, params && params.length > 0 ? params : []);
    return (result as T[]) || [];
  }
  const result = await (sql as any)(queryText, params);
  return (result as T[]) || [];
}

export async function ensureDatabaseSchema(): Promise<void> {
  if (schemaInitialized) return;
  if (!isNeonConfigured()) {
    if (isProductionEnvironment()) throw new DatabaseConfigurationError();
    schemaInitialized = true;
    return;
  }

  try {
    await queryNeon(`
      CREATE TABLE IF NOT EXISTS studypilot_users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        university VARCHAR(255) DEFAULT 'Sanjay Ghodawat University',
        course VARCHAR(255) DEFAULT 'B.Tech',
        branch VARCHAR(255) DEFAULT 'AIML',
        year VARCHAR(64) DEFAULT '2nd Year',
        semester VARCHAR(64) DEFAULT 'Semester III',
        preferred_language VARCHAR(32) DEFAULT 'en',
        avatar_url TEXT,
        auth_provider VARCHAR(32) DEFAULT 'local',
        google_id VARCHAR(128) UNIQUE,
        onboarding_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure non-destructive schema migration for existing databases
    await queryNeon('ALTER TABLE studypilot_users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;');

    await queryNeon(`
      CREATE TABLE IF NOT EXISTS studypilot_sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES studypilot_users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address VARCHAR(128)
      );
    `);

    await queryNeon('CREATE INDEX IF NOT EXISTS idx_studypilot_users_email ON studypilot_users(email);');
    await queryNeon('CREATE INDEX IF NOT EXISTS idx_studypilot_sessions_token_hash ON studypilot_sessions(token_hash);');
    await queryNeon('CREATE INDEX IF NOT EXISTS idx_studypilot_sessions_user_id ON studypilot_sessions(user_id);');

    schemaInitialized = true;
  } catch (err: any) {
    schemaInitialized = false;
    throw err;
  }
}

export async function checkDatabaseHealth() {
  const activeEnvVar = getActiveDatabaseEnvVar();
  const connString = getDatabaseConnectionString();
  const configured = Boolean(connString);
  const isProduction = isProductionEnvironment();

  if (!configured) {
    return {
      configured: false,
      activeEnvVar: null,
      connected: false,
      storageType: isProduction ? 'neon_postgres' : 'ephemeral_memory',
      isPersistent: false,
      status: isProduction ? 'database_unconfigured' : 'unconfigured_fallback',
      tablesExist: false,
      latencyMs: undefined,
      notice: isProduction
        ? 'CRITICAL: Neon PostgreSQL is NOT configured in production. Ephemeral memory fallback is disabled; database operations will fail until POSTGRES_URL or DATABASE_URL is configured in Vercel.'
        : 'Running in ephemeral in-memory fallback for local development.'
    };
  }

  try {
    const sql = neon(connString!);
    const startTime = Date.now();
    await sql`SELECT 1;`;
    const latencyMs = Date.now() - startTime;

    const rows: any[] = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('studypilot_users', 'studypilot_sessions');
    `;
    const tableNames = new Set(rows.map((r: any) => r.table_name));
    const tablesExist = tableNames.has('studypilot_users') && tableNames.has('studypilot_sessions');

    return {
      configured: true,
      activeEnvVar,
      connected: true,
      storageType: 'neon_postgres',
      isPersistent: true,
      status: tablesExist ? 'healthy' : 'pending_migration',
      tablesExist,
      latencyMs,
      notice: tablesExist 
        ? 'Neon PostgreSQL database is online and authentication tables are verified.'
        : 'Neon PostgreSQL is connected. Authentication tables will be created automatically on next request.'
    };
  } catch (err: any) {
    return {
      configured: true,
      activeEnvVar,
      connected: false,
      storageType: 'neon_postgres',
      isPersistent: true,
      status: 'connection_error',
      tablesExist: false,
      latencyMs: undefined,
      notice: `Neon PostgreSQL connection probe failed: ${err?.message || 'Network error'}`
    };
  }
}

export async function checkDatabaseTables(): Promise<{
  usersTable: boolean;
  sessionsTable: boolean;
  allTablesExist: boolean;
}> {
  if (!isNeonConfigured()) {
    return { usersTable: false, sessionsTable: false, allTablesExist: false };
  }

  try {
    const rows = await queryNeon<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
         AND table_name IN ('studypilot_users', 'studypilot_sessions');`
    );
    const tableNames = new Set(rows.map(r => r.table_name));
    const usersTable = tableNames.has('studypilot_users');
    const sessionsTable = tableNames.has('studypilot_sessions');
    return {
      usersTable,
      sessionsTable,
      allTablesExist: usersTable && sessionsTable
    };
  } catch (err: any) {
    return { usersTable: false, sessionsTable: false, allTablesExist: false };
  }
}

export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  latencyMs?: number;
  tablesExist?: boolean;
  error?: string;
}> {
  if (!isNeonConfigured()) {
    return {
      connected: false,
      tablesExist: false,
      error: 'Database connection string is not configured.'
    };
  }

  try {
    const connString = getDatabaseConnectionString();
    const sql = neon(connString!);
    const startTime = Date.now();
    await sql`SELECT 1;`;
    const latencyMs = Date.now() - startTime;
    const tables = await checkDatabaseTables();

    return {
      connected: true,
      latencyMs,
      tablesExist: tables.allTablesExist
    };
  } catch (err: any) {
    return {
      connected: false,
      tablesExist: false,
      error: err?.message || 'Connection test failed.'
    };
  }
}

export function _resetMemoryDb(): void {
  memoryUsers.clear();
  memorySessions.clear();
  schemaInitialized = false;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normEmail = email.toLowerCase().trim();
  if (!isNeonConfigured()) {
    if (isProductionEnvironment()) throw new DatabaseConfigurationError();
    return memoryUsers.get(normEmail) || null;
  }
  await ensureDatabaseSchema();
  const rows = await queryNeon<UserRecord>(
    'SELECT * FROM studypilot_users WHERE LOWER(email) = LOWER($1) LIMIT 1;',
    [normEmail]
  );
  return rows[0] || null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  if (!isNeonConfigured()) {
    if (isProductionEnvironment()) throw new DatabaseConfigurationError();
    for (const u of memoryUsers.values()) {
      if (u.id === id) return u;
    }
    return null;
  }
  await ensureDatabaseSchema();
  const rows = await queryNeon<UserRecord>(
    'SELECT * FROM studypilot_users WHERE id = $1 LIMIT 1;',
    [id]
  );
  return rows[0] || null;
}

export async function findUserByGoogleId(googleId: string): Promise<UserRecord | null> {
  if (!isNeonConfigured()) {
    for (const u of memoryUsers.values()) {
      if (u.google_id === googleId) return u;
    }
    return null;
  }
  await ensureDatabaseSchema();
  const rows = await queryNeon<UserRecord>(
    'SELECT * FROM studypilot_users WHERE google_id = $1 LIMIT 1;',
    [googleId]
  );
  return rows[0] || null;
}

export async function linkGoogleAccount(userId: string, googleId: string, avatarUrl?: string): Promise<UserRecord | null> {
  if (!isNeonConfigured()) {
    for (const u of memoryUsers.values()) {
      if (u.id === userId) {
        u.google_id = googleId;
        if (avatarUrl) u.avatar_url = avatarUrl;
        return u;
      }
    }
    return null;
  }
  await ensureDatabaseSchema();
  const rows = await queryNeon<UserRecord>(
    `UPDATE studypilot_users 
     SET google_id = $1, avatar_url = COALESCE($2, avatar_url), updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 
     RETURNING *;`,
    [googleId, avatarUrl || null, userId]
  );
  return rows[0] || null;
}

export async function insertUser(userData: Omit<UserRecord, 'created_at' | 'updated_at'>): Promise<UserRecord> {
  const normEmail = userData.email.toLowerCase().trim();
  const now = new Date().toISOString();
  const record: UserRecord = {
    ...userData,
    email: normEmail,
    onboarding_completed: Boolean(userData.onboarding_completed),
    created_at: now,
    updated_at: now
  };

  if (!isNeonConfigured()) {
    if (isProductionEnvironment()) throw new DatabaseConfigurationError();
    memoryUsers.set(normEmail, record);
    return record;
  }

  await ensureDatabaseSchema();
  const rows = await queryNeon<UserRecord>(
    `INSERT INTO studypilot_users (
       id, email, password_hash, name, university, course, branch, year, semester, preferred_language, avatar_url, auth_provider, google_id, onboarding_completed
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *;`,
    [
      record.id,
      record.email,
      record.password_hash,
      record.name,
      record.university || 'Sanjay Ghodawat University',
      record.course || 'B.Tech',
      record.branch || 'AIML',
      record.year || '2nd Year',
      record.semester || 'Semester III',
      record.preferred_language || 'en',
      record.avatar_url || null,
      record.auth_provider || 'local',
      record.google_id || null,
      Boolean(record.onboarding_completed)
    ]
  );
  return rows[0];
}

export async function insertSession(sessionData: Omit<SessionRecord, 'created_at'>): Promise<SessionRecord> {
  const now = new Date().toISOString();
  const record: SessionRecord = {
    ...sessionData,
    created_at: now
  };

  if (!isNeonConfigured()) {
    if (isProductionEnvironment()) throw new DatabaseConfigurationError();
    memorySessions.set(record.token_hash, record);
    return record;
  }

  await ensureDatabaseSchema();
  const rows = await queryNeon<SessionRecord>(
    `INSERT INTO studypilot_sessions (
       id, user_id, token_hash, expires_at, user_agent, ip_address
     ) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *;`,
    [
      record.id,
      record.user_id,
      record.token_hash,
      record.expires_at,
      record.user_agent || null,
      record.ip_address || null
    ]
  );
  return rows[0];
}

export async function findUserBySessionToken(token: string): Promise<UserRecord | null> {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const now = new Date().toISOString();

  if (!isNeonConfigured()) {
    if (isProductionEnvironment()) throw new DatabaseConfigurationError();
    const sess = memorySessions.get(tokenHash);
    if (!sess) return null;
    if (new Date(sess.expires_at).getTime() < Date.now()) {
      memorySessions.delete(tokenHash);
      return null;
    }
    return findUserById(sess.user_id);
  }

  await ensureDatabaseSchema();
  const rows = await queryNeon<UserRecord>(
    `SELECT u.* FROM studypilot_users u
     JOIN studypilot_sessions s ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > $2
     LIMIT 1;`,
    [tokenHash, now]
  );
  return rows[0] || null;
}

export async function deleteSession(token: string): Promise<void> {
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  if (!isNeonConfigured()) {
    memorySessions.delete(tokenHash);
    return;
  }
  await ensureDatabaseSchema();
  await queryNeon('DELETE FROM studypilot_sessions WHERE token_hash = $1;', [tokenHash]);
}

/* ==========================================================================
   3. AUTH UTILITIES, CRYPTO & RATE LIMITING
   ========================================================================== */

export const SESSION_COOKIE_NAME = 'studypilot_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const BCRYPT_SALT_ROUNDS = 10;

export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const cleaned = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return cleaned.length <= 255 && emailRegex.test(cleaned);
}

export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required.' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password cannot exceed 128 characters.' };
  }
  return { valid: true };
}

export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  if (!plainText || !hash) return false;
  return await bcrypt.compare(plainText, hash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  return stringifySetCookie({
    name: SESSION_COOKIE_NAME,
    value: token,
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export function createClearSessionCookie(): string {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  return stringifySetCookie({
    name: SESSION_COOKIE_NAME,
    value: '',
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 0
  });
}

export function getSessionTokenFromRequest(req: any): string | null {
  const cookieHeader = req?.headers?.cookie || req?.headers?.Cookie || '';
  if (cookieHeader) {
    try {
      const parsed = parseCookie(cookieHeader);
      if (parsed[SESSION_COOKIE_NAME]) {
        return parsed[SESSION_COOKIE_NAME];
      }
    } catch {}
  }
  const authHeader = req?.headers?.authorization || req?.headers?.Authorization || '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

export function getClientIp(req: any): string {
  const xForwardedFor = req?.headers?.['x-forwarded-for'];
  if (typeof xForwardedFor === 'string') {
    return xForwardedFor.split(',')[0].trim();
  }
  return req?.headers?.['x-real-ip'] || req?.socket?.remoteAddress || '127.0.0.1';
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= maxAttempts) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  record.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function _resetRateLimits(): void {
  rateLimitStore.clear();
}

export function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    university: user.university || 'Sanjay Ghodawat University',
    course: user.course || 'B.Tech',
    branch: user.branch || 'AIML',
    year: user.year || '2nd Year',
    semester: user.semester || 'Semester III',
    preferredLanguage: user.preferred_language || 'en',
    avatarUrl: user.avatar_url || undefined,
    authProvider: user.auth_provider || 'local',
    onboardingCompleted: Boolean(user.onboarding_completed),
    createdAt: user.created_at
  };
}

// Google OAuth State Helpers (Preserved for compatibility)
export function generateOAuthState(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function createOAuthStateCookie(state: string): string {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  return stringifySetCookie({
    name: 'studypilot_oauth_state',
    value: state,
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 60 * 10
  });
}

export function getOAuthStateFromRequest(req: any): string | null {
  const cookieHeader = req?.headers?.cookie || req?.headers?.Cookie || '';
  if (!cookieHeader) return null;
  try {
    const parsed = parseCookie(cookieHeader);
    return parsed['studypilot_oauth_state'] || null;
  } catch {
    return null;
  }
}

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    configured: Boolean(clientId.trim() && clientSecret.trim())
  };
}

export function processGoogleStart(req: any) {
  const config = getGoogleOAuthConfig();
  if (!config.configured) {
    return {
      status: 302,
      redirect: '/?authError=GOOGLE_NOT_CONFIGURED',
      cookie: null
    };
  }
  const state = generateOAuthState();
  const stateCookie = createOAuthStateCookie(state);
  const redirectUri = `https://${req.headers?.host || 'localhost:5173'}/api/auth/google/callback`;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(config.clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=${state}`;
  return {
    status: 302,
    redirect: authUrl,
    cookie: stateCookie
  };
}

export async function processGoogleCallback(req: any, query: any) {
  const stateInCookie = getOAuthStateFromRequest(req);
  if (!query?.state || !stateInCookie || query.state !== stateInCookie) {
    return {
      status: 302,
      redirect: '/?authError=INVALID_OAUTH_STATE',
      cookie: null
    };
  }
  if (query?.error) {
    return {
      status: 302,
      redirect: `/?authError=${encodeURIComponent(query.error)}`,
      cookie: null
    };
  }
  return {
    status: 302,
    redirect: '/?authSuccess=true',
    cookie: null
  };
}

/* ==========================================================================
   4. ACTION PROCESSORS: SIGNUP, LOGIN, ME, LOGOUT
   ========================================================================== */

export async function processSignup(body: any, clientIp = '127.0.0.1') {
  const ipRate = checkRateLimit(`signup:ip:${clientIp}`, 10, 600);
  if (!ipRate.allowed) {
    return {
      status: 429,
      body: {
        error: {
          message: `Too many registration attempts. Please retry after ${ipRate.retryAfterSeconds} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfterSeconds: ipRate.retryAfterSeconds
        }
      }
    };
  }

  const { email, password, confirmPassword, name, university, course, branch, year, semester, preferredLanguage } = body || {};

  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim() : '';
  const cleanPw = typeof password === 'string' ? password : '';
  const cleanUni = typeof university === 'string' && university.trim() ? university.trim() : 'Sanjay Ghodawat University';
  const cleanCourse = typeof course === 'string' && course.trim() ? course.trim() : 'B.Tech';
  const cleanBranch = typeof branch === 'string' && branch.trim() ? branch.trim() : 'AIML';
  const cleanYear = typeof year === 'string' && year.trim() ? year.trim() : '2nd Year';
  const cleanSemester = typeof semester === 'string' && semester.trim() ? semester.trim() : 'Semester III';
  const cleanLang = typeof preferredLanguage === 'string' && preferredLanguage.trim() ? preferredLanguage.trim() : 'en';

  if (!cleanName || !cleanEmail || !cleanPw) {
    return {
      status: 400,
      body: { error: { message: 'Name, email, and password are required.', code: 'INVALID_INPUT' } }
    };
  }

  if (cleanName.length < 2 || cleanName.length > 70) {
    return {
      status: 400,
      body: { error: { message: 'Student name must be between 2 and 70 characters.', code: 'INVALID_NAME_LENGTH' } }
    };
  }

  if (cleanEmail.length < 5 || cleanEmail.length > 254 || !isValidEmail(cleanEmail)) {
    return {
      status: 400,
      body: { error: { message: 'A valid university email address (maximum 254 characters) is required.', code: 'INVALID_EMAIL' } }
    };
  }

  if (cleanPw.length < 8 || cleanPw.length > 100) {
    return {
      status: 400,
      body: { error: { message: 'Password must be between 8 and 100 characters long.', code: 'WEAK_PASSWORD' } }
    };
  }

  if (confirmPassword !== undefined && cleanPw !== confirmPassword) {
    return {
      status: 400,
      body: { error: { message: 'Passwords do not match. Please re-enter your password.', code: 'PASSWORD_MISMATCH' } }
    };
  }

  if (cleanUni.length > 100) {
    return {
      status: 400,
      body: { error: { message: 'University name cannot exceed 100 characters.', code: 'INVALID_UNIVERSITY_LENGTH' } }
    };
  }

  if (cleanCourse.length > 80 || cleanBranch.length > 80) {
    return {
      status: 400,
      body: { error: { message: 'Course and Branch cannot exceed 80 characters.', code: 'INVALID_COURSE_LENGTH' } }
    };
  }

  if (cleanYear.length > 30 || cleanSemester.length > 30) {
    return {
      status: 400,
      body: { error: { message: 'Academic Year and Semester cannot exceed 30 characters.', code: 'INVALID_TERM_LENGTH' } }
    };
  }

  try {
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return {
        status: 409,
        body: { error: { message: 'An account with this email address already exists. Please sign in.', code: 'EMAIL_ALREADY_EXISTS' } }
      };
    }

    const passwordHash = await hashPassword(cleanPw);
    const userId = crypto.randomUUID();
    const newUser = await insertUser({
      id: userId,
      email: normalizeEmail(cleanEmail),
      password_hash: passwordHash,
      name: cleanName,
      university: cleanUni,
      course: cleanCourse,
      branch: cleanBranch,
      year: cleanYear,
      semester: cleanSemester,
      preferred_language: cleanLang.slice(0, 10),
      auth_provider: 'local',
      onboarding_completed: false
    });

    // NOTE: In the authenticated user journey, signup does NOT issue a session token.
    // The student is directed to the Login screen with email prefilled, ensuring explicit credentials verification.
    return {
      status: 201,
      body: {
        success: true,
        message: 'Account created successfully! Please sign in with your email and password.',
        requiresLogin: true,
        email: normalizeEmail(cleanEmail),
        user: toSafeUser(newUser)
      }
    };
  } catch (err: any) {
    if (err instanceof DatabaseConfigurationError) {
      return {
        status: 503,
        body: {
          error: {
            message: 'Database service is currently unavailable. Neon database configuration is required.',
            code: 'DATABASE_UNAVAILABLE'
          }
        }
      };
    }
    return {
      status: 500,
      body: { error: { message: err?.message ? `Internal error during signup: ${err.message}` : 'Internal error during signup.', code: 'INTERNAL_ERROR' } }
    };
  }
}

export async function processCompleteOnboarding(req: any, body: any) {
  const token = getSessionTokenFromRequest(req);
  if (!token) {
    return {
      status: 401,
      body: { error: { message: 'Authentication required to complete onboarding.', code: 'UNAUTHENTICATED' } }
    };
  }

  const user = await findUserBySessionToken(token);
  if (!user) {
    return {
      status: 401,
      body: { error: { message: 'Invalid or expired session. Please sign in again.', code: 'SESSION_EXPIRED' } }
    };
  }

  const { university, course, branch, year, semester, preferredLanguage } = body || {};
  const updatedUniversity = typeof university === 'string' && university.trim() ? university.trim().slice(0, 100) : user.university;
  const updatedCourse = typeof course === 'string' && course.trim() ? course.trim().slice(0, 80) : user.course;
  const updatedBranch = typeof branch === 'string' && branch.trim() ? branch.trim().slice(0, 80) : user.branch;
  const updatedYear = typeof year === 'string' && year.trim() ? year.trim().slice(0, 30) : user.year;
  const updatedSemester = typeof semester === 'string' && semester.trim() ? semester.trim().slice(0, 30) : user.semester;
  const updatedLanguage = typeof preferredLanguage === 'string' && preferredLanguage.trim() ? preferredLanguage.trim().slice(0, 10) : user.preferred_language;

  if (!isNeonConfigured()) {
    if (isProductionEnvironment()) throw new DatabaseConfigurationError();
    user.onboarding_completed = true;
    user.university = updatedUniversity;
    user.course = updatedCourse;
    user.branch = updatedBranch;
    user.year = updatedYear;
    user.semester = updatedSemester;
    user.preferred_language = updatedLanguage;
    user.updated_at = new Date().toISOString();
    return {
      status: 200,
      body: { success: true, message: 'Onboarding completed successfully.', user: toSafeUser(user) }
    };
  }

  await ensureDatabaseSchema();
  const rows = await queryNeon<UserRecord>(
    `UPDATE studypilot_users 
     SET onboarding_completed = TRUE,
         university = COALESCE($2, university),
         course = COALESCE($3, course),
         branch = COALESCE($4, branch),
         year = COALESCE($5, year),
         semester = COALESCE($6, semester),
         preferred_language = COALESCE($7, preferred_language),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *;`,
    [user.id, updatedUniversity, updatedCourse, updatedBranch, updatedYear, updatedSemester, updatedLanguage]
  );

  const updatedUser = rows[0] || { ...user, onboarding_completed: true };
  return {
    status: 200,
    body: {
      success: true,
      message: 'Onboarding completed successfully.',
      user: toSafeUser(updatedUser)
    }
  };
}

export async function processLogin(body: any, clientIp = '127.0.0.1') {
  const ipRate = checkRateLimit(`login:ip:${clientIp}`, 15, 60);
  if (!ipRate.allowed) {
    return {
      status: 429,
      body: {
        error: {
          message: `Too many login attempts. Please wait ${ipRate.retryAfterSeconds} seconds before trying again.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfterSeconds: ipRate.retryAfterSeconds
        }
      }
    };
  }

  const { email, password } = body || {};
  if (!email || !password) {
    return {
      status: 400,
      body: { error: { message: 'Email and password are required.', code: 'INVALID_INPUT' } }
    };
  }

  try {
    const user = await findUserByEmail(email);
    if (!user || !user.password_hash) {
      return {
        status: 401,
        body: { error: { message: 'Invalid email address or password. Please check your credentials.', code: 'INVALID_CREDENTIALS' } }
      };
    }

    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      return {
        status: 401,
        body: { error: { message: 'Invalid email address or password. Please check your credentials.', code: 'INVALID_CREDENTIALS' } }
      };
    }

    const sessionToken = generateSessionToken();
    const tokenHash = hashSessionToken(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();

    await insertSession({
      id: crypto.randomUUID(),
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      ip_address: clientIp
    });

    const cookieHeader = createSessionCookie(sessionToken);

    return {
      status: 200,
      cookie: cookieHeader,
      body: {
        success: true,
        message: 'Sign in successful.',
        user: toSafeUser(user),
        token: sessionToken,
        session: { token: sessionToken, expiresAt }
      }
    };
  } catch (err: any) {
    if (err instanceof DatabaseConfigurationError) {
      return {
        status: 503,
        body: {
          error: {
            message: 'Database service is currently unavailable. Neon database configuration is required.',
            code: 'DATABASE_UNAVAILABLE'
          }
        }
      };
    }
    return {
      status: 500,
      body: { error: { message: err?.message ? `Internal error during login: ${err.message}` : 'Internal error during login.', code: 'INTERNAL_ERROR' } }
    };
  }
}

export async function processGetCurrentUser(req: any) {
  const token = getSessionTokenFromRequest(req);
  if (!token) {
    return {
      status: 401,
      body: { error: { message: 'No active session found. Please sign in.', code: 'UNAUTHENTICATED' } }
    };
  }

  try {
    const user = await findUserBySessionToken(token);
    if (!user) {
      return {
        status: 401,
        cookie: createClearSessionCookie(),
        body: { error: { message: 'Session expired or invalidated. Please sign in again.', code: 'SESSION_EXPIRED' } }
      };
    }

    return {
      status: 200,
      body: { authenticated: true, user: toSafeUser(user) }
    };
  } catch (err: any) {
    if (err instanceof DatabaseConfigurationError) {
      return {
        status: 503,
        body: {
          error: {
            message: 'Database service is currently unavailable.',
            code: 'DATABASE_UNAVAILABLE'
          }
        }
      };
    }
    return {
      status: 500,
      body: { error: { message: 'Internal error retrieving current user session.', code: 'INTERNAL_ERROR' } }
    };
  }
}

export async function processLogout(req: any) {
  const token = getSessionTokenFromRequest(req);
  if (token) {
    try {
      await deleteSession(token);
    } catch {}
  }

  return {
    status: 200,
    cookie: createClearSessionCookie(),
    body: { success: true, message: 'Logged out successfully.' }
  };
}

/* ==========================================================================
   5. UNIFIED DISPATCHER (DEFAULT EXPORT)
   ========================================================================== */

export default async function authHandler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', req.headers?.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  if (!req.query && url.includes('?')) {
    try {
      const urlObj = new URL(url, 'http://localhost');
      req.query = Object.fromEntries(urlObj.searchParams.entries());
    } catch {
      req.query = {};
    }
  }

  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      req.body = JSON.parse(req.body);
    } catch {}
  }

  const subroute = String(req.query?.subroute || req.query?.action || req.query?.path || '').toLowerCase();
  const matchedPath = String(req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || '').toLowerCase();
  const rawUrl = url.toLowerCase();
  const target = `${rawUrl} ${subroute} ${matchedPath}`;
  const clientIp = getClientIp(req);

  // Google OAuth Endpoints (disabled for presentation)
  if (target.includes('google/start') || target.includes('google-start') || subroute === 'google/start' ||
      target.includes('google/callback') || target.includes('google-callback') || subroute === 'google/callback') {
    return res.status(501).json({
      error: {
        message: 'Google authentication is temporarily disabled. Please sign in with email and password.',
        code: 'GOOGLE_AUTH_DISABLED'
      }
    });
  }

  // Signup
  if (target.includes('signup') || subroute === 'signup') {
    const result = await processSignup(req.body || {}, clientIp);
    if (result.cookie) res.setHeader('Set-Cookie', result.cookie);
    return res.status(result.status).json(result.body);
  }

  // Login
  if (target.includes('login') || subroute === 'login') {
    const result = await processLogin(req.body || {}, clientIp);
    if (result.cookie) res.setHeader('Set-Cookie', result.cookie);
    return res.status(result.status).json(result.body);
  }

  // Current session (me)
  if (target.includes('/me') || subroute === 'me' || target.endsWith(' me')) {
    const result = await processGetCurrentUser(req);
    if (result.cookie) res.setHeader('Set-Cookie', result.cookie);
    return res.status(result.status).json(result.body);
  }

  // Onboarding completion
  if (target.includes('onboarding') || subroute === 'onboarding') {
    const result = await processCompleteOnboarding(req, req.body || {});
    if (result.cookie) res.setHeader('Set-Cookie', result.cookie);
    return res.status(result.status).json(result.body);
  }

  // Logout
  if (target.includes('logout') || subroute === 'logout') {
    const result = await processLogout(req);
    if (result.cookie) res.setHeader('Set-Cookie', result.cookie);
    return res.status(result.status).json(result.body);
  }

  return res.status(404).json({
    error: {
      message: 'Unknown authentication route. Supported routes: /signup, /login, /me, /logout',
      code: 'AUTH_ROUTE_NOT_FOUND'
    }
  });
}
