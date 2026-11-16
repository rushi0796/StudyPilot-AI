import {
  requireSuperAdmin,
  listAllUsersAdmin,
  listAllDocumentsAdmin,
  findDocumentById,
  deleteDocumentById,
  insertAuditLog,
  listAuditLogsAdmin,
  findUserById,
  listDocumentsByUser,
  queryNeon,
  isNeonConfigured,
  memoryDocuments,
  memoryUsers
} from './auth.ts';

export async function processAdminOverview(req: any, res: any) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  const users = await listAllUsersAdmin();
  const students = users.filter(u => u.role !== 'super_admin');
  const documents = await listAllDocumentsAdmin();

  let totalChunks = 0;
  let totalWords = 0;

  for (const doc of documents) {
    totalChunks += Number(doc.chunk_count) || 0;
    totalWords += Number(doc.word_count) || 0;
  }

  return res.status(200).json({
    metrics: {
      totalStudents: students.length,
      totalSuperAdmins: users.length - students.length,
      totalDocuments: documents.length,
      totalIndexedChunks: totalChunks,
      totalExtractedWords: totalWords,
      serverTime: new Date().toISOString()
    },
    recentStudents: students.slice(0, 5),
    recentDocuments: documents.slice(0, 5)
  });
}

export async function processAdminUsers(req: any, res: any) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  const users = await listAllUsersAdmin();
  return res.status(200).json({ users });
}

export async function processAdminUserDetail(req: any, res: any, targetUserId: string) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({
      error: {
        message: 'Student record not found.',
        code: 'NOT_FOUND',
        status: 404
      }
    });
  }

  const documents = await listDocumentsByUser(targetUserId);

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
    documents
  });
}

export async function processAdminDocuments(req: any, res: any) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  const documents = await listAllDocumentsAdmin();
  return res.status(200).json({ documents });
}

export async function processAdminDocumentDetail(req: any, res: any, docId: string) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  const doc = await findDocumentById(docId);
  if (!doc) {
    return res.status(404).json({
      error: {
        message: 'Document not found.',
        code: 'NOT_FOUND',
        status: 404
      }
    });
  }

  const student = await findUserById(doc.user_id);

  return res.status(200).json({
    document: {
      id: doc.id,
      userId: doc.user_id,
      studentName: student?.name || 'Unknown',
      studentEmail: student?.email || 'unknown',
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
}

export async function processAdminAuditLogs(req: any, res: any) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  const logs = await listAuditLogsAdmin();
  return res.status(200).json({ logs });
}

export async function processAdminDeleteDocument(req: any, res: any, docId: string) {
  const authCheck = await requireSuperAdmin(req);
  if ('error' in authCheck) {
    return res.status(authCheck.error.status).json(authCheck);
  }

  const admin = authCheck.user;
  const doc = await findDocumentById(docId);
  if (!doc) {
    return res.status(404).json({
      error: {
        message: 'Document not found.',
        code: 'NOT_FOUND',
        status: 404
      }
    });
  }

  const targetUser = await findUserById(doc.user_id);

  await deleteDocumentById(docId);

  await insertAuditLog({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    admin_id: admin.id,
    admin_email: admin.email,
    target_user_id: doc.user_id,
    target_user_email: targetUser?.email,
    document_id: doc.id,
    document_name: doc.name,
    action: 'ADMIN_DELETE_DOCUMENT',
    details: `Super Admin permanently deleted document "${doc.name}" (ID: ${doc.id}) owned by student ${targetUser?.email || doc.user_id}.`
  });

  return res.status(200).json({
    success: true,
    message: `Document "${doc.name}" has been permanently deleted by Super Admin.`
  });
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
