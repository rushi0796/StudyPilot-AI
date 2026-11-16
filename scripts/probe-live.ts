const PROD_URL = 'https://study-pilot-ai-pearl.vercel.app';

async function probe() {
  console.log(`\n======================================================`);
  console.log(`PROBING LIVE PRODUCTION: ${PROD_URL}`);
  console.log(`======================================================\n`);

  // 1. Check Homepage
  console.log('1. Fetching Student Homepage (/)...');
  const homeRes = await fetch(`${PROD_URL}/`);
  console.log(`   Status: ${homeRes.status} ${homeRes.statusText}`);
  const homeHtml = await homeRes.text();
  const titleMatch = homeHtml.match(/<title>(.*?)<\/title>/);
  console.log(`   Title: ${titleMatch ? titleMatch[1] : 'No title'}`);

  // Check branding in HTML
  const hasGhodawat = homeHtml.toLowerCase().includes('ghodawat');
  const hasCodex = homeHtml.toLowerCase().includes('codex');
  console.log(`   Branding Check: Ghodawat present? ${hasGhodawat} | Codex present? ${hasCodex}`);

  // 2. Check Admin Login API
  console.log('\n2. Testing Admin Password Authentication (/api/admin?action=login)...');
  const badLoginRes = await fetch(`${PROD_URL}/api/admin?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'WrongPassword@999' })
  });
  console.log(`   Incorrect password status: ${badLoginRes.status} (Expected 401)`);
  const badLoginJson = await badLoginRes.json().catch(() => ({}));
  console.log(`   Error Code: ${badLoginJson?.error?.code}`);

  // Correct password
  const goodLoginRes = await fetch(`${PROD_URL}/api/admin?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'Admin@07' })
  });
  console.log(`   Correct password status: ${goodLoginRes.status} (Expected 200)`);
  const setCookie = goodLoginRes.headers.get('set-cookie') || '';
  const hasAdminCookie = setCookie.includes('studypilot_admin_session=');
  console.log(`   Cookie Set: studypilot_admin_session present? ${hasAdminCookie}`);
  const match = setCookie.match(/studypilot_admin_session=([^;]+)/);
  const adminToken = match ? match[1] : '';

  if (adminToken) {
    // 3. Test Admin Protected API with studypilot_admin_session
    console.log('\n3. Testing Admin Me Endpoint (/api/admin?action=me)...');
    const adminMeRes = await fetch(`${PROD_URL}/api/admin?action=me`, {
      headers: { cookie: `studypilot_admin_session=${adminToken}` }
    });
    console.log(`   Admin session check status: ${adminMeRes.status} (Expected 200)`);
    const adminMeJson = await adminMeRes.json().catch(() => ({}));
    console.log(`   Authenticated User: ${adminMeJson?.user?.email} (Role: ${adminMeJson?.user?.role})`);

    // 4. Test Student Endpoint with studypilot_admin_session (MUST BE REJECTED!)
    console.log('\n4. Testing Student /api/auth/me with Admin Cookie (Isolation Verification)...');
    const studentMeRes = await fetch(`${PROD_URL}/api/auth/me`, {
      headers: { cookie: `studypilot_admin_session=${adminToken}` }
    });
    console.log(`   Student /api/auth/me with admin cookie status: ${studentMeRes.status} (Expected 401 UNAUTHENTICATED)`);

    // 5. Test Admin Overview Data
    console.log('\n5. Testing Live Database Telemetry (/api/admin?action=overview)...');
    const overviewRes = await fetch(`${PROD_URL}/api/admin?action=overview`, {
      headers: { cookie: `studypilot_admin_session=${adminToken}` }
    });
    console.log(`   Overview status: ${overviewRes.status}`);
    const overviewJson = await overviewRes.json().catch(() => ({}));
    if (overviewJson?.metrics) {
      console.log(`   Total Students in DB: ${overviewJson.metrics.totalStudents}`);
      console.log(`   Total Uploaded Docs: ${overviewJson.metrics.totalUploadedDocuments}`);
      console.log(`   Total Processed Docs: ${overviewJson.metrics.totalDocumentsProcessed}`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`LIVE PROBE COMPLETED SUCCESSFULLY!`);
  console.log(`======================================================\n`);
}

probe().catch(err => {
  console.error('Probe failed:', err);
});
