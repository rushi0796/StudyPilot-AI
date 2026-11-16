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
export const memorySessions = new Map<string, { user_id: string; expires_at: string }>();
export const memoryUsers = new Map<string, any>();
export const memoryDocuments = new Map<string, any>();

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

export function getSessionTokenFromRequest(req: any): string | null {
  const cookieHeader = req?.headers?.cookie || req?.headers?.Cookie || '';
  if (cookieHeader) {
    try {
      const parsed = parseCookie(cookieHeader);
      if (parsed['studypilot_session']) {
        return parsed['studypilot_session'];
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

export function isSuperAdminEmail(email?: string): boolean {
  if (!email) return false;
  const adminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  
  const defaultAdmin = (process.env.ADMIN_EMAIL || 'admin@studypilot.ai').trim().toLowerCase();
  if (defaultAdmin && email.toLowerCase() === defaultAdmin) return true;

  return adminEmails.includes(email.toLowerCase());
}

export async function requireSuperAdmin(req: any): Promise<{ user: { id: string; email: string; name: string } } | { error: { message: string; code: string; status: number } }> {
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
          message: 'Authentication required. Please sign in as Super Admin.',
          code: 'UNAUTHENTICATED',
          status: 401
        }
      };
    }
    const u = memoryUsers.get(sess.user_id) || Array.from(memoryUsers.values()).find(x => x.id === sess.user_id);
    if (!u) {
      return {
        error: {
          message: 'User not found.',
          code: 'UNAUTHENTICATED',
          status: 401
        }
      };
    }
    const isSuperAdmin = u.role === 'super_admin' || isSuperAdminEmail(u.email);
    if (!isSuperAdmin) {
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
        name: u.name
      }
    };
  }

  try {
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
          message: 'Invalid or expired session. Please sign in again.',
          code: 'UNAUTHENTICATED',
          status: 401
        }
      };
    }

    const u = rows[0];
    const isSuperAdmin = u.role === 'super_admin' || isSuperAdminEmail(u.email);
    if (!isSuperAdmin) {
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
        name: u.name
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

export async function processAdminOverview(req: any, res: any) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  let totalStudents = 0;
  let totalSuperAdmins = 0;
  let totalDocuments = 0;
  let totalChunks = 0;
  let totalWords = 0;
  let recentStudents: any[] = [];
  let recentDocuments: any[] = [];

  if (isNeonConfigured()) {
    try {
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
           COALESCE(SUM(chunk_count), 0) as chunks,
           COALESCE(SUM(word_count), 0) as words
         FROM studypilot_documents;`
      );
      totalDocuments = Number(docCounts[0]?.docs) || 0;
      totalChunks = Number(docCounts[0]?.chunks) || 0;
      totalWords = Number(docCounts[0]?.words) || 0;

      recentStudents = await queryNeon<any>(
        `SELECT id, name, email, university, course, branch, semester, created_at
         FROM studypilot_users
         WHERE role != 'super_admin'
         ORDER BY created_at DESC
         LIMIT 5;`
      );

      recentDocuments = await queryNeon<any>(
        `SELECT d.id, d.name, d.type, d.size, d.chunk_count, d.word_count, d.created_at, u.name as user_name, u.email as user_email
         FROM studypilot_documents d
         LEFT JOIN studypilot_users u ON d.user_id = u.id
         ORDER BY d.created_at DESC
         LIMIT 5;`
      );
    } catch {}
  } else {
    for (const u of memoryUsers.values()) {
      if (u.role === 'super_admin' || isSuperAdminEmail(u.email)) {
        totalSuperAdmins++;
      } else {
        totalStudents++;
        recentStudents.push(u);
      }
    }
    for (const d of memoryDocuments.values()) {
      totalDocuments++;
      totalChunks += Number(d.chunk_count || d.chunkCount || d.chunks?.length || 0);
      totalWords += Number(d.word_count || d.wordCount || 0);
      recentDocuments.push(d);
    }
  }

  return res.status(200).json({
    metrics: {
      totalStudents,
      totalSuperAdmins,
      totalDocuments,
      totalIndexedChunks: totalChunks,
      totalExtractedWords: totalWords,
      serverTime: new Date().toISOString()
    },
    recentStudents,
    recentDocuments
  });
}

export async function processAdminUsers(req: any, res: any) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  if (!isNeonConfigured()) {
    return res.status(200).json({ users: [] });
  }

  try {
    const rows = await queryNeon<any>(
      `SELECT id, email, name, university, course, branch, year, semester, preferred_language, role, onboarding_completed, created_at
       FROM studypilot_users
       ORDER BY created_at DESC;`
    );
    const users = rows.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      university: u.university,
      course: u.course,
      branch: u.branch,
      year: u.year,
      semester: u.semester,
      preferredLanguage: u.preferred_language,
      role: (u.role === 'super_admin' || isSuperAdminEmail(u.email)) ? 'super_admin' : 'student',
      onboardingCompleted: Boolean(u.onboarding_completed),
      createdAt: u.created_at
    }));
    return res.status(200).json({ users });
  } catch (err: any) {
    return res.status(200).json({ users: [] });
  }
}

export async function processAdminUserDetail(req: any, res: any, targetUserId: string) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  if (!isNeonConfigured()) {
    return res.status(404).json({ error: { message: 'Student record not found.', code: 'NOT_FOUND', status: 404 } });
  }

  try {
    const rows = await queryNeon<any>(
      'SELECT * FROM studypilot_users WHERE id = $1 LIMIT 1;',
      [targetUserId]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: { message: 'Student record not found.', code: 'NOT_FOUND', status: 404 } });
    }
    const targetUser = rows[0];

    const documents = await queryNeon<any>(
      `SELECT id, name, type, size, upload_status, processing_status, chunk_count, word_count, subject_id, created_at
       FROM studypilot_documents
       WHERE user_id = $1
       ORDER BY created_at DESC;`,
      [targetUserId]
    );

    return res.status(200).json({
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        university: targetUser.university,
        course: targetUser.course,
        branch: targetUser.branch,
        year: targetUser.year,
        semester: targetUser.semester,
        preferredLanguage: targetUser.preferred_language,
        role: targetUser.role,
        onboardingCompleted: Boolean(targetUser.onboarding_completed),
        createdAt: targetUser.created_at
      },
      documents: documents.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        size: d.size,
        uploadStatus: d.upload_status,
        processingStatus: d.processing_status,
        chunkCount: d.chunk_count,
        wordCount: d.word_count,
        subjectId: d.subject_id,
        createdAt: d.created_at
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err?.message, code: 'DB_ERROR', status: 500 } });
  }
}

export async function processAdminDocuments(req: any, res: any) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  if (!isNeonConfigured()) {
    return res.status(200).json({ documents: [] });
  }

  try {
    const rows = await queryNeon<any>(
      `SELECT d.id, d.user_id, d.name, d.type, d.size, d.upload_status, d.processing_status, d.chunk_count, d.word_count, d.created_at,
              u.email as user_email, u.name as user_name
       FROM studypilot_documents d
       LEFT JOIN studypilot_users u ON d.user_id = u.id
       ORDER BY d.created_at DESC;`
    );
    return res.status(200).json({ documents: rows });
  } catch (err: any) {
    return res.status(200).json({ documents: [] });
  }
}

export async function processAdminDocumentDetail(req: any, res: any, docId: string) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  if (!isNeonConfigured()) {
    return res.status(404).json({ error: { message: 'Document not found.', code: 'NOT_FOUND', status: 404 } });
  }

  try {
    const rows = await queryNeon<any>(
      `SELECT d.*, u.name as student_name, u.email as student_email
       FROM studypilot_documents d
       LEFT JOIN studypilot_users u ON d.user_id = u.id
       WHERE d.id = $1 LIMIT 1;`,
      [docId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: { message: 'Document not found.', code: 'NOT_FOUND', status: 404 } });
    }

    const doc = rows[0];

    return res.status(200).json({
      document: {
        id: doc.id,
        userId: doc.user_id,
        studentName: doc.student_name || 'Unknown',
        studentEmail: doc.student_email || 'unknown',
        name: doc.name,
        type: doc.type,
        size: doc.size,
        uploadStatus: doc.upload_status,
        processingStatus: doc.processing_status,
        extractedText: doc.extracted_text,
        chunks: typeof doc.chunks === 'string' ? JSON.parse(doc.chunks) : (doc.chunks || []),
        chunkCount: doc.chunk_count,
        wordCount: doc.word_count,
        createdAt: doc.created_at
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err?.message, code: 'DB_ERROR', status: 500 } });
  }
}

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
    const rows = await queryNeon<AuditLogRecord>(
      'SELECT * FROM studypilot_audit_logs ORDER BY created_at DESC LIMIT 200;'
    );
    return res.status(200).json({ logs: rows });
  } catch (err: any) {
    return res.status(200).json({ logs: [] });
  }
}

export async function processAdminDeleteDocument(req: any, res: any, docId: string) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  const admin = authCheck.user;

  try {
    let doc: any = null;
    if (isNeonConfigured()) {
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = (req.query?.action || req.body?.action || '').toString();
  const userId = (req.query?.userId || req.body?.userId || '').toString();
  const docId = (req.query?.id || req.body?.id || '').toString();

  try {
    if (action === 'overview' || (!action && req.method === 'GET')) {
      return await processAdminOverview(req, res);
    }

    if (action === 'users') {
      return await processAdminUsers(req, res);
    }

    if (action === 'user-detail') {
      if (!userId) {
        return res.status(400).json({
          error: { message: 'User ID is required.', code: 'INVALID_INPUT', status: 400 }
        });
      }
      return await processAdminUserDetail(req, res, userId);
    }

    if (action === 'documents') {
      return await processAdminDocuments(req, res);
    }

    if (action === 'document-detail') {
      if (!docId) {
        return res.status(400).json({
          error: { message: 'Document ID is required.', code: 'INVALID_INPUT', status: 400 }
        });
      }
      return await processAdminDocumentDetail(req, res, docId);
    }

    if (action === 'delete-document') {
      if (!docId) {
        return res.status(400).json({
          error: { message: 'Document ID is required.', code: 'INVALID_INPUT', status: 400 }
        });
      }
      return await processAdminDeleteDocument(req, res, docId);
    }

    if (action === 'audit-logs') {
      return await processAdminAuditLogs(req, res);
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
