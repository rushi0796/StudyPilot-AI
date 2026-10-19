import { neon } from '@neondatabase/serverless';
import type { UserRecord, SessionRecord } from './authUtils.ts';

// Auto-load local environment file if available in development / CLI
if (typeof process !== 'undefined' && typeof (process as any).loadEnvFile === 'function') {
  try { (process as any).loadEnvFile('.env.local'); } catch {}
  try { (process as any).loadEnvFile('.env'); } catch {}
}

let schemaInitialized = false;

// In-memory fallback stores used ONLY when POSTGRES_URL / DATABASE_URL is not set AND not in production
const memoryUsers = new Map<string, UserRecord>();
const memorySessions = new Map<string, SessionRecord>();

export class DatabaseConfigurationError extends Error {
  constructor(message = 'Production database is not configured. Neon PostgreSQL connection string (POSTGRES_URL or DATABASE_URL) is required.') {
    super(message);
    this.name = 'DatabaseConfigurationError';
  }
}

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

/**
 * Return connection string with support for Vercel + Neon environment variables:
 * 1. POSTGRES_URL (Vercel Neon integration pooled connection)
 * 2. DATABASE_URL (Standard PostgreSQL connection string)
 * 3. POSTGRES_PRISMA_URL (Vercel Neon integration connection with Prisma parameters)
 * 4. POSTGRES_URL_NON_POOLING (Direct unpooled connection)
 */
export function getDatabaseConnectionString(): string | null {
  const url =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    '';
  return url.trim() || null;
}

/**
 * Returns the name of the active environment variable without leaking its secret value
 */
export function getActiveDatabaseEnvVar(): string | null {
  if (process.env.POSTGRES_URL) return 'POSTGRES_URL';
  if (process.env.DATABASE_URL) return 'DATABASE_URL';
  if (process.env.POSTGRES_PRISMA_URL) return 'POSTGRES_PRISMA_URL';
  if (process.env.POSTGRES_URL_NON_POOLING) return 'POSTGRES_URL_NON_POOLING';
  return null;
}

export function isNeonConfigured(): boolean {
  return Boolean(getDatabaseConnectionString());
}

/**
 * Guard to ensure production environments NEVER silently use in-memory fallback
 */
function assertStorageAvailable(operation: string): void {
  if (isProductionEnvironment() && !isNeonConfigured()) {
    throw new DatabaseConfigurationError(
      `Cannot execute ${operation} in production: Neon PostgreSQL is not configured. Ephemeral in-memory fallback is strictly disabled in production.`
    );
  }
}

export interface DatabaseStatus {
  configured: boolean;
  activeEnvVar: string | null;
  storageType: 'neon_postgres' | 'ephemeral_memory';
  isPersistent: boolean;
  status: 'connected' | 'unconfigured_fallback';
  notice: string;
}

export interface DatabaseHealthStatus {
  configured: boolean;
  activeEnvVar: string | null;
  connected: boolean;
  storageType: 'neon_postgres' | 'ephemeral_memory';
  isPersistent: boolean;
  status: 'connected' | 'disconnected' | 'unconfigured_fallback';
  tablesExist: boolean;
  latencyMs?: number;
  notice: string;
}

export function getDatabaseStatus(): DatabaseStatus {
  const configured = isNeonConfigured();
  const activeEnvVar = getActiveDatabaseEnvVar();
  return {
    configured,
    activeEnvVar,
    storageType: configured ? 'neon_postgres' : 'ephemeral_memory',
    isPersistent: configured,
    status: configured ? 'connected' : 'unconfigured_fallback',
    notice: configured
      ? `Persistent Neon PostgreSQL database is configured via ${activeEnvVar}.`
      : 'NOTICE: POSTGRES_URL / DATABASE_URL is not configured. Running in ephemeral in-memory fallback mode for local development. Student accounts will NOT persist across server restarts or separate serverless instances.'
  };
}

/**
 * Execute parameterized query using Neon serverless driver over HTTPS
 */
export async function queryNeon<T = any>(sqlQuery: string, params: any[] = []): Promise<T[]> {
  const connectionString = getDatabaseConnectionString();
  if (!connectionString) {
    throw new DatabaseConfigurationError('DATABASE_URL or POSTGRES_URL is not configured on the server.');
  }

  const sql = neon(connectionString);
  const rows = await sql.query(sqlQuery, params);
  return (rows || []) as T[];
}

