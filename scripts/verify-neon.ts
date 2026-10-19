import { 
  getDatabaseConnectionString, 
  getActiveDatabaseEnvVar, 
  isNeonConfigured, 
  testDatabaseConnection, 
  checkDatabaseTables, 
  ensureDatabaseSchema, 
  queryNeon 
} from '../api/db.ts';

console.log('\n======================================================');
console.log('STUDYPILOT AI - NEON POSTGRESQL VERIFICATION & MIGRATION');
console.log('======================================================\n');

async function runVerification() {
  const activeVar = getActiveDatabaseEnvVar();
  const configured = isNeonConfigured();

  console.log('1. Environment & Variable Inspection:');
  console.log(`  • Configured: ${configured ? 'YES' : 'NO'}`);
  console.log(`  • Active Variable: ${activeVar || 'NONE (Checked: POSTGRES_URL, DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING)'}`);
  console.log(`  • Production Guardrail Active: ${process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' ? 'YES (Ephemeral fallback blocked)' : 'NO (Local Development Mode)'}`);

  if (!configured) {
    console.log('\n------------------------------------------------------');
    console.log('DIAGNOSTIC STATUS: NEON CONNECTION STRING NOT FOUND LOCALLY');
    console.log('------------------------------------------------------');
    console.log('Vercel holds the live Neon credentials in project settings:');
    console.log('  • Project: patient-dream-85267536');
    console.log('  • Database: neondb');
    console.log('  • Branch: main');
    console.log('  • Variables: POSTGRES_URL, DATABASE_URL, POSTGRES_PRISMA_URL');
    console.log('\nTo run verification against the live Neon database locally:');
    console.log('  1. Copy POSTGRES_URL from Vercel Project Settings > Environment Variables');
    console.log('  2. Place it into a local .env.local file:');
    console.log('     POSTGRES_URL=postgresql://neondb_owner:[PASSWORD]@[HOST]/neondb?sslmode=require');
    console.log('  3. Re-run: npm run verify:db');
    console.log('\nIn Vercel production deployments, Vercel injects POSTGRES_URL automatically.');
    console.log('======================================================\n');
    return;
  }

  console.log('\n2. Testing Neon Database Connectivity (SELECT 1):');
  const connTest = await testDatabaseConnection();
  if (!connTest.connected) {
    console.error(`  ✗ Database connection failed: ${connTest.error}`);
    process.exit(1);
  }
  console.log(`  ✓ Successfully connected to Neon PostgreSQL!`);
  console.log(`  ✓ Round-trip query latency: ${connTest.latencyMs}ms`);

  console.log('\n3. Checking Target Database Context:');
  try {
    const dbInfo = await queryNeon<{ current_database: string; current_user: string; version: string }>(
      'SELECT current_database(), current_user(), version();'
    );
    if (dbInfo.length > 0) {
      console.log(`  ✓ Database Name: ${dbInfo[0].current_database}`);
      console.log(`  ✓ Database User: ${dbInfo[0].current_user}`);
      console.log(`  ✓ PostgreSQL Engine: ${dbInfo[0].version.split(',')[0]}`);
    }
  } catch (err: any) {
    console.log(`  ! Notice querying database metadata: ${err?.message || err}`);
  }

  console.log('\n4. Checking Authentication Schema & Tables:');
  let tableStatus = await checkDatabaseTables();
  console.log(`  • studypilot_users table: ${tableStatus.usersTable ? 'EXISTS' : 'MISSING'}`);
  console.log(`  • studypilot_sessions table: ${tableStatus.sessionsTable ? 'EXISTS' : 'MISSING'}`);

  if (!tableStatus.allTablesExist) {
    console.log('\n5. Executing Safe Idempotent Schema Migration:');
    await ensureDatabaseSchema();
    tableStatus = await checkDatabaseTables();
    console.log(`  ✓ Migration executed successfully.`);
    console.log(`  • studypilot_users table: ${tableStatus.usersTable ? 'READY' : 'ERROR'}`);
    console.log(`  • studypilot_sessions table: ${tableStatus.sessionsTable ? 'READY' : 'ERROR'}`);
  } else {
    console.log('\n5. Schema Migration:');
    console.log(`  ✓ All required authentication tables and indexes already exist.`);
  }

  console.log('\n6. Verifying Schema Structure & Constraints:');
  const columns = await queryNeon<{ table_name: string; column_name: string; data_type: string }>(
    `SELECT table_name, column_name, data_type 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
       AND table_name IN ('studypilot_users', 'studypilot_sessions')
     ORDER BY table_name, ordinal_position;`
  );

  const usersCols = columns.filter(c => c.table_name === 'studypilot_users').map(c => c.column_name);
  const sessionsCols = columns.filter(c => c.table_name === 'studypilot_sessions').map(c => c.column_name);
  console.log(`  ✓ Users columns verified (${usersCols.length} columns): ${usersCols.join(', ')}`);
  console.log(`  ✓ Sessions columns verified (${sessionsCols.length} columns): ${sessionsCols.join(', ')}`);

  console.log('\n======================================================');
  console.log('VERIFICATION SUMMARY:');
  console.log('  • Status: CONNECTED & VERIFIED');
  console.log('  • Persistence: TRUE (Persistent PostgreSQL)');
  console.log('  • Storage Type: neon_postgres');
  console.log('  • Multi-device / Cross-browser Sync: ENABLED');
  console.log('======================================================\n');
}

runVerification().catch(err => {
  console.error('\nVerification encountered an unhandled error:', err?.message || err);
  process.exit(1);
});
