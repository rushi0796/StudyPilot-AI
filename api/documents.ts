import crypto from 'crypto';
import { parseCookie } from 'cookie';
import { neon } from '@neondatabase/serverless';

export interface DocumentRecord {
  id: string;
  user_id: string;
  name: string;
  type: string;
  size: number;
  upload_status: string;
  processing_status: string;
  extracted_text?: string;
  chunks?: any[];
  chunk_count: number;
  word_count: number;
  file_data?: string;
  subject_id?: string;
  created_at: string;
  updated_at: string;
}

export const memoryDocuments = new Map<string, DocumentRecord>();
export const memorySessions = new Map<string, { user_id: string; expires_at: string }>();
export const memoryUsers = new Map<string, { id: string; email: string; name: string; role: 'student' | 'super_admin' }>();
export const memoryAuditLogs = new Map<string, any>();

async function recordAuditLog(adminId: string, adminEmail: string, targetUserId: string, docId: string, docName: string, action: string, details: string) {
  const now = new Date().toISOString();
  const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record = {
    id: logId,
    admin_id: adminId,
    admin_email: adminEmail,
    target_user_id: targetUserId,
    document_id: docId,
    document_name: docName,
    action,
    details,
    created_at: now
  };
  memoryAuditLogs.set(logId, record);
  if (isNeonConfigured()) {
    try {
      await ensureDatabaseSchema();
      await queryNeon(
        `INSERT INTO studypilot_audit_logs (
           id, admin_id, admin_email, target_user_id, document_id, document_name, action, details, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
        [logId, adminId, adminEmail, targetUserId, docId, docName, action, details, now]
      );
    } catch {}
  }
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
    console.warn('Documents ensureDatabaseSchema warning:', err);
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

export async function authenticateRequest(req: any): Promise<{ id: string; email: string; name: string; role: 'student' | 'super_admin' } | null> {
  const token = getSessionTokenFromRequest(req);
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const now = new Date().toISOString();

  if (!isNeonConfigured()) {
    const sess = memorySessions.get(tokenHash);
    if (!sess) return null;
    const u = memoryUsers.get(sess.user_id) || Array.from(memoryUsers.values()).find(x => x.id === sess.user_id);
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role === 'super_admin' ? 'super_admin' : 'student'
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
    if (!rows[0]) return null;
    const u = rows[0];
    const role: 'student' | 'super_admin' = u.role === 'super_admin' ? 'super_admin' : 'student';
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role
    };
  } catch (err) {
    return null;
  }
}

export async function processUploadDocument(req: any, res: any) {
  const user = await authenticateRequest(req);
  if (!user) {
    return res.status(401).json({
      error: {
        message: 'Authentication required to upload study documents.',
        code: 'UNAUTHENTICATED',
        status: 401
      }
    });
  }

  const body = req.body || {};
  const {
    id,
    name,
    type,
    size,
    extractedText,
    chunks,
    chunkCount,
    wordCount,
    fileData,
    subjectId
  } = body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      error: {
        message: 'Document name is required.',
        code: 'INVALID_INPUT',
        status: 400
      }
    });
  }

  const cleanName = name.trim().slice(0, 100);
  const docId = id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const cleanChunks = Array.isArray(chunks) ? chunks : [];
  const textContent = (extractedText || '').trim();
  const calculatedWords = wordCount || (textContent ? textContent.split(/\s+/).filter(Boolean).length : 0);
  const now = new Date().toISOString();

  const record: DocumentRecord = {
    id: docId,
    user_id: user.id,
    name: cleanName,
    type: (type || 'pdf').slice(0, 32),
    size: Number(size) || (fileData ? Math.round(fileData.length * 0.75) : 0),
    upload_status: 'completed',
    processing_status: 'indexed',
    extracted_text: textContent,
    chunks: cleanChunks,
    chunk_count: chunkCount || cleanChunks.length,
    word_count: calculatedWords,
    file_data: fileData || '',
    subject_id: subjectId || null,
    created_at: now,
    updated_at: now
  };

  if (!isNeonConfigured()) {
    memoryDocuments.set(record.id, record);
  } else {
    try {
      await ensureDatabaseSchema();
      await queryNeon(
        `INSERT INTO studypilot_documents (
           id, user_id, name, type, size, upload_status, processing_status, extracted_text, chunks, chunk_count, word_count, file_data, subject_id, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           size = EXCLUDED.size,
           upload_status = EXCLUDED.upload_status,
           processing_status = EXCLUDED.processing_status,
           extracted_text = EXCLUDED.extracted_text,
           chunks = EXCLUDED.chunks,
           chunk_count = EXCLUDED.chunk_count,
           word_count = EXCLUDED.word_count,
           file_data = EXCLUDED.file_data,
           updated_at = CURRENT_TIMESTAMP;`,
        [
          record.id,
          record.user_id,
          record.name,
          record.type,
          record.size,
          record.upload_status,
          record.processing_status,
          record.extracted_text || null,
          JSON.stringify(record.chunks || []),
          record.chunk_count,
          record.word_count,
          record.file_data || null,
          record.subject_id,
          record.created_at,
          record.updated_at
        ]
      );
    } catch (err: any) {
      console.warn('Database error persisting document:', err);
      memoryDocuments.set(record.id, record);
    }
  }

  return res.status(201).json({
    success: true,
    message: `Document "${cleanName}" uploaded and indexed successfully.`,
    document: {
      id: record.id,
      name: record.name,
      type: record.type,
      size: record.size,
      uploadStatus: record.upload_status,
      processingStatus: record.processing_status,
      chunkCount: record.chunk_count,
      wordCount: record.word_count,
      createdAt: record.created_at
    }
  });
}

export async function processListDocuments(req: any, res: any) {
  const user = await authenticateRequest(req);
  if (!user) {
    return res.status(401).json({
      error: {
        message: 'Authentication required to view documents.',
        code: 'UNAUTHENTICATED',
        status: 401
      }
    });
  }

  const queryAll = req.query?.all === 'true' || req.query?.all === true;
  const isSuperAdmin = user.role === 'super_admin';

  if (!isNeonConfigured()) {
    const userDocs: any[] = [];
    for (const d of memoryDocuments.values()) {
      if ((isSuperAdmin && queryAll) || d.user_id === user.id) {
        userDocs.push({
          id: d.id,
          userId: d.user_id,
          name: d.name,
          type: d.type,
          size: d.size,
          uploadStatus: d.upload_status,
          processingStatus: d.processing_status,
          chunkCount: d.chunk_count,
          wordCount: d.word_count,
          subjectId: d.subject_id,
          createdAt: d.created_at
        });
      }
    }
    return res.status(200).json({ documents: userDocs });
  }

  try {
    await ensureDatabaseSchema();
    let docs: any[];
    if (isSuperAdmin && queryAll) {
      docs = await queryNeon<any>(
        `SELECT id, user_id, name, type, size, upload_status, processing_status, chunk_count, word_count, subject_id, created_at
         FROM studypilot_documents
         ORDER BY created_at DESC;`
      );
    } else {
      docs = await queryNeon<any>(
        `SELECT id, name, type, size, upload_status, processing_status, chunk_count, word_count, subject_id, created_at
         FROM studypilot_documents
         WHERE user_id = $1
         ORDER BY created_at DESC;`,
        [user.id]
      );
    }

    return res.status(200).json({
      documents: docs.map(d => ({
        id: d.id,
        userId: d.user_id,
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
    return res.status(200).json({ documents: [] });
  }
}

export async function processGetDocument(req: any, res: any, docId: string, action?: string) {
  const user = await authenticateRequest(req);
  if (!user) {
    return res.status(401).json({
      error: {
        message: 'Authentication required to access documents.',
        code: 'UNAUTHENTICATED',
        status: 401
      }
    });
  }

  let doc: DocumentRecord | null = null;
  if (!isNeonConfigured()) {
    doc = memoryDocuments.get(docId) || null;
  } else {
    try {
      await ensureDatabaseSchema();
      const rows = await queryNeon<DocumentRecord>(
        'SELECT * FROM studypilot_documents WHERE id = $1 LIMIT 1;',
        [docId]
      );
      doc = rows[0] || null;
    } catch {
      doc = memoryDocuments.get(docId) || null;
    }
  }

  if (!doc) {
    return res.status(404).json({
      error: {
        message: 'Document not found.',
        code: 'NOT_FOUND',
        status: 404
      }
    });
  }

  if (doc.user_id !== user.id && user.role !== 'super_admin') {
    return res.status(403).json({
      error: {
        message: 'You do not have permission to access this document.',
        code: 'FORBIDDEN',
        status: 403
      }
    });
  }

  // Handle Download or Preview Binary Action
  if (action === 'download' || action === 'preview') {
    if (user.role === 'super_admin' && doc.user_id !== user.id) {
      await recordAuditLog(
        user.id,
        user.email,
        doc.user_id,
        doc.id,
        doc.name,
        action === 'download' ? 'DOWNLOAD_STUDENT_DOCUMENT' : 'PREVIEW_STUDENT_DOCUMENT',
        `Super Admin accessed student document "${doc.name}" via ${action}.`
      );
    }

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
      buffer = Buffer.from(doc.extracted_text || rawData, 'utf-8');
      mimeType = 'text/plain';
    }

    const disposition = action === 'download' ? 'attachment' : 'inline';
    const filename = encodeURIComponent(doc.name);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"; filename*=UTF-8''${filename}`);
    res.setHeader('Content-Length', buffer.length);
    return res.status(200).send(buffer);
  }

  // Detail view (chunks and extracted text)
  return res.status(200).json({
    document: {
      id: doc.id,
      userId: doc.user_id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      uploadStatus: doc.upload_status,
      processingStatus: doc.processing_status,
      extractedText: doc.extracted_text,
      chunks: typeof doc.chunks === 'string' ? JSON.parse(doc.chunks) : (doc.chunks || []),
      chunkCount: doc.chunk_count,
      wordCount: doc.word_count,
      subjectId: doc.subject_id,
      createdAt: doc.created_at
    }
  });
}

export async function processDeleteDocument(req: any, res: any, docId: string) {
  const user = await authenticateRequest(req);
  if (!user) {
    return res.status(401).json({
      error: {
        message: 'Authentication required to delete documents.',
        code: 'UNAUTHENTICATED',
        status: 401
      }
    });
  }

  let doc: DocumentRecord | null = null;
  if (!isNeonConfigured()) {
    doc = memoryDocuments.get(docId) || null;
  } else {
    try {
      await ensureDatabaseSchema();
      const rows = await queryNeon<DocumentRecord>(
        'SELECT * FROM studypilot_documents WHERE id = $1 LIMIT 1;',
        [docId]
      );
      doc = rows[0] || null;
    } catch {
      doc = memoryDocuments.get(docId) || null;
    }
  }

  if (!doc) {
    return res.status(404).json({
      error: {
        message: 'Document not found.',
        code: 'NOT_FOUND',
        status: 404
      }
    });
  }

  if (doc.user_id !== user.id && user.role !== 'super_admin') {
    return res.status(403).json({
      error: {
        message: 'Forbidden. You do not have permission to delete this document.',
        code: 'FORBIDDEN',
        status: 403
      }
    });
  }

  if (!isNeonConfigured()) {
    memoryDocuments.delete(docId);
  } else {
    try {
      await queryNeon('DELETE FROM studypilot_documents WHERE id = $1;', [docId]);
    } catch (err: any) {
      return res.status(500).json({
        error: {
          message: `Database error removing document: ${err?.message || 'Unknown error'}`,
          code: 'DB_ERROR',
          status: 500
        }
      });
    }
  }

  if (user.role === 'super_admin' && doc.user_id !== user.id) {
    await recordAuditLog(
      user.id,
      user.email,
      doc.user_id,
      doc.id,
      doc.name,
      'ADMIN_DELETE_DOCUMENT',
      `Super Admin deleted document "${doc.name}" owned by student ${doc.user_id}.`
    );
  }

  return res.status(200).json({
    success: true,
    message: `Document "${doc.name}" deleted successfully.`
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

  const docId = (req.query?.id || req.body?.id || '').toString();
  const action = (req.query?.action || req.body?.action || '').toString().toLowerCase();

  try {
    if (req.method === 'POST') {
      return await processUploadDocument(req, res);
    }

    if (req.method === 'GET') {
      if (docId) {
        return await processGetDocument(req, res, docId, action);
      }
      return await processListDocuments(req, res);
    }

    if (req.method === 'DELETE') {
      if (!docId) {
        return res.status(400).json({
          error: {
            message: 'Document ID is required for deletion.',
            code: 'INVALID_INPUT',
            status: 400
          }
        });
      }
      return await processDeleteDocument(req, res, docId);
    }

    return res.status(405).json({
      error: {
        message: 'Method Not Allowed. Use GET, POST, or DELETE.',
        code: 'METHOD_NOT_ALLOWED',
        status: 405
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      error: {
        message: err?.message || 'Server error processing document request.',
        code: 'DOCUMENT_ERROR',
        status: 500
      }
    });
  }
}