/**
 * Check whether the required user and session authentication tables exist in PostgreSQL
 */
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

/**
 * Live test of Neon database connection with simple SELECT 1 query and latency measurement
 */
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

  const start = Date.now();
  try {
    const rows = await queryNeon<{ connected: number }>('SELECT 1 as connected;');
    const latencyMs = Date.now() - start;
    const isConnected = rows.length > 0 && Number(rows[0]?.connected) === 1;

    let tablesExist = false;
    if (isConnected) {
      const tableCheck = await checkDatabaseTables();
      tablesExist = tableCheck.allTablesExist;
    }

    return {
      connected: isConnected,
      latencyMs,
      tablesExist
    };
  } catch (err: any) {
    // Redact connection string or sensitive info from error messages
    const safeError = err?.message
      ? err.message.replace(/postgres(ql)?:\/\/[^@]+@[^\s/]+/gi, 'postgres://[REDACTED]')
      : 'Database connection query failed';

    return {
      connected: false,
      tablesExist: false,
      error: safeError
    };
  }
}

/**
 * Comprehensive health probe for database connectivity, storage mode, and persistence
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const configured = isNeonConfigured();
  const activeEnvVar = getActiveDatabaseEnvVar();

  if (!configured) {
    return {
      configured: false,
      activeEnvVar: null,
      connected: false,
      storageType: 'ephemeral_memory',
      isPersistent: false,
      status: 'unconfigured_fallback',
      tablesExist: false,
      notice: isProductionEnvironment()
        ? 'CRITICAL: Neon PostgreSQL is NOT configured in production. Ephemeral memory fallback is disabled; database operations will fail until POSTGRES_URL or DATABASE_URL is configured in Vercel.'
        : 'NOTICE: POSTGRES_URL / DATABASE_URL is not configured. Running in ephemeral in-memory fallback mode for local development. Student accounts will NOT persist across server restarts or separate serverless instances.'
    };
  }

  const connTest = await testDatabaseConnection();

  if (connTest.connected) {
    return {
      configured: true,
      activeEnvVar,
      connected: true,
      storageType: 'neon_postgres',
      isPersistent: true,
      status: 'connected',
      tablesExist: connTest.tablesExist ?? false,
      latencyMs: connTest.latencyMs,
      notice: connTest.tablesExist
        ? 'Persistent Neon PostgreSQL database is connected and all authentication tables exist.'
        : 'Neon PostgreSQL database is connected, but schema tables are not yet initialized. They will be created automatically on next request.'
    };
  } else {
    return {
      configured: true,
      activeEnvVar,
      connected: false,
      storageType: 'neon_postgres',
      isPersistent: false,
      status: 'disconnected',
      tablesExist: false,
      notice: `Neon PostgreSQL is configured via ${activeEnvVar}, but connection probe failed: ${connTest.error}`
    };
  }
}

/**
 * Idempotent schema migration for user accounts and sessions
 */
