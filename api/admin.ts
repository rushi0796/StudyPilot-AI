import crypto from 'crypto';
import { parseCookie } from 'cookie';
import { neon } from '@neondatabase/serverless';

export interface AuditLogRecord {
  id: string;
  admin_id: string;
  admin_email: string;
  target_user_id?: string;
  target_user_email?: string;
  document_id?: string;
  document_name?: string;
  action: string;
  details?: string;
  created_at: string;
}

export const memoryAuditLogs = new Map<string, AuditLogRecord>();
export const memorySessions = new Map<string, { user_id: string; expires_at: string; ip_address?: string; user_agent?: string }>();
export const memoryUsers = new Map<string, any>();
export const memoryDocuments = new Map<string, any>();

// In-memory rate limiting for admin login brute-force mitigation
const adminLoginAttempts = new Map<string, { count: number; firstAttempt: number }>();

function checkAdminRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxAttempts = 5;

  const record = adminLoginAttempts.get(ip);
  if (!record) {
    adminLoginAttempts.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (now - record.firstAttempt > windowMs) {
    adminLoginAttempts.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= maxAttempts) {
    const remaining = Math.ceil((windowMs - (now - record.firstAttempt)) / 1000);
    return { allowed: false, retryAfterSeconds: remaining };
  }

  record.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetAdminRateLimit(ip: string) {
  adminLoginAttempts.delete(ip);
}

function getDatabaseConnectionString(): string | null {
  const url =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    '';
  return url.trim() ? url.trim() : null;
}

function isNeonConfigured(): boolean {
  return Boolean(getDatabaseConnectionString());
}

async function queryNeon<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  const connString = getDatabaseConnectionString();
  if (!connString) return [];
  const sql = neon(connString);
  if (typeof (sql as any).query === 'function') {
    const result = await (sql as any).query(queryText, params && params.length > 0 ? params : []);
    return (result as T[]) || [];
  }
  const result = await (sql as any)(queryText, params);
  return (result as T[]) || [];
}

let schemaInitialized = false;

