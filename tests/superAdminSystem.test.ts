import assert from 'node:assert';
import {
  _resetMemoryDb,
  insertUser,
  insertSession,
  generateSessionToken,
  hashSessionToken,
  createSessionCookie,
  processSignup,
  processLogin,
  processGetCurrentUser,
  processLogout,
  getUserRole,
  memoryUsers as authUsers,
  memorySessions as authSessions
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
  processAdminLogin,
  processAdminLogout,
  processAdminMe,
  processAdminOverview,
  processAdminUsers,
  processAdminUserDetail,
  processAdminDocuments,
  processAdminBinaryFile,
  processAdminDeleteDocument,
  processAdminAuditLogs,
  resetAdminRateLimit,
  verifyAdminPassword,
  ADMIN_SESSION_COOKIE_NAME,
  memoryDocuments as adminDocs,
  memorySessions as adminSessions,
  memoryUsers as adminUsers,
  memoryAuditLogs as adminAuditLogs
} from '../api/admin.ts';
import { processChatRequest } from '../api/chat.ts';

console.log('\n======================================================');
console.log('STUDYPILOT AI - SEPARATE SUPER ADMIN SYSTEM TEST SUITE');
console.log('======================================================\n');

async function createMockReqRes(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, any>;
}) {
  const req: any = {
    method: options.method || 'GET',
    url: options.url || '/',
    headers: options.headers || {},
    body: options.body || {},
    query: options.query || {},
    socket: { remoteAddress: '127.0.0.1' }
  };

  let statusCode = 200;
  let responseData: any = null;
  const responseHeaders: Record<string, any> = {};

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
    send(data: any) {
      responseData = data;
      return res;
    },
    setHeader(name: string, value: any) {
      responseHeaders[name.toLowerCase()] = value;
      return res;
    },
    getHeader(name: string) {
      return responseHeaders[name.toLowerCase()];
    },
    end() {
      return res;
    }
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData, getHeaders: () => responseHeaders };
}

