import {
  authenticateRequest,
  getUserRole,
  insertDocument,
  findDocumentById,
  listDocumentsByUser,
  deleteDocumentById,
  insertAuditLog,
  findUserById
} from './auth.ts';

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

  const newDoc = await insertDocument({
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
    subject_id: subjectId || null
  });

  return res.status(201).json({
    document: {
      id: newDoc.id,
      name: newDoc.name,
      type: newDoc.type,
      size: newDoc.size,
      uploadStatus: newDoc.upload_status,
      processingStatus: newDoc.processing_status,
      chunkCount: newDoc.chunk_count,
      wordCount: newDoc.word_count,
      subjectId: newDoc.subject_id,
      createdAt: newDoc.created_at
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

  const docs = await listDocumentsByUser(user.id);
  return res.status(200).json({
    documents: docs.map(d => ({
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

  const role = getUserRole(user);
  if (doc.user_id !== user.id && role !== 'super_admin') {
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
    if (role === 'super_admin' && doc.user_id !== user.id) {
      await insertAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        admin_id: user.id,
        admin_email: user.email,
        target_user_id: doc.user_id,
        document_id: doc.id,
        document_name: doc.name,
        action: action === 'download' ? 'DOWNLOAD_STUDENT_DOCUMENT' : 'PREVIEW_STUDENT_DOCUMENT',
        details: `Super Admin accessed document "${doc.name}" via ${action}.`
      });
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

  const role = getUserRole(user);
  if (doc.user_id !== user.id && role !== 'super_admin') {
    return res.status(403).json({
      error: {
        message: 'You do not have permission to delete this document.',
        code: 'FORBIDDEN',
        status: 403
      }
    });
  }

  await deleteDocumentById(docId);

  if (role === 'super_admin' && doc.user_id !== user.id) {
    await insertAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      admin_id: user.id,
      admin_email: user.email,
      target_user_id: doc.user_id,
      document_id: doc.id,
      document_name: doc.name,
      action: 'DELETE_STUDENT_DOCUMENT',
      details: `Super Admin deleted student document "${doc.name}" (ID: ${doc.id}).`
    });
  }

  return res.status(200).json({
    success: true,
    message: `Document "${doc.name}" deleted successfully.`
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const docId = (req.query?.id || req.body?.id || '').toString();
  const action = (req.query?.action || '').toString();

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
        message: 'Method Not Allowed.',
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