export async function ensureDatabaseSchema(): Promise<void> {
  if (schemaInitialized || !isNeonConfigured()) return;
  try {
    await queryNeon(`
      CREATE TABLE IF NOT EXISTS studypilot_users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
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
        google_id VARCHAR(255),
        role VARCHAR(32) DEFAULT 'student',
        onboarding_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryNeon('ALTER TABLE studypilot_users ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT \'student\';');
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

    await queryNeon(`
      CREATE TABLE IF NOT EXISTS studypilot_documents (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES studypilot_users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(32) NOT NULL,
        size INT NOT NULL,
        upload_status VARCHAR(32) DEFAULT 'completed',
        processing_status VARCHAR(32) DEFAULT 'indexed',
        extracted_text TEXT,
        chunks JSONB DEFAULT '[]'::jsonb,
        chunk_count INT DEFAULT 0,
        word_count INT DEFAULT 0,
        file_data TEXT,
        subject_id VARCHAR(64),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryNeon(`
      CREATE TABLE IF NOT EXISTS studypilot_audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        admin_id VARCHAR(64) NOT NULL,
        admin_email VARCHAR(255) NOT NULL,
        target_user_id VARCHAR(64),
        target_user_email VARCHAR(255),
        document_id VARCHAR(64),
        document_name VARCHAR(255),
        action VARCHAR(64) NOT NULL,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    schemaInitialized = true;
  } catch (err) {
    console.warn('Database schema ensure warning:', err);
  }
}

export function getSessionTokenFromRequest(req: any): string | null {
  const cookieHeader = req?.headers?.cookie || req?.headers?.Cookie || '';
  if (cookieHeader) {
    try {
      const parsed = parseCookie(cookieHeader);
      if (parsed['studypilot_session']) {
        return parsed['studypilot_session'];
      }
      if (parsed['studypilot_admin_token']) {
        return parsed['studypilot_admin_token'];
      }
    } catch {}
  }
  const authHeader = req?.headers?.authorization || req?.headers?.Authorization || '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getClientIp(req: any): string {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req?.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Validates the administrator password strictly on the server
 * Uses constant-time buffer comparison to prevent timing side-channel attacks
 */
export function verifyAdminPassword(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  // Read sensitive environment variable, falling back to default configured initial key
  const serverPassword = (process.env.ADMIN_PASSWORD || 'Admin@07').trim();
  
  const inputBuf = Buffer.from(input, 'utf-8');
  const expectedBuf = Buffer.from(serverPassword, 'utf-8');

  if (inputBuf.length !== expectedBuf.length) {
    // Perform dummy timing-safe comparison on itself to maintain timing parity
    crypto.timingSafeEqual(inputBuf, inputBuf);
    return false;
  }

  return crypto.timingSafeEqual(inputBuf, expectedBuf);
}

export async function insertAuditLog(logData: Omit<AuditLogRecord, 'created_at'>): Promise<void> {
  const now = new Date().toISOString();
  const record: AuditLogRecord = {
    ...logData,
    created_at: now
  };

  if (!isNeonConfigured()) {
    memoryAuditLogs.set(record.id, record);
    return;
  }

  try {
    await ensureDatabaseSchema();
    await queryNeon(
      `INSERT INTO studypilot_audit_logs (
         id, admin_id, admin_email, target_user_id, target_user_email, document_id, document_name, action, details, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [
        record.id,
        record.admin_id,
        record.admin_email,
        record.target_user_id || null,
        record.target_user_email || null,
        record.document_id || null,
        record.document_name || null,
        record.action,
        record.details || null,
        record.created_at
      ]
    );
  } catch {
    memoryAuditLogs.set(record.id, record);
  }
}

/**
 * Server-side authorization check: validates that the active session belongs to a Super Admin
 * Rejects unauthenticated callers with HTTP 401
 * Rejects regular students with HTTP 403 Forbidden
 */
export async function requireSuperAdmin(req: any): Promise<{ user: { id: string; email: string; name: string; role: 'super_admin' } } | { error: { message: string; code: string; status: number } }> {
  const token = getSessionTokenFromRequest(req);
  if (!token) {
    return {
      error: {
        message: 'Authentication required. Please sign in as Super Admin.',
        code: 'UNAUTHENTICATED',
        status: 401
      }
    };
  }

  const tokenHash = hashSessionToken(token);
  const now = new Date().toISOString();

  if (!isNeonConfigured()) {
    const sess = memorySessions.get(tokenHash);
    if (!sess) {
      return {
        error: {
          message: 'Invalid or expired session. Please sign in as Super Admin.',
          code: 'UNAUTHENTICATED',
          status: 401
        }
      };
    }
    const u = memoryUsers.get(sess.user_id) || Array.from(memoryUsers.values()).find(x => x.id === sess.user_id);
    if (!u) {
      return {
        error: {
          message: 'User account not found.',
          code: 'UNAUTHENTICATED',
          status: 401
        }
      };
    }
    if (u.role !== 'super_admin') {
      return {
        error: {
          message: 'Forbidden. Super Admin access required.',
          code: 'FORBIDDEN',
          status: 403
        }
      };
    }
    return {
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: 'super_admin'
      }
    };
  }

  try {
    await ensureDatabaseSchema();
    const rows = await queryNeon<any>(
      `SELECT u.id, u.email, u.name, u.role FROM studypilot_users u
       JOIN studypilot_sessions s ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > $2
       LIMIT 1;`,
      [tokenHash, now]
    );

    if (!rows[0]) {
      return {
        error: {
          message: 'Invalid or expired session. Please sign in as Super Admin.',
          code: 'UNAUTHENTICATED',
          status: 401
        }
      };
    }

    const u = rows[0];
    if (u.role !== 'super_admin') {
      return {
        error: {
          message: 'Forbidden. Super Admin access required.',
          code: 'FORBIDDEN',
          status: 403
        }
      };
    }

    return {
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: 'super_admin'
      }
    };
  } catch (err: any) {
    return {
      error: {
        message: err?.message || 'Database error verifying administrator identity.',
        code: 'DATABASE_ERROR',
        status: 500
      }
    };
  }
}

/**
 * Dedicated Admin Login Action:
 * - Single password validation on the server
 * - Rate limiting against brute-force attacks
 * - Sets secure HTTP-only session cookie
 * - Creates/updates root Super Admin user record
 */
export async function processAdminLogin(req: any, res: any) {
  const clientIp = getClientIp(req);
  const rate = checkAdminRateLimit(clientIp);
  if (!rate.allowed) {
    return res.status(429).json({
      error: {
        message: `Too many login attempts. Please wait ${rate.retryAfterSeconds} seconds before trying again.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: rate.retryAfterSeconds,
        status: 429
      }
    });
  }

  const body = req.body || {};
  const password = body.password;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      error: {
        message: 'Administrator password is required.',
        code: 'MISSING_PASSWORD',
        status: 400
      }
    });
  }

  const isValid = verifyAdminPassword(password);
  if (!isValid) {
    await insertAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      admin_id: 'unknown',
      admin_email: 'unauthenticated',
      action: 'ADMIN_LOGIN_FAILED',
      details: `Failed administrator password attempt from IP: ${clientIp}.`
    });

    return res.status(401).json({
      error: {
        message: 'Incorrect administrator password. Please check your credentials.',
        code: 'INVALID_CREDENTIALS',
        status: 401
      }
    });
  }

  // Password valid! Clear rate limit for this IP
  resetAdminRateLimit(clientIp);

  const adminId = 'admin_system_root';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@studypilot.ai').toLowerCase().trim();
  const adminName = 'Super Administrator';
  const now = new Date().toISOString();
  let effectiveAdminId = adminId;

  if (isNeonConfigured()) {
    await ensureDatabaseSchema();
    const existing = await queryNeon<any>(
      `SELECT id, name FROM studypilot_users WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
      [adminEmail]
    );
    if (existing && existing.length > 0) {
      effectiveAdminId = existing[0].id;
      await queryNeon(
        `UPDATE studypilot_users SET
           name = COALESCE(NULLIF(name, ''), $1),
           role = 'super_admin',
           onboarding_completed = TRUE,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $2;`,
        [adminName, effectiveAdminId]
      );
    } else {
      await queryNeon(
        `INSERT INTO studypilot_users (
           id, email, password_hash, name, university, course, branch, year, semester, role, onboarding_completed, created_at, updated_at
         ) VALUES ($1, $2, NULL, $3, 'StudyPilot AI System', 'Administration', 'Control Plane', 'Admin', 'Root', 'super_admin', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           role = 'super_admin',
           onboarding_completed = TRUE,
           updated_at = CURRENT_TIMESTAMP;`,
        [effectiveAdminId, adminEmail, adminName]
      );
    }
  } else {
    memoryUsers.set(adminId, {
      id: adminId,
      email: adminEmail,
      name: adminName,
      role: 'super_admin',
      onboarding_completed: true,
      created_at: now
    });
  }

  // Generate high-entropy session token
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(sessionToken);
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();

  if (isNeonConfigured()) {
    await queryNeon(
      `INSERT INTO studypilot_sessions (
         id, user_id, token_hash, expires_at, user_agent, ip_address, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);`,
      [crypto.randomUUID(), effectiveAdminId, tokenHash, expiresAt, req.headers?.['user-agent'] || null, clientIp]
    );
  } else {
    memorySessions.set(tokenHash, {
      user_id: effectiveAdminId,
      expires_at: expiresAt,
      ip_address: clientIp
    });
  }

  // Set secure HTTP-only cookies
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const cookieFlags = [
    `studypilot_session=${sessionToken}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    isProd ? 'Secure' : ''
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookieFlags);

  await insertAuditLog({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    admin_id: effectiveAdminId,
    admin_email: adminEmail,
    action: 'ADMIN_LOGIN_SUCCESS',
    details: `Super Admin successfully authenticated from IP: ${clientIp}.`
  });

  return res.status(200).json({
    success: true,
    message: 'Super Admin authentication successful.',
    redirectUrl: '/admin',
    user: {
      id: effectiveAdminId,
      email: adminEmail,
      name: adminName,
      role: 'super_admin',
      onboardingCompleted: true
    }
  });
}

/**
 * Dedicated Admin Logout Action:
 * - Invalidates session in database
 * - Clears session cookie
 * - Records audit log
 */
export async function processAdminLogout(req: any, res: any) {
  const token = getSessionTokenFromRequest(req);
  if (token) {
    const tokenHash = hashSessionToken(token);
    if (isNeonConfigured()) {
      try {
        await queryNeon('DELETE FROM studypilot_sessions WHERE token_hash = $1;', [tokenHash]);
      } catch {}
    } else {
      memorySessions.delete(tokenHash);
    }
  }

  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const clearCookie = [
    'studypilot_session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    isProd ? 'Secure' : ''
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', clearCookie);

  await insertAuditLog({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    admin_id: 'admin_system_root',
    admin_email: 'admin@studypilot.ai',
    action: 'ADMIN_LOGOUT',
    details: 'Super Admin terminated session.'
  });

  return res.status(200).json({
    success: true,
    message: 'Admin session logged out successfully.'
  });
}

/**
 * Session verification endpoint for Super Admin
 */
export async function processAdminMe(req: any, res: any) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }
  return res.status(200).json({
    authenticated: true,
    user: authCheck.user
  });
}

/**
 * Overview statistics from real database queries
 */
export async function processAdminOverview(req: any, res: any) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  let totalStudents = 0;
  let totalSuperAdmins = 0;
  let totalUploadedDocuments = 0;
  let totalStorageConsumed = 0;
  let totalActiveStudents = 0;
  let totalDocumentsProcessed = 0;
  let totalDocumentsPending = 0;
  let totalDocumentsFailed = 0;
  let recentStudents: any[] = [];
  let recentDocuments: any[] = [];
  let recentActivity: any[] = [];

  if (isNeonConfigured()) {
    try {
      await ensureDatabaseSchema();
      const userCounts = await queryNeon<any>(
        `SELECT 
           COUNT(*) FILTER (WHERE role != 'super_admin') as students,
           COUNT(*) FILTER (WHERE role = 'super_admin') as admins
         FROM studypilot_users;`
      );
      totalStudents = Number(userCounts[0]?.students) || 0;
      totalSuperAdmins = Number(userCounts[0]?.admins) || 0;

      const docCounts = await queryNeon<any>(
        `SELECT 
           COUNT(*) as docs,
           COALESCE(SUM(size), 0) as total_size,
           COUNT(*) FILTER (WHERE processing_status = 'indexed' OR upload_status = 'completed') as processed,
           COUNT(*) FILTER (WHERE processing_status = 'processing' OR upload_status = 'pending') as pending,
           COUNT(*) FILTER (WHERE processing_status = 'failed' OR upload_status = 'failed') as failed
         FROM studypilot_documents;`
      );
      totalUploadedDocuments = Number(docCounts[0]?.docs) || 0;
      totalStorageConsumed = Number(docCounts[0]?.total_size) || 0;
      totalDocumentsProcessed = Number(docCounts[0]?.processed) || 0;
      totalDocumentsPending = Number(docCounts[0]?.pending) || 0;
      totalDocumentsFailed = Number(docCounts[0]?.failed) || 0;

      // Active students in last 7 days
      const activeCounts = await queryNeon<any>(
        `SELECT COUNT(DISTINCT user_id) as active_count
         FROM studypilot_sessions
         WHERE created_at >= NOW() - INTERVAL '7 days';`
      );
      totalActiveStudents = Number(activeCounts[0]?.active_count) || 0;

      recentStudents = await queryNeon<any>(
        `SELECT id, name, email, university, course, branch, semester, created_at
         FROM studypilot_users
         WHERE role != 'super_admin'
         ORDER BY created_at DESC
         LIMIT 6;`
      );

      recentDocuments = await queryNeon<any>(
        `SELECT d.id, d.name, d.type, d.size, d.chunk_count, d.word_count, d.processing_status, d.created_at,
                u.name as user_name, u.email as user_email
         FROM studypilot_documents d
         LEFT JOIN studypilot_users u ON d.user_id = u.id
         ORDER BY d.created_at DESC
         LIMIT 6;`
      );

      recentActivity = await queryNeon<any>(
        `SELECT * FROM studypilot_audit_logs
         ORDER BY created_at DESC
         LIMIT 6;`
      );
    } catch (dbErr) {
      console.warn('Overview DB query error:', dbErr);
    }
  } else {
    for (const u of memoryUsers.values()) {
      if (u.role === 'super_admin') {
        totalSuperAdmins++;
      } else {
        totalStudents++;
        recentStudents.push(u);
      }
    }
    for (const d of memoryDocuments.values()) {
      totalUploadedDocuments++;
      totalStorageConsumed += (d.size || 0);
      if (d.processing_status === 'indexed' || d.upload_status === 'completed') totalDocumentsProcessed++;
      recentDocuments.push(d);
    }
    recentActivity = Array.from(memoryAuditLogs.values()).slice(0, 6);
  }

  return res.status(200).json({
    metrics: {
      totalStudents,
      totalSuperAdmins,
      totalUploadedDocuments,
      totalStorageConsumed,
      totalActiveStudents,
      totalDocumentsProcessed,
      totalDocumentsPending,
      totalDocumentsFailed,
      serverTime: new Date().toISOString()
    },
    recentStudents: recentStudents.slice(0, 6),
    recentDocuments: recentDocuments.slice(0, 6),
    recentActivity: recentActivity.slice(0, 6)
  });
}

/**
 * All Students directory with search, filter, and pagination
 */
export async function processAdminUsers(req: any, res: any) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  if (!isNeonConfigured()) {
    const list: any[] = [];
    for (const u of memoryUsers.values()) {
      if (u.role !== 'super_admin') {
        list.push({
          id: u.id,
          name: u.name,
          email: u.email,
          university: u.university || 'Sanjay Ghodawat University',
          course: u.course || 'B.Tech',
          branch: u.branch || 'AIML',
          year: u.year || '2nd Year',
          semester: u.semester || 'Semester III',
          role: 'student',
          accountStatus: 'Active',
          uploadedDocsCount: 0,
          processedDocsCount: 0,
          storageConsumed: 0,
          lastLoginAt: u.created_at,
          onboardingCompleted: Boolean(u.onboarding_completed),
          createdAt: u.created_at
        });
      }
    }
    return res.status(200).json({ users: list });
  }

  try {
    await ensureDatabaseSchema();
    const rows = await queryNeon<any>(
      `SELECT u.id, u.name, u.email, u.university, u.course, u.branch, u.year, u.semester, u.role,
              u.onboarding_completed, u.created_at,
              COALESCE(COUNT(d.id), 0)::int as uploaded_docs_count,
              COALESCE(COUNT(d.id) FILTER (WHERE d.processing_status = 'indexed' OR d.upload_status = 'completed'), 0)::int as processed_docs_count,
              COALESCE(SUM(d.size), 0)::int as storage_consumed,
              MAX(s.created_at) as last_login_at
       FROM studypilot_users u
       LEFT JOIN studypilot_documents d ON u.id = d.user_id
       LEFT JOIN studypilot_sessions s ON u.id = s.user_id
       WHERE u.role != 'super_admin'
       GROUP BY u.id
       ORDER BY u.created_at DESC;`
    );

    const users = rows.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      university: u.university,
      course: u.course,
      branch: u.branch,
      year: u.year,
      semester: u.semester,
      role: 'student',
      accountStatus: u.last_login_at ? 'Active' : 'New',
      uploadedDocsCount: u.uploaded_docs_count || 0,
      processedDocsCount: u.processed_docs_count || 0,
      storageConsumed: u.storage_consumed || 0,
      lastLoginAt: u.last_login_at || u.created_at,
      onboardingCompleted: Boolean(u.onboarding_completed),
      createdAt: u.created_at
    }));

    return res.status(200).json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err?.message, code: 'DB_ERROR', status: 500 } });
  }
}

/**
 * Detailed Student Profile View:
 * Returns student metadata + uploaded files + learning activity
 * Records audit log VIEW_STUDENT_PROFILE
 */
export async function processAdminUserDetail(req: any, res: any, userId: string) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  const admin = authCheck.user;

  try {
    let student: any = null;
    let documents: any[] = [];
    let activities: any[] = [];

    if (isNeonConfigured()) {
      await ensureDatabaseSchema();
      const userRows = await queryNeon<any>(
        `SELECT id, name, email, university, course, branch, year, semester, role, onboarding_completed, created_at
         FROM studypilot_users WHERE id = $1 LIMIT 1;`,
        [userId]
      );
      student = userRows[0];

      if (student) {
        documents = await queryNeon<any>(
          `SELECT id, user_id, name, type, size, upload_status, processing_status, chunk_count, word_count, created_at
           FROM studypilot_documents WHERE user_id = $1 ORDER BY created_at DESC;`,
          [userId]
        );

        // Fetch activity logs if table exists
        try {
          activities = await queryNeon<any>(
            `SELECT * FROM studypilot_activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20;`,
            [userId]
          );
        } catch {}
      }
    } else {
      student = memoryUsers.get(userId);
      documents = Array.from(memoryDocuments.values()).filter(d => d.user_id === userId);
    }

    if (!student) {
      return res.status(404).json({ error: { message: 'Student not found.', code: 'NOT_FOUND', status: 404 } });
    }

    // Record audit log
    await insertAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      admin_id: admin.id,
      admin_email: admin.email,
      target_user_id: student.id,
      target_user_email: student.email,
      action: 'VIEW_STUDENT_PROFILE',
      details: `Super Admin inspected student profile of ${student.name} (${student.email}).`
    });

    const totalStorage = documents.reduce((sum, d) => sum + (d.size || 0), 0);
    const processedCount = documents.filter(d => d.processing_status === 'indexed' || d.upload_status === 'completed').length;

    return res.status(200).json({
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        university: student.university,
        course: student.course,
        branch: student.branch,
        year: student.year,
        semester: student.semester,
        role: 'student',
        onboardingCompleted: Boolean(student.onboarding_completed),
        createdAt: student.created_at,
        uploadedDocsCount: documents.length,
        processedDocsCount: processedCount,
        storageConsumed: totalStorage
      },
      documents,
      activities
    });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err?.message, code: 'DB_ERROR', status: 500 } });
  }
}

/**
 * All Uploaded Files across ALL students
 */
export async function processAdminDocuments(req: any, res: any) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  if (!isNeonConfigured()) {
    const list: any[] = [];
    for (const d of memoryDocuments.values()) {
      const u = memoryUsers.get(d.user_id);
      list.push({
        id: d.id,
        userId: d.user_id,
        name: d.name,
        type: d.type,
        size: d.size,
        uploadStatus: d.upload_status || 'completed',
        processingStatus: d.processing_status || 'indexed',
        chunkCount: d.chunk_count || 0,
        wordCount: d.word_count || 0,
        hasExtractedText: Boolean(d.extracted_text && d.extracted_text.length > 0),
        createdAt: d.created_at,
        user_name: u?.name || 'Unknown Student',
        user_email: u?.email || 'unknown@student.edu'
      });
    }
    return res.status(200).json({ documents: list });
  }

  try {
    await ensureDatabaseSchema();
    const rows = await queryNeon<any>(
      `SELECT d.id, d.user_id as "userId", d.name, d.type, d.size, 
              d.upload_status as "uploadStatus", d.processing_status as "processingStatus",
              d.chunk_count as "chunkCount", d.word_count as "wordCount", d.created_at as "createdAt",
              CASE WHEN d.extracted_text IS NOT NULL AND LENGTH(d.extracted_text) > 0 THEN TRUE ELSE FALSE END as "hasExtractedText",
              COALESCE(u.email, 'registered-student') as user_email,
              COALESCE(u.name, 'Student (' || SUBSTRING(d.user_id, 1, 8) || ')') as user_name
       FROM studypilot_documents d
       LEFT JOIN studypilot_users u ON d.user_id = u.id
       ORDER BY d.created_at DESC;`
    );
    return res.status(200).json({ documents: rows });
  } catch (err: any) {
    console.warn('Error fetching admin documents:', err);
    return res.status(200).json({ documents: [] });
  }
}

/**
 * Detailed Document Inspection (Metadata, Chunks, Extracted Text)
 */
export async function processAdminDocumentDetail(req: any, res: any, docId: string) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  let doc: any = null;
  if (!isNeonConfigured()) {
    doc = memoryDocuments.get(docId);
  } else {
    try {
      await ensureDatabaseSchema();
      const rows = await queryNeon<any>(
        `SELECT d.*, u.name as student_name, u.email as student_email
         FROM studypilot_documents d
         LEFT JOIN studypilot_users u ON d.user_id = u.id
         WHERE d.id = $1 LIMIT 1;`,
        [docId]
      );
      doc = rows[0];
    } catch {}
  }

  if (!doc) {
    return res.status(404).json({ error: { message: 'Document not found.', code: 'NOT_FOUND', status: 404 } });
  }

  return res.status(200).json({
    document: {
      id: doc.id,
      userId: doc.user_id,
      studentName: doc.student_name || 'Unknown Student',
      studentEmail: doc.student_email || 'unknown@student.edu',
      name: doc.name,
      type: doc.type,
      size: doc.size,
      uploadStatus: doc.upload_status,
      processingStatus: doc.processing_status,
      extractedText: doc.extracted_text || '',
      chunks: typeof doc.chunks === 'string' ? JSON.parse(doc.chunks) : (doc.chunks || []),
      chunkCount: doc.chunk_count,
      wordCount: doc.word_count,
      createdAt: doc.created_at
    }
  });
}

/**
 * Byte-perfect binary download or preview for Super Admin
 * Decodes base64 file_data and sets Content-Disposition and MIME headers
 */
export async function processAdminBinaryFile(req: any, res: any, docId: string, action: 'download' | 'preview') {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  const admin = authCheck.user;

  let doc: any = null;
  if (isNeonConfigured()) {
    await ensureDatabaseSchema();
    const rows = await queryNeon<any>(
      `SELECT d.*, u.name as student_name, u.email as student_email
       FROM studypilot_documents d
       LEFT JOIN studypilot_users u ON d.user_id = u.id
       WHERE d.id = $1 LIMIT 1;`,
      [docId]
    );
    doc = rows[0];
  } else {
    doc = memoryDocuments.get(docId);
  }

  if (!doc) {
    return res.status(404).json({ error: { message: 'Document not found.', code: 'NOT_FOUND', status: 404 } });
  }

  // Record audit log
  await insertAuditLog({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    admin_id: admin.id,
    admin_email: admin.email,
    target_user_id: doc.user_id,
    target_user_email: doc.student_email || doc.user_email,
    document_id: doc.id,
    document_name: doc.name,
    action: action === 'download' ? 'DOWNLOAD_STUDENT_DOCUMENT' : 'PREVIEW_STUDENT_DOCUMENT',
    details: `Super Admin accessed original file "${doc.name}" via ${action}.`
  });

  const rawData = doc.file_data || '';
  let buffer: Buffer;
  let mimeType = 'application/pdf';

  if (rawData.startsWith('data:')) {
    const parts = rawData.split(',');
    const match = parts[0].match(/data:(.*?);base64/);
    if (match) mimeType = match[1];
    buffer = Buffer.from(parts[1] || '', 'base64');
  } else if (rawData.length > 0 && /^[A-Za-z0-9+/=]+$/.test(rawData.slice(0, 100))) {
    buffer = Buffer.from(rawData, 'base64');
  } else {
    buffer = Buffer.from(doc.extracted_text || rawData || 'No content', 'utf-8');
    mimeType = 'text/plain';
  }

  const disposition = action === 'download' ? 'attachment' : 'inline';
  const filename = encodeURIComponent(doc.name);

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"; filename*=UTF-8''${filename}`);
  res.setHeader('Content-Length', buffer.length);
  return res.status(200).send(buffer);
}

/**
 * Permanent document deletion with audit logging
 */
export async function processAdminDeleteDocument(req: any, res: any, docId: string) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  const admin = authCheck.user;

  try {
    let doc: any = null;
    if (isNeonConfigured()) {
      await ensureDatabaseSchema();
      const rows = await queryNeon<any>(
        `SELECT d.id, d.name, d.user_id, u.email as user_email
         FROM studypilot_documents d
         LEFT JOIN studypilot_users u ON d.user_id = u.id
         WHERE d.id = $1 LIMIT 1;`,
        [docId]
      );
      doc = rows[0];
      if (doc) {
        await queryNeon('DELETE FROM studypilot_documents WHERE id = $1;', [docId]);
      }
    } else {
      doc = memoryDocuments.get(docId);
      if (doc) {
        memoryDocuments.delete(docId);
      }
    }

    if (!doc) {
      return res.status(404).json({ error: { message: 'Document not found.', code: 'NOT_FOUND', status: 404 } });
    }

    await insertAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      admin_id: admin.id,
      admin_email: admin.email,
      target_user_id: doc.user_id,
      target_user_email: doc.user_email,
      document_id: doc.id,
      document_name: doc.name,
      action: 'ADMIN_DELETE_DOCUMENT',
      details: `Super Admin permanently deleted document "${doc.name}" (ID: ${doc.id}) owned by student ${doc.user_email || doc.user_id}.`
    });

    return res.status(200).json({
      success: true,
      message: `Document "${doc.name}" has been permanently deleted by Super Admin.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err?.message, code: 'DELETE_ERROR', status: 500 } });
  }
}

/**
 * Complete security audit logs
 */
export async function processAdminAuditLogs(req: any, res: any) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  if (!isNeonConfigured()) {
    return res.status(200).json({
      logs: Array.from(memoryAuditLogs.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    });
  }

  try {
    await ensureDatabaseSchema();
    const rows = await queryNeon<AuditLogRecord>(
      'SELECT * FROM studypilot_audit_logs ORDER BY created_at DESC LIMIT 250;'
    );
    return res.status(200).json({ logs: rows });
  } catch (err: any) {
    return res.status(200).json({ logs: [] });
  }
}

/**
 * System health and infrastructure review
 */
export async function processAdminSystemHealth(req: any, res: any) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  let dbConnected = false;
  let dbLatencyMs: number | undefined;
  if (isNeonConfigured()) {
    try {
      const start = Date.now();
      await queryNeon('SELECT 1;');
      dbLatencyMs = Date.now() - start;
      dbConnected = true;
    } catch {
      dbConnected = false;
    }
  }

  return res.status(200).json({
    status: 'online',
    version: 'StudyPilot AI Super Admin Console v2.5',
    database: {
      connected: dbConnected,
      storageType: isNeonConfigured() ? 'neon_postgres' : 'in_memory_dev',
      latencyMs: dbLatencyMs,
      tablesVerified: schemaInitialized
    },
    aiModel: {
      provider: 'Google Gemini',
      primaryModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      hasApiKey: Boolean((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim())
    },
    security: {
      authPolicy: 'password_only',
      hasAdminPasswordEnv: Boolean(process.env.ADMIN_PASSWORD),
      sessionDurationDays: 7,
      rateLimitWindowSeconds: 60,
      maxAttemptsPerWindow: 5
    }
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', req.headers?.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      req.body = JSON.parse(req.body);
    } catch {}
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

  const action = (req.query?.action || req.body?.action || '').toString().toLowerCase();
  const userId = (req.query?.userId || req.body?.userId || '').toString();
  const docId = (req.query?.id || req.body?.id || '').toString();

  try {
    // 1. Dedicated Admin Authentication Endpoints
    if (action === 'login' || (req.method === 'POST' && url.includes('/login'))) {
      return await processAdminLogin(req, res);
    }

    if (action === 'logout' || (req.method === 'POST' && url.includes('/logout'))) {
      return await processAdminLogout(req, res);
    }

    if (action === 'me' || url.includes('/me')) {
      return await processAdminMe(req, res);
    }

    // 2. Protected Administration Endpoints (requireSuperAdmin strictly enforced)
    if (action === 'overview' || (!action && req.method === 'GET')) {
      return await processAdminOverview(req, res);
    }

    if (action === 'users' || action === 'students') {
      return await processAdminUsers(req, res);
    }

    if (action === 'user-detail' || action === 'student-detail') {
      if (!userId) {
        return res.status(400).json({
          error: { message: 'User ID is required.', code: 'INVALID_INPUT', status: 400 }
        });
      }
      return await processAdminUserDetail(req, res, userId);
    }

    if (action === 'documents' || action === 'files') {
      return await processAdminDocuments(req, res);
    }

    if (action === 'document-detail' || action === 'file-detail') {
      if (!docId) {
        return res.status(400).json({
          error: { message: 'Document ID is required.', code: 'INVALID_INPUT', status: 400 }
        });
      }
      return await processAdminDocumentDetail(req, res, docId);
    }

    if (action === 'download') {
      if (!docId) {
        return res.status(400).json({
          error: { message: 'Document ID is required for download.', code: 'INVALID_INPUT', status: 400 }
        });
      }
      return await processAdminBinaryFile(req, res, docId, 'download');
    }

    if (action === 'preview') {
      if (!docId) {
        return res.status(400).json({
          error: { message: 'Document ID is required for preview.', code: 'INVALID_INPUT', status: 400 }
        });
      }
      return await processAdminBinaryFile(req, res, docId, 'preview');
    }

    if (action === 'delete-document' || action === 'delete-file' || (req.method === 'DELETE' && docId)) {
      if (!docId) {
        return res.status(400).json({
          error: { message: 'Document ID is required.', code: 'INVALID_INPUT', status: 400 }
        });
      }
      return await processAdminDeleteDocument(req, res, docId);
    }

    if (action === 'audit-logs' || action === 'activity') {
      return await processAdminAuditLogs(req, res);
    }

    if (action === 'health' || action === 'system-health' || action === 'settings') {
      return await processAdminSystemHealth(req, res);
    }

    return res.status(400).json({
      error: {
        message: `Unknown admin action: ${action}`,
        code: 'INVALID_ACTION',
        status: 400
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      error: {
        message: err?.message || 'Server error processing admin request.',
        code: 'ADMIN_ERROR',
        status: 500
      }
    });
  }
}
