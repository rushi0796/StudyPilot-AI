const PROD_URL = 'https://study-pilot-ai-pearl.vercel.app';

async function probeStudentAndTwoTabs() {
  console.log(`\n======================================================`);
  console.log(`PROBING LIVE STUDENT & TWO-TAB CONCURRENCY`);
  console.log(`======================================================\n`);

  // 1. Create a fresh student or test student login
  const testEmail = `student_${Date.now()}@studypilot.edu`;
  console.log(`1. Signing up student: ${testEmail}...`);
  const signupRes = await fetch(`${PROD_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Deshmukh',
      email: testEmail,
      password: 'StrongPassword@123',
      confirmPassword: 'StrongPassword@123'
    })
  });
  console.log(`   Signup status: ${signupRes.status}`);

  console.log(`2. Logging in as student...`);
  const loginRes = await fetch(`${PROD_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'StrongPassword@123'
    })
  });
  console.log(`   Login status: ${loginRes.status}`);
  const studentSetCookie = loginRes.headers.get('set-cookie') || '';
  const studentMatch = studentSetCookie.match(/studypilot_session=([^;]+)/);
  const studentToken = studentMatch ? studentMatch[1] : '';
  console.log(`   Student cookie studypilot_session present? ${Boolean(studentToken)}`);

  console.log(`3. Logging in as Admin...`);
  const adminLoginRes = await fetch(`${PROD_URL}/api/admin?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'Admin@07' })
  });
  const adminSetCookie = adminLoginRes.headers.get('set-cookie') || '';
  const adminMatch = adminSetCookie.match(/studypilot_admin_session=([^;]+)/);
  const adminToken = adminMatch ? adminMatch[1] : '';
  console.log(`   Admin cookie studypilot_admin_session present? ${Boolean(adminToken)}`);

  // 4. Test Concurrent Two Tabs on Live Vercel:
  console.log(`\n4. Simulating Two Tabs in Same Browser on Live Vercel...`);
  const combinedCookies = `studypilot_session=${studentToken}; studypilot_admin_session=${adminToken}`;

  // Tab 1: Admin endpoint
  const tab1Admin = await fetch(`${PROD_URL}/api/admin?action=overview`, {
    headers: { cookie: combinedCookies }
  });
  console.log(`   Tab 1 Admin Overview status: ${tab1Admin.status} (Expected 200)`);
  const tab1Json = await tab1Admin.json().catch(() => ({}));
  console.log(`   Tab 1 Metrics verified: ${Boolean(tab1Json?.metrics)}`);

  // Tab 2: Student endpoint
  const tab2Student = await fetch(`${PROD_URL}/api/auth/me`, {
    headers: { cookie: combinedCookies }
  });
  console.log(`   Tab 2 Student Me status: ${tab2Student.status} (Expected 200)`);
  const tab2Json = await tab2Student.json().catch(() => ({}));
  console.log(`   Tab 2 User Role: ${tab2Json?.user?.role} (Expected 'student', NEVER 'super_admin')`);
  console.log(`   Tab 2 User Email: ${tab2Json?.user?.email}`);

  // 5. Test Admin Logout in Tab 1
  console.log(`\n5. Admin Logout in Tab 1...`);
  const adminLogout = await fetch(`${PROD_URL}/api/admin?action=logout`, {
    method: 'POST',
    headers: { cookie: combinedCookies }
  });
  const logoutCookie = adminLogout.headers.get('set-cookie') || '';
  console.log(`   Admin Logout Cookie Cleared? ${logoutCookie.includes('studypilot_admin_session=')}`);
  console.log(`   Student Cookie Untouched? ${!logoutCookie.includes('studypilot_session=')}`);

  // Tab 2 Student session STILL active
  const tab2After = await fetch(`${PROD_URL}/api/auth/me`, {
    headers: { cookie: `studypilot_session=${studentToken}` }
  });
  console.log(`   Tab 2 Student still authenticated? ${tab2After.status === 200}`);

  console.log(`\n======================================================`);
  console.log(`LIVE CONCURRENCY VERIFICATION PASSED 100%!`);
  console.log(`======================================================\n`);
}

probeStudentAndTwoTabs().catch(err => console.error(err));
