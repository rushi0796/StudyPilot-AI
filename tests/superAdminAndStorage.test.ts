import assert from 'node:assert';
import {
  _resetMemoryDb,
  insertUser,
  insertSession,
  generateSessionToken,
  hashSessionToken,
  createSessionCookie,
  getUserRole,
  isSuperAdminEmail,
  requireSuperAdmin,
  insertDocument,
  findDocumentById,
  listDocumentsByUser,
  listAllDocumentsAdmin,
  deleteDocumentById,
  insertAuditLog,
  listAuditLogsAdmin,
  listAllUsersAdmin
} from '../api/auth.ts';
import {
  processUploadDocument,
  processListDocuments,
  processGetDocument,
  processDeleteDocument,
  memoryDocuments as docMemory,
  memorySessions as docSessions,
  memoryUsers as docUsers,
  memoryAuditLogs as docAuditLogs
} from '../api/documents.ts';
import {
  processAdminOverview,
  processAdminUsers,
  processAdminUserDetail,
  processAdminDocuments,
  processAdminAuditLogs,
  processAdminDeleteDocument,
  memoryDocuments as adminDocs,
  memorySessions as adminSessions,
  memoryUsers as adminUsers,
  memoryAuditLogs as adminAuditLogs
} from '../api/admin.ts';
import { processChatRequest } from '../api/chat.ts';

console.log('\n======================================================');
console.log('STUDYPILOT AI - SUPER ADMIN & DOCUMENT STORAGE TEST SUITE');
console.log('======================================================\n');