export async function ensureDatabaseSchema(): Promise<void> {
  if (schemaInitialized) return;

  const connectionString = getDatabaseConnectionString();
  if (!connectionString) {
    if (isProductionEnvironment()) {
      throw new DatabaseConfigurationError(
        'Database initialization failed: POSTGRES_URL or DATABASE_URL is not configured in production. Ephemeral storage is prohibited in production.'
      );
    } else {
      console.info('[StudyPilot DB Info] POSTGRES_URL is not configured. Running in ephemeral in-memory fallback mode for local development.');
      schemaInitialized = true;
      return;
    }
  }

  try {
    const sql = neon(connectionString);

    // 1. Users table (supports both email/password and OAuth provider identities)
    await sql.query(`
      CREATE TABLE IF NOT EXISTS studypilot_users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        university VARCHAR(255) DEFAULT 'Sanjay Ghodawat University',
        course VARCHAR(255) DEFAULT 'B.Tech',
        branch VARCHAR(255) DEFAULT 'Artificial Intelligence & Machine Learning',
        year VARCHAR(50) DEFAULT '2nd Year',
        semester VARCHAR(50) DEFAULT 'Semester III',
        preferred_language VARCHAR(10) DEFAULT 'en',
        google_id VARCHAR(255) UNIQUE,
        auth_provider VARCHAR(50) DEFAULT 'local',
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Safely apply backward-compatible alterations if table pre-existed
    try {
      await sql.query(`ALTER TABLE studypilot_users ALTER COLUMN password_hash DROP NOT NULL;`);
    } catch {}

    try {
      await sql.query(`ALTER TABLE studypilot_users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;`);
      await sql.query(`ALTER TABLE studypilot_users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';`);
      await sql.query(`ALTER TABLE studypilot_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`);
    } catch {}

    // 2. Sessions table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS studypilot_sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES studypilot_users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Indexes
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_studypilot_users_email ON studypilot_users(email);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_studypilot_users_google_id ON studypilot_users(google_id);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_studypilot_sessions_token_hash ON studypilot_sessions(token_hash);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_studypilot_sessions_expires_at ON studypilot_sessions(expires_at);`);

    schemaInitialized = true;
  } catch (err: any) {
    console.error('Failed to initialize Neon database schema:', err?.message || err);
    throw err;
  }
}

/**
 * Find user by normalized email
 */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  await ensureDatabaseSchema();
  assertStorageAvailable('findUserByEmail');
  const normalized = email.trim().toLowerCase();

  if (!isNeonConfigured()) {
    for (const user of memoryUsers.values()) {
      if (user.email.toLowerCase() === normalized) {
        return user;
      }
    }
    return null;
  }

  const rows = await queryNeon<UserRecord>(
    `SELECT id, email, password_hash, name, university, course, branch, year, semester, preferred_language, google_id, auth_provider, avatar_url, created_at, updated_at
     FROM studypilot_users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1;`,
    [normalized]
  );

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<UserRecord | null> {
  await ensureDatabaseSchema();
  assertStorageAvailable('findUserById');

  if (!isNeonConfigured()) {
    return memoryUsers.get(id) || null;
  }

  const rows = await queryNeon<UserRecord>(
    `SELECT id, email, password_hash, name, university, course, branch, year, semester, preferred_language, google_id, auth_provider, avatar_url, created_at, updated_at
     FROM studypilot_users
     WHERE id = $1
     LIMIT 1;`,
    [id]
  );

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Find user by verified Google ID
 */
export async function findUserByGoogleId(googleId: string): Promise<UserRecord | null> {
  await ensureDatabaseSchema();
  assertStorageAvailable('findUserByGoogleId');
  const cleanId = (googleId || '').trim();
  if (!cleanId) return null;

  if (!isNeonConfigured()) {
    for (const user of memoryUsers.values()) {
      if (user.google_id === cleanId) {
        return user;
      }
    }
    return null;
  }

  const rows = await queryNeon<UserRecord>(
    `SELECT id, email, password_hash, name, university, course, branch, year, semester, preferred_language, google_id, auth_provider, avatar_url, created_at, updated_at
     FROM studypilot_users
     WHERE google_id = $1
     LIMIT 1;`,
    [cleanId]
  );

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Link an existing student account with a Google account
 */
export async function linkGoogleAccount(
  userId: string, 
  googleId: string, 
  avatarUrl?: string | null
): Promise<UserRecord> {
  await ensureDatabaseSchema();
  assertStorageAvailable('linkGoogleAccount');

  if (!isNeonConfigured()) {
    const existing = memoryUsers.get(userId);
    if (!existing) throw new Error('User not found to link Google account.');
    const updated: UserRecord = {
      ...existing,
      google_id: googleId,
      auth_provider: 'google',
      avatar_url: avatarUrl || existing.avatar_url,
      updated_at: new Date().toISOString()
    };
    memoryUsers.set(userId, updated);
    return updated;
  }

  const rows = await queryNeon<UserRecord>(
    `UPDATE studypilot_users
     SET google_id = $2, 
         auth_provider = 'google', 
         avatar_url = COALESCE($3, avatar_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, email, password_hash, name, university, course, branch, year, semester, preferred_language, google_id, auth_provider, avatar_url, created_at, updated_at;`,
    [userId, googleId, avatarUrl || null]
  );

  if (rows.length === 0) throw new Error('User not found to link Google account.');
  return rows[0];
}

/**
 * Insert a new student user
 */
export async function insertUser(user: Omit<UserRecord, 'created_at' | 'updated_at'>): Promise<UserRecord> {
  await ensureDatabaseSchema();
  assertStorageAvailable('insertUser');
  const normalizedEmail = user.email.trim().toLowerCase();

  if (!isNeonConfigured()) {
    const record: UserRecord = {
      ...user,
      email: normalizedEmail,
      auth_provider: user.auth_provider || 'local',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryUsers.set(record.id, record);
    return record;
  }

  const rows = await queryNeon<UserRecord>(
    `INSERT INTO studypilot_users (
       id, email, password_hash, name, university, course, branch, year, semester, preferred_language, google_id, auth_provider, avatar_url
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING id, email, password_hash, name, university, course, branch, year, semester, preferred_language, google_id, auth_provider, avatar_url, created_at, updated_at;`,
    [
      user.id,
      normalizedEmail,
      user.password_hash || null,
      user.name,
      user.university || 'Sanjay Ghodawat University',
      user.course || 'B.Tech',
      user.branch || 'Artificial Intelligence & Machine Learning',
      user.year || '2nd Year',
      user.semester || 'Semester III',
      user.preferred_language || 'en',
      user.google_id || null,
      user.auth_provider || 'local',
      user.avatar_url || null
    ]
  );

  return rows[0];
}

/**
 * Insert a new session with hashed token
 */
export async function insertSession(session: SessionRecord): Promise<void> {
  await ensureDatabaseSchema();
  assertStorageAvailable('insertSession');

  if (!isNeonConfigured()) {
    memorySessions.set(session.token_hash, {
      ...session,
      created_at: new Date().toISOString()
    });
    return;
  }

  const expiresIso = session.expires_at instanceof Date ? session.expires_at.toISOString() : session.expires_at;

  await queryNeon(
    `INSERT INTO studypilot_sessions (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4);`,
    [session.id, session.user_id, session.token_hash, expiresIso]
  );
}

/**
 * Find session and associated student user by token hash
 */
export async function findSessionWithUser(tokenHash: string): Promise<{ session: SessionRecord; user: UserRecord } | null> {
  await ensureDatabaseSchema();
  assertStorageAvailable('findSessionWithUser');

  if (!isNeonConfigured()) {
    const session = memorySessions.get(tokenHash);
    if (!session) return null;

    const expiresDate = new Date(session.expires_at);
    if (expiresDate.getTime() < Date.now()) {
      memorySessions.delete(tokenHash);
      return null;
    }

    const user = memoryUsers.get(session.user_id);
    if (!user) return null;

    return { session, user };
  }

  const rows = await queryNeon<any>(
    `SELECT 
       s.id AS session_id,
       s.user_id,
       s.token_hash,
       s.expires_at,
       s.created_at AS session_created_at,
       u.id AS u_id,
       u.email,
       u.password_hash,
       u.name,
       u.university,
       u.course,
       u.branch,
       u.year,
       u.semester,
       u.preferred_language,
       u.google_id,
       u.auth_provider,
       u.avatar_url,
       u.created_at AS user_created_at,
       u.updated_at AS user_updated_at
     FROM studypilot_sessions s
     JOIN studypilot_users u ON s.user_id = u.id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1;`,
    [tokenHash]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  const session: SessionRecord = {
    id: row.session_id,
    user_id: row.user_id,
    token_hash: row.token_hash,
    expires_at: row.expires_at,
    created_at: row.session_created_at
  };

  const user: UserRecord = {
    id: row.u_id,
    email: row.email,
    password_hash: row.password_hash,
    name: row.name,
    university: row.university,
    course: row.course,
    branch: row.branch,
    year: row.year,
    semester: row.semester,
    preferred_language: row.preferred_language,
    google_id: row.google_id,
    auth_provider: row.auth_provider,
    avatar_url: row.avatar_url,
    created_at: row.user_created_at,
    updated_at: row.user_updated_at
  };

  return { session, user };
}

/**
 * Delete a session by token hash (logout)
 */
export async function deleteSessionByTokenHash(tokenHash: string): Promise<void> {
  await ensureDatabaseSchema();
  assertStorageAvailable('deleteSessionByTokenHash');

  if (!isNeonConfigured()) {
    memorySessions.delete(tokenHash);
    return;
  }

  await queryNeon(
    `DELETE FROM studypilot_sessions WHERE token_hash = $1;`,
    [tokenHash]
  );
}

/**
 * Reset in-memory database (for unit tests only)
 */
export function _resetMemoryDb(): void {
  memoryUsers.clear();
  memorySessions.clear();
  schemaInitialized = false;
}