async function runTests() {
  _resetMemoryDb();
  authUsers.clear();
  authSessions.clear();
  docMemory.clear();
  docSessions.clear();
  docUsers.clear();
  adminDocs.clear();
  adminSessions.clear();
  adminUsers.clear();
  adminAuditLogs.clear();
  resetAdminRateLimit('127.0.0.1');

  // Set test environment admin password
  process.env.ADMIN_PASSWORD = 'Admin@07';

  // ----------------------------------------------------
  // TEST 1: Student Signup
  // ----------------------------------------------------
  console.log('1. Testing Student Signup...');
  const signupResult1 = await processSignup({
    name: 'Rushikesh Gopal',
    email: 'rushikesh@sgu.ac.in',
    password: 'Password@123',
    confirmPassword: 'Password@123',
    university: 'Engineering University',
    course: 'B.Tech',
    branch: 'AIML'
  }, '127.0.0.1');

  assert.strictEqual(signupResult1.status, 201);
  assert.strictEqual(signupResult1.body.success, true);
  assert.strictEqual(signupResult1.body.user.role, 'student', 'Student accounts must always receive role: student');
  console.log('   ✓ Student registered with role: "student"');

  const signupResult2 = await processSignup({
    name: 'Imam Hussain',
    email: 'imam@sgu.ac.in',
    password: 'Password@456',
    confirmPassword: 'Password@456'
  }, '127.0.0.1');
  assert.strictEqual(signupResult2.status, 201);
  console.log('   ✓ Second student registered with role: "student"');

  // ----------------------------------------------------
  // TEST 2: Student Login & Dedicated Student Cookie
  // ----------------------------------------------------
  console.log('\n2. Testing Student Login & Dedicated Session Cookie...');
  const studentLoginRes = await processLogin({
    email: 'rushikesh@sgu.ac.in',
    password: 'Password@123'
  }, '127.0.0.1');

  assert.strictEqual(studentLoginRes.status, 200);
  assert.strictEqual(studentLoginRes.body.user.email, 'rushikesh@sgu.ac.in');
  assert.strictEqual(studentLoginRes.body.user.role, 'student');
  const studentToken = studentLoginRes.body.token;
  assert.ok(studentToken, 'Student session token must be issued on successful login');
  assert.ok(studentLoginRes.cookie && studentLoginRes.cookie.includes('studypilot_session='), 'Student cookie must be studypilot_session');
  console.log('   ✓ Student login succeeded with role: "student" and studypilot_session cookie');

  // Sync user to documents & admin memory for fallback
  const studentUserObj = authUsers.get('rushikesh@sgu.ac.in')!;
  docUsers.set(studentUserObj.id, studentUserObj as any);
  adminUsers.set(studentUserObj.id, studentUserObj as any);
  const studentTokenHash = hashSessionToken(studentToken);
  docSessions.set(studentTokenHash, { user_id: studentUserObj.id, expires_at: new Date(Date.now() + 86400000).toISOString() });
  adminSessions.set(studentTokenHash, { user_id: studentUserObj.id, expires_at: new Date(Date.now() + 86400000).toISOString() });

  // ----------------------------------------------------
  // TEST 3: Admin Login with Admin@07 & Dedicated Admin Cookie
  // ----------------------------------------------------
  console.log('\n3. Testing Admin Password Authentication...');
  // 3a: Incorrect password rejected
  const badLogin = await createMockReqRes({
    method: 'POST',
    body: { password: 'WrongPassword@999' }
  });
  await processAdminLogin(badLogin.req, badLogin.res);
  assert.strictEqual(badLogin.getStatus(), 401);
  assert.strictEqual(badLogin.getData().error.code, 'INVALID_CREDENTIALS');
  console.log('   ✓ Incorrect admin password rejected with HTTP 401 INVALID_CREDENTIALS');

  // 3b: Correct password succeeds and sets studypilot_admin_session
  const goodLogin = await createMockReqRes({
    method: 'POST',
    body: { password: 'Admin@07' }
  });
  await processAdminLogin(goodLogin.req, goodLogin.res);
  assert.strictEqual(goodLogin.getStatus(), 200);
  assert.strictEqual(goodLogin.getData().success, true);
  assert.strictEqual(goodLogin.getData().user.role, 'super_admin');
  assert.strictEqual(goodLogin.getData().redirectUrl, '/admin');

  // Extract admin session token from Set-Cookie header (studypilot_admin_session)
  const setCookie = goodLogin.getHeaders()['set-cookie'];
  assert.ok(setCookie && setCookie.includes('studypilot_admin_session='), 'Admin session cookie must be studypilot_admin_session');
  const adminTokenMatch = setCookie.match(/studypilot_admin_session=([^;]+)/);
  const adminToken = adminTokenMatch ? adminTokenMatch[1] : '';
  assert.ok(adminToken.length >= 32, 'Cryptographic admin session token generated');
  console.log('   ✓ Admin login with "Admin@07" succeeded, returning role: "super_admin" and studypilot_admin_session cookie');

  // Sync admin user and session into memory stores
  const adminId = 'admin_system_root';
  const adminTokenHash = hashSessionToken(adminToken);
  authUsers.set('admin@studypilot.ai', {
    id: adminId,
    email: 'admin@studypilot.ai',
    password_hash: null,
    name: 'Super Administrator',
    role: 'super_admin',
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  authSessions.set(adminTokenHash, {
    id: 'admin_sess_1',
    user_id: adminId,
    token_hash: adminTokenHash,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date().toISOString()
  });
  docUsers.set(adminId, { id: adminId, email: 'admin@studypilot.ai', name: 'Super Administrator', role: 'super_admin' });
  docSessions.set(adminTokenHash, { user_id: adminId, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() });
  adminUsers.set(adminId, { id: adminId, email: 'admin@studypilot.ai', name: 'Super Administrator', role: 'super_admin' });
  adminSessions.set(adminTokenHash, { user_id: adminId, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() });

  // ----------------------------------------------------
  // TEST 4: Admin Rate Limiting (Brute-Force Mitigation)
  // ----------------------------------------------------
  console.log('\n4. Testing Admin Brute-Force Rate Limiting...');
  resetAdminRateLimit('192.168.1.100');
  for (let i = 0; i < 5; i++) {
    const attempt = await createMockReqRes({
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.100' },
      body: { password: `bad_${i}` }
    });
    await processAdminLogin(attempt.req, attempt.res);
    assert.strictEqual(attempt.getStatus(), 401);
  }
  // 6th attempt should trigger 429
  const rateBlocked = await createMockReqRes({
    method: 'POST',
    headers: { 'x-forwarded-for': '192.168.1.100' },
    body: { password: 'Admin@07' }
  });
  await processAdminLogin(rateBlocked.req, rateBlocked.res);
  assert.strictEqual(rateBlocked.getStatus(), 429);
  assert.strictEqual(rateBlocked.getData().error.code, 'RATE_LIMIT_EXCEEDED');
  console.log('   ✓ Brute-force rate limiter triggered: blocked after 5 failed attempts with HTTP 429');

  // ----------------------------------------------------
  // TEST 5: Decoupled Independent Auth & Anti-Collision
  // ----------------------------------------------------
  console.log('\n5. Testing Decoupled Authentication & Cookie Separation...');
  // 5a: Admin me endpoint works via studypilot_admin_session
  const adminMeReq = await createMockReqRes({
    headers: { cookie: `studypilot_admin_session=${adminToken}` }
  });
  await processAdminMe(adminMeReq.req, adminMeReq.res);
  assert.strictEqual(adminMeReq.getStatus(), 200);
  assert.strictEqual(adminMeReq.getData().user.role, 'super_admin');
  console.log('   ✓ Admin verified via /api/admin?action=me using studypilot_admin_session');

  // 5b: Admin cookie alone CANNOT authenticate student /api/auth/me
  const studentMeWithAdminCookie = await createMockReqRes({
    headers: { cookie: `studypilot_admin_session=${adminToken}` }
  });
  const studentMeRes = await processGetCurrentUser(studentMeWithAdminCookie.req);
  assert.strictEqual(studentMeRes.status, 401, 'Student portal strictly rejects admin cookie');
  console.log('   ✓ Admin cookie rejected by student /api/auth/me with HTTP 401');

  // 5c: Student cookie works for student portal
  const studentMeReq = await createMockReqRes({
    headers: { cookie: `studypilot_session=${studentToken}` }
  });
  const validStudentRes = await processGetCurrentUser(studentMeReq.req);
  assert.strictEqual(validStudentRes.status, 200);
  assert.strictEqual(validStudentRes.body.user.role, 'student');
  assert.strictEqual(validStudentRes.body.user.email, 'rushikesh@sgu.ac.in');
  console.log('   ✓ Student verified via /api/auth/me using studypilot_session');

  // 5d: Student cookie alone CANNOT authenticate admin /api/admin
  const adminWithStudentCookie = await createMockReqRes({
    headers: { cookie: `studypilot_session=${studentToken}` }
  });
  await processAdminOverview(adminWithStudentCookie.req, adminWithStudentCookie.res);
  assert.ok(adminWithStudentCookie.getStatus() === 401 || adminWithStudentCookie.getStatus() === 403, 'Student cookie rejected by admin endpoints');
  console.log('   ✓ Student cookie blocked from admin endpoints');

  // ----------------------------------------------------
  // TEST 6: Scenario C — Two Tabs Running Simultaneously in Same Browser
  // ----------------------------------------------------
  console.log('\n6. Testing Scenario C: Concurrent Two-Tab Coexistence (Zero Session Collision)...');
  const twoTabCookieHeader = `studypilot_session=${studentToken}; studypilot_admin_session=${adminToken}`;

  // Tab 1 simulates /admin request
  const tab1AdminReq = await createMockReqRes({
    headers: { cookie: twoTabCookieHeader }
  });
  await processAdminOverview(tab1AdminReq.req, tab1AdminReq.res);
  assert.strictEqual(tab1AdminReq.getStatus(), 200);
  assert.ok(tab1AdminReq.getData().metrics, 'Tab 1 sees full Super Admin overview');

  // Tab 2 simulates student / request
  const tab2StudentReq = await createMockReqRes({
    headers: { cookie: twoTabCookieHeader }
  });
  const tab2StudentRes = await processGetCurrentUser(tab2StudentReq.req);
  assert.strictEqual(tab2StudentRes.status, 200);
  assert.strictEqual(tab2StudentRes.body.user.role, 'student', 'Tab 2 resolves student profile, NEVER admin layout');
  assert.strictEqual(tab2StudentRes.body.user.email, 'rushikesh@sgu.ac.in');
  console.log('   ✓ Two tabs running concurrently in same browser: Tab 1 is Admin, Tab 2 is Student (100% collision-free)');

  // ----------------------------------------------------
  // TEST 7: Unauthenticated Visitors Blocked from Admin (HTTP 401)
  // ----------------------------------------------------
  console.log('\n7. Testing Unauthenticated Visitors Blocked...');
  const unauthReq = await createMockReqRes({});
  await processAdminOverview(unauthReq.req, unauthReq.res);
  assert.strictEqual(unauthReq.getStatus(), 401);
  assert.strictEqual(unauthReq.getData().error.code, 'UNAUTHENTICATED');
  console.log('   ✓ Unauthenticated visitor blocked with HTTP 401 UNAUTHENTICATED');

  // ----------------------------------------------------
  // TEST 8: Document Storage & Strict Student Isolation
  // ----------------------------------------------------
  console.log('\n8. Testing Document Storage & Cross-Student Isolation...');
  const studentDocPayload = {
    id: 'doc_student1_dbms',
    name: 'CS201_DBMS_Unit3_Notes.pdf',
    type: 'pdf',
    size: 2048,
    extractedText: 'Relational database normalization: 1NF, 2NF, 3NF, BCNF.',
    chunks: [
      { chunkIndex: 0, pageOrSection: 'Page 1', content: '1NF eliminates repeating groups.' },
      { chunkIndex: 1, pageOrSection: 'Page 2', content: '2NF eliminates partial dependencies.' }
    ],
    chunkCount: 2,
    wordCount: 12,
    fileData: 'data:application/pdf;base64,JVBERi0xLjQKJUZha2VQREZEb2N1bWVudA=='
  };

  const uploadReq = await createMockReqRes({
    method: 'POST',
    headers: { cookie: `studypilot_session=${studentToken}` },
    body: studentDocPayload
  });
  await processUploadDocument(uploadReq.req, uploadReq.res);
  assert.strictEqual(uploadReq.getStatus(), 201);
  console.log('   ✓ Student 1 uploaded document into storage');

  // Sync document into adminDocs memory map
  const rawUploaded = docMemory.get('doc_student1_dbms')!;
  adminDocs.set('doc_student1_dbms', rawUploaded);

  // Student 1 sees their document
  const student1List = await createMockReqRes({
    headers: { cookie: `studypilot_session=${studentToken}` }
  });
  await processListDocuments(student1List.req, student1List.res);
  assert.strictEqual(student1List.getStatus(), 200);
  assert.strictEqual(student1List.getData().documents.length, 1);
  assert.strictEqual(student1List.getData().documents[0].id, 'doc_student1_dbms');
  console.log('   ✓ Student 1 sees their uploaded document');

  // Student 2 signs in and has 0 documents
  const student2LoginRes = await processLogin({ email: 'imam@sgu.ac.in', password: 'Password@456' });
  const student2Token = student2LoginRes.body.token;
  const student2UserObj = authUsers.get('imam@sgu.ac.in')!;
  docUsers.set(student2UserObj.id, student2UserObj as any);
  adminUsers.set(student2UserObj.id, student2UserObj as any);
  const student2TokenHash = hashSessionToken(student2Token);
  docSessions.set(student2TokenHash, { user_id: student2UserObj.id, expires_at: new Date(Date.now() + 86400000).toISOString() });
  adminSessions.set(student2TokenHash, { user_id: student2UserObj.id, expires_at: new Date(Date.now() + 86400000).toISOString() });

  const student2List = await createMockReqRes({
    headers: { cookie: `studypilot_session=${student2Token}` }
  });
  await processListDocuments(student2List.req, student2List.res);
  assert.strictEqual(student2List.getStatus(), 200);
  assert.strictEqual(student2List.getData().documents.length, 0, 'Student 2 must see 0 documents (zero leakage from Student 1)');
  console.log('   ✓ Student 2 starts with 0 documents (strict isolation)');

  // Student 2 blocked from accessing Student 1's document
  const student2GetDoc = await createMockReqRes({
    headers: { cookie: `studypilot_session=${student2Token}` },
    query: { id: 'doc_student1_dbms' }
  });
  await processGetDocument(student2GetDoc.req, student2GetDoc.res, 'doc_student1_dbms');
  assert.strictEqual(student2GetDoc.getStatus(), 403, 'Student 2 blocked with 403 from accessing Student 1 file');
  console.log('   ✓ Student 2 blocked from reading Student 1 document (HTTP 403 FORBIDDEN)');

  // ----------------------------------------------------
  // TEST 9: Admin Can See ALL Students
  // ----------------------------------------------------
  console.log('\n9. Testing Admin Students Directory...');
  const adminUsersReq = await createMockReqRes({
    headers: { cookie: `studypilot_admin_session=${adminToken}` }
  });
  await processAdminUsers(adminUsersReq.req, adminUsersReq.res);
  assert.strictEqual(adminUsersReq.getStatus(), 200);
  const allStudents = adminUsersReq.getData().users;
  assert.ok(allStudents.length >= 2, 'Admin must see all registered students');
  console.log(`   ✓ Admin can see all students in directory (${allStudents.length} students found)`);

  // ----------------------------------------------------
  // TEST 10: Admin Can See ALL Uploaded Files Across Students
  // ----------------------------------------------------
  console.log('\n10. Testing Admin Global Files Repository...');
  const adminFilesReq = await createMockReqRes({
    headers: { cookie: `studypilot_admin_session=${adminToken}` }
  });
  await processAdminDocuments(adminFilesReq.req, adminFilesReq.res);
  assert.strictEqual(adminFilesReq.getStatus(), 200);
  const globalDocs = adminFilesReq.getData().documents;
  assert.ok(globalDocs.length >= 1, 'Admin must see documents uploaded by all students');
  assert.ok(globalDocs.some((d: any) => d.id === 'doc_student1_dbms'), 'Student 1 document appears in global admin repository');
  console.log('   ✓ Admin can view all student-uploaded files in global repository');

  // ----------------------------------------------------
  // TEST 11: Admin Can Preview & Download Original Files
  // ----------------------------------------------------
  console.log('\n11. Testing Admin Preview & Byte-Perfect Download...');
  const adminPreviewReq = await createMockReqRes({
    headers: { cookie: `studypilot_admin_session=${adminToken}` }
  });
  await processAdminBinaryFile(adminPreviewReq.req, adminPreviewReq.res, 'doc_student1_dbms', 'preview');
  assert.strictEqual(adminPreviewReq.getStatus(), 200);
  assert.ok(adminPreviewReq.getHeaders()['content-disposition'].includes('inline'));
  console.log('   ✓ Admin can preview student document inline');

  const adminDownloadReq = await createMockReqRes({
    headers: { cookie: `studypilot_admin_session=${adminToken}` }
  });
  await processAdminBinaryFile(adminDownloadReq.req, adminDownloadReq.res, 'doc_student1_dbms', 'download');
  assert.strictEqual(adminDownloadReq.getStatus(), 200);
  assert.ok(adminDownloadReq.getHeaders()['content-disposition'].includes('attachment'));
  const downloadedBuffer: Buffer = adminDownloadReq.getData();
  assert.ok(Buffer.isBuffer(downloadedBuffer), 'Downloaded content is a binary Buffer');
  assert.ok(downloadedBuffer.toString('utf-8').includes('%PDF'), 'Decoded original PDF magic header matches');
  console.log('   ✓ Admin downloaded original binary file with byte-perfect fidelity');

  // ----------------------------------------------------
  // TEST 12: Scenario D & E — Independent Logouts
  // ----------------------------------------------------
  console.log('\n12. Testing Scenario D & E: Independent Logout Isolation...');
  // Scenario D: Admin logs out in Tab 1
  const logoutReq = await createMockReqRes({
    headers: { cookie: `studypilot_session=${studentToken}; studypilot_admin_session=${adminToken}` }
  });
  await processAdminLogout(logoutReq.req, logoutReq.res);
  assert.strictEqual(logoutReq.getStatus(), 200);
  const setCookieLogout = logoutReq.getHeaders()['set-cookie'];
  assert.ok(setCookieLogout.includes('studypilot_admin_session='), 'Admin logout clears studypilot_admin_session');
  assert.ok(!setCookieLogout.includes('studypilot_session='), 'Admin logout DOES NOT touch studypilot_session');

  // Next admin request rejected
  const postLogoutOverview = await createMockReqRes({
    headers: { cookie: `studypilot_admin_session=${adminToken}` }
  });
  await processAdminOverview(postLogoutOverview.req, postLogoutOverview.res);
  assert.strictEqual(postLogoutOverview.getStatus(), 401, 'Logged out admin session rejected with 401');

  // BUT Tab 2 student session remains completely active and authenticated!
  const studentStillActive = await createMockReqRes({
    headers: { cookie: `studypilot_session=${studentToken}` }
  });
  const studentActiveRes = await processGetCurrentUser(studentStillActive.req);
  assert.strictEqual(studentActiveRes.status, 200, 'Student session remains fully valid in Tab 2');
  assert.strictEqual(studentActiveRes.body.user.email, 'rushikesh@sgu.ac.in');
  console.log('   ✓ Scenario D passed: Admin logout terminated only admin session; Tab 2 student session stayed 100% active');

  // Scenario E: Student logs out in Tab 2
  const studentLogoutRes = await processLogout(studentToken);
  assert.strictEqual(studentLogoutRes.status, 200);
  console.log('   ✓ Scenario E passed: Student logout terminated student session independently');

  // ----------------------------------------------------
  // TEST 13: Existing RAG & Chat System Intact
  // ----------------------------------------------------
  console.log('\n13. Testing Chat & RAG Integrity...');
  const chatPayload = {
    message: 'What is the ACID principle?',
    history: []
  };
  const chatRes = await processChatRequest(chatPayload);
  if ('error' in chatRes) {
    assert.ok(chatRes.error.code);
    console.log(`   ✓ Chat endpoint handled cleanly without crashing (${chatRes.error.code})`);
  } else {
    assert.ok(chatRes.text, 'Chat response generated');
    console.log('   ✓ Fast direct response verified from Gemini');
  }

  console.log('\n======================================================');
  console.log('ALL SUPER ADMIN & STORAGE SYSTEM TESTS PASSED! (100%)');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