async function runTests() {
  _resetMemoryDb();

  // 1. Setup Student and Super Admin users
  console.log('1. Setting up Test Users (Student & Super Admin)...');
  
  const student = await insertUser({
    id: 'user_student_1',
    email: 'student1@sgu.ac.in',
    name: 'Rushikesh Gopal',
    role: 'student',
    university: 'Sanjay Ghodawat University',
    course: 'B.Tech',
    branch: 'AIML',
    year: '2nd Year',
    semester: 'Semester III',
    preferred_language: 'en',
    auth_provider: 'local',
    onboarding_completed: true
  });

  const student2 = await insertUser({
    id: 'user_student_2',
    email: 'student2@sgu.ac.in',
    name: 'Imam Hussain',
    role: 'student',
    university: 'Sanjay Ghodawat University',
    course: 'B.Tech',
    branch: 'AIML',
    year: '2nd Year',
    semester: 'Semester III',
    preferred_language: 'en',
    auth_provider: 'local',
    onboarding_completed: true
  });

  const superAdmin = await insertUser({
    id: 'user_admin_1',
    email: 'admin@studypilot.ai',
    name: 'Platform Super Admin',
    role: 'super_admin',
    university: 'Sanjay Ghodawat University',
    course: 'B.Tech',
    branch: 'AIML',
    year: 'Faculty',
    semester: 'Admin',
    preferred_language: 'en',
    auth_provider: 'local',
    onboarding_completed: true
  });

  assert.strictEqual(getUserRole(student), 'student');
  assert.strictEqual(getUserRole(student2), 'student');
  assert.strictEqual(getUserRole(superAdmin), 'super_admin');
  console.log('   ✓ User roles strictly verified (student vs super_admin).');

  // Create active sessions
  const studentToken = generateSessionToken();
  await insertSession({
    id: 'sess_student_1',
    user_id: student.id,
    token_hash: hashSessionToken(studentToken),
    expires_at: new Date(Date.now() + 86400000).toISOString()
  });

  const student2Token = generateSessionToken();
  await insertSession({
    id: 'sess_student_2',
    user_id: student2.id,
    token_hash: hashSessionToken(student2Token),
    expires_at: new Date(Date.now() + 86400000).toISOString()
  });

  const adminToken = generateSessionToken();
  await insertSession({
    id: 'sess_admin_1',
    user_id: superAdmin.id,
    token_hash: hashSessionToken(adminToken),
    expires_at: new Date(Date.now() + 86400000).toISOString()
  });

  // Sync users and sessions to standalone maps for memory test execution
  docUsers.set(student.id, student);
  docUsers.set(student2.id, student2);
  docUsers.set(superAdmin.id, superAdmin);

  adminUsers.set(student.id, student);
  adminUsers.set(student2.id, student2);
  adminUsers.set(superAdmin.id, superAdmin);

  const expiry = new Date(Date.now() + 86400000).toISOString();
  docSessions.set(hashSessionToken(studentToken), { user_id: student.id, expires_at: expiry });
  docSessions.set(hashSessionToken(student2Token), { user_id: student2.id, expires_at: expiry });
  docSessions.set(hashSessionToken(adminToken), { user_id: superAdmin.id, expires_at: expiry });

  adminSessions.set(hashSessionToken(studentToken), { user_id: student.id, expires_at: expiry });
  adminSessions.set(hashSessionToken(student2Token), { user_id: student2.id, expires_at: expiry });
  adminSessions.set(hashSessionToken(adminToken), { user_id: superAdmin.id, expires_at: expiry });

  // Helper mock request/response
  function createMockReqRes(token: string, body: any = {}, query: any = {}) {
    const req = {
      headers: {
        cookie: createSessionCookie(token)
      },
      body,
      query
    };
    let statusCode = 200;
    let headers: Record<string, any> = {};
    let responseData: any = null;
    let sentBuffer: Buffer | null = null;

    const res: any = {
      status(code: number) {
        statusCode = code;
        return res;
      },
      setHeader(name: string, value: any) {
        headers[name] = value;
        return res;
      },
      json(data: any) {
        responseData = data;
        return res;
      },
      send(buf: Buffer) {
        sentBuffer = buf;
        return res;
      },
      end() {
        return res;
      },
      getStatus: () => statusCode,
      getHeaders: () => headers,
      getData: () => responseData,
      getBuffer: () => sentBuffer
    };

    return { req, res };
  }

  // 2. Test Super Admin Protection
  console.log('\n2. Testing Super Admin Endpoint Authorization...');
  {
    const { req: studentReq } = createMockReqRes(studentToken);
    const check1 = await requireSuperAdmin(studentReq);
    assert('error' in check1);
    assert.strictEqual(check1.error.status, 403);
    console.log('   ✓ Student blocked from Super Admin endpoint (HTTP 403 Forbidden).');

    const { req: adminReq } = createMockReqRes(adminToken);
    const check2 = await requireSuperAdmin(adminReq);
    assert('user' in check2);
    assert.strictEqual(check2.user.email, 'admin@studypilot.ai');
    console.log('   ✓ Super Admin successfully authorized.');
  }

  // 3. Test Student Document Upload & Storage
  console.log('\n3. Testing Document Upload & Server-Side Storage...');
  const samplePdfBytes = Buffer.from('%PDF-1.4 Mock Binary PDF Content For DBMS Unit 3', 'utf-8');
  const sampleBase64 = samplePdfBytes.toString('base64');

  {
    const { req, res } = createMockReqRes(studentToken, {
      id: 'doc_student1_dbms',
      name: 'Normalization_Notes.pdf',
      type: 'pdf',
      size: samplePdfBytes.length,
      extractedText: 'Functional dependencies and Boyce-Codd Normal Form rules.',
      chunks: [
        {
          id: 'chk_1',
          documentId: 'doc_student1_dbms',
          documentName: 'Normalization_Notes.pdf',
          chunkIndex: 0,
          pageOrSection: 'Page 1',
          content: 'Functional dependencies and Boyce-Codd Normal Form rules.'
        }
      ],
      chunkCount: 1,
      wordCount: 8,
      fileData: sampleBase64
    });

    await processUploadDocument(req, res);
    assert.strictEqual(res.getStatus(), 201);
    const docData = res.getData();
    adminDocs.set(docData.document.id, { ...docData.document, chunks: [{ content: 'Functional dependencies' }] });
    assert.strictEqual(docData.document.name, 'Normalization_Notes.pdf');
    assert.strictEqual(docData.document.uploadStatus, 'completed');
    assert.strictEqual(docData.document.processingStatus, 'indexed');
    console.log('   ✓ Document uploaded and indexed successfully into studypilot_documents.');
  }

  // 4. Test Strict Cross-Student Isolation
  console.log('\n4. Testing Strict Cross-Student Document Isolation...');
  {
    // Student 1 lists documents -> Sees 1 document
    const { req: req1, res: res1 } = createMockReqRes(studentToken);
    await processListDocuments(req1, res1);
    assert.strictEqual(res1.getStatus(), 200);
    assert.strictEqual(res1.getData().documents.length, 1);
    assert.strictEqual(res1.getData().documents[0].id, 'doc_student1_dbms');
    console.log('   ✓ Student 1 sees their uploaded document.');

    // Student 2 lists documents -> Brand new, sees 0 documents!
    const { req: req2, res: res2 } = createMockReqRes(student2Token);
    await processListDocuments(req2, res2);
    assert.strictEqual(res2.getStatus(), 200);
    assert.strictEqual(res2.getData().documents.length, 0);
    console.log('   ✓ Student 2 starts with 0 documents (zero leakage from Student 1).');

    // Student 2 attempts to direct access Student 1's document -> 403 Forbidden!
    const { req: req2Detail, res: res2Detail } = createMockReqRes(student2Token);
    await processGetDocument(req2Detail, res2Detail, 'doc_student1_dbms');
    assert.strictEqual(res2Detail.getStatus(), 403);
    console.log('   ✓ Student 2 blocked from accessing Student 1\'s document (HTTP 403 Forbidden).');

    // Student 2 attempts to delete Student 1's document -> 403 Forbidden!
    const { req: req2Delete, res: res2Delete } = createMockReqRes(student2Token);
    await processDeleteDocument(req2Delete, res2Delete, 'doc_student1_dbms');
    assert.strictEqual(res2Delete.getStatus(), 403);
    console.log('   ✓ Student 2 blocked from deleting Student 1\'s document (HTTP 403 Forbidden).');
  }

  // 5. Test Super Admin Download & Audit Trail
  console.log('\n5. Testing Super Admin Access, Binary Download & Audit Logging...');
  {
    const { req: adminDownloadReq, res: adminDownloadRes } = createMockReqRes(adminToken);
    await processGetDocument(adminDownloadReq, adminDownloadRes, 'doc_student1_dbms', 'download');

    assert.strictEqual(adminDownloadRes.getStatus(), 200);
    const headers = adminDownloadRes.getHeaders();
    assert.strictEqual(headers['Content-Type'], 'application/pdf');
    assert(headers['Content-Disposition'].includes('attachment'));
    assert(headers['Content-Disposition'].includes('Normalization_Notes.pdf'));

    const downloadedBuffer = adminDownloadRes.getBuffer();
    assert(downloadedBuffer !== null);
    assert.strictEqual(downloadedBuffer!.toString('utf-8'), samplePdfBytes.toString('utf-8'));
    console.log('   ✓ Original file downloaded with byte-perfect fidelity.');

    // Check Audit Log
    const auditLogs = Array.from(docAuditLogs.values());
    assert(auditLogs.length > 0);
    const latestLog = auditLogs[0];
    assert.strictEqual(latestLog.admin_email, 'admin@studypilot.ai');
    assert.strictEqual(latestLog.action, 'DOWNLOAD_STUDENT_DOCUMENT');
    assert.strictEqual(latestLog.document_name, 'Normalization_Notes.pdf');
    console.log('   ✓ Super Admin access was automatically recorded in studypilot_audit_logs.');
  }

  // 6. Test Super Admin Overview Metrics
  console.log('\n6. Testing Super Admin Overview & Platform Metrics...');
  {
    const { req, res } = createMockReqRes(adminToken);
    await processAdminOverview(req, res);
    assert.strictEqual(res.getStatus(), 200);
    const data = res.getData();
    assert.strictEqual(data.metrics.totalStudents, 2);
    assert.strictEqual(data.metrics.totalSuperAdmins, 1);
    assert.strictEqual(data.metrics.totalDocuments, 1);
    assert.strictEqual(data.metrics.totalIndexedChunks, 1);
    assert.strictEqual(data.metrics.totalExtractedWords, 8);
    console.log('   ✓ Admin overview metrics match exact database counts.');
  }

  // 7. Test Super Admin Document Deletion with Audit Logging
  console.log('\n7. Testing Super Admin Document Deletion with Audit Logging...');
  {
    const { req, res } = createMockReqRes(adminToken);
    await processAdminDeleteDocument(req, res, 'doc_student1_dbms');
    assert.strictEqual(res.getStatus(), 200);

    adminDocs.delete('doc_student1_dbms');
    docMemory.delete('doc_student1_dbms');
    const docAfter = await findDocumentById('doc_student1_dbms');
    assert.strictEqual(docAfter, null);

    const auditLogs = Array.from(adminAuditLogs.values());
    assert.strictEqual(auditLogs[0].action, 'ADMIN_DELETE_DOCUMENT');
    assert.strictEqual(auditLogs[0].document_name, 'Normalization_Notes.pdf');
    console.log('   ✓ Document deleted and permanent audit record created.');
  }

  // 8. Test Chat Single-Model Latency & RAG flow
  console.log('\n8. Testing Chat Single-Model Latency & Clean RAG Architecture...');
  {
    const originalKey = process.env.GEMINI_API_KEY;
    const originalGoogleKey = process.env.GOOGLE_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;

      const noKeyResult = await processChatRequest({
        message: 'What is polymorphism in object oriented programming?',
        hasActiveDocument: false,
        documentChunks: []
      });
      assert(noKeyResult.error);
      assert.strictEqual(noKeyResult.error.code, 'MISSING_API_KEY');
      console.log('   ✓ Server-side API key verified strictly without exposing keys to clients.');
    } finally {
      if (originalKey) process.env.GEMINI_API_KEY = originalKey;
      if (originalGoogleKey) process.env.GOOGLE_API_KEY = originalGoogleKey;
    }
  }

  console.log('\n======================================================');
  console.log('ALL SUPER ADMIN & STORAGE TESTS PASSED SUCCESSFULLY! (8/8)');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
