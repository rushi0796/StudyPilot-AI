import { neon } from '@neondatabase/serverless';

export function getActiveDatabaseEnvVar(): string | null {
  if (process.env.POSTGRES_URL) return 'POSTGRES_URL';
  if (process.env.DATABASE_URL) return 'DATABASE_URL';
  if (process.env.POSTGRES_PRISMA_URL) return 'POSTGRES_PRISMA_URL';
  if (process.env.POSTGRES_URL_NON_POOLING) return 'POSTGRES_URL_NON_POOLING';
  return null;
}

export function getDatabaseConnectionString(): string | null {
  const url =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    '';
  return url.trim() ? url.trim() : null;
}

export async function checkDatabaseHealth() {
  const activeEnvVar = getActiveDatabaseEnvVar();
  const connString = getDatabaseConnectionString();
  const configured = Boolean(connString);
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  if (!configured) {
    return {
      configured: false,
      activeEnvVar: null,
      connected: false,
      storageType: isProduction ? 'neon_postgres' : 'ephemeral_memory',
      isPersistent: false,
      status: isProduction ? 'database_unconfigured' : 'unconfigured_fallback',
      tablesExist: false,
      latencyMs: undefined,
      notice: isProduction
        ? 'CRITICAL: Neon PostgreSQL is NOT configured in production. Ephemeral memory fallback is disabled; database operations will fail until POSTGRES_URL or DATABASE_URL is configured in Vercel.'
        : 'Running in ephemeral in-memory fallback for local development.'
    };
  }

  try {
    const sql = neon(connString!);
    const startTime = Date.now();
    await sql`SELECT 1;`;
    const latencyMs = Date.now() - startTime;

    const rows: any[] = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('studypilot_users', 'studypilot_sessions');
    `;
    const tableNames = new Set(rows.map((r: any) => r.table_name));
    const tablesExist = tableNames.has('studypilot_users') && tableNames.has('studypilot_sessions');

    return {
      configured: true,
      activeEnvVar,
      connected: true,
      storageType: 'neon_postgres',
      isPersistent: true,
      status: tablesExist ? 'healthy' : 'pending_migration',
      tablesExist,
      latencyMs,
      notice: tablesExist 
        ? 'Neon PostgreSQL database is online and authentication tables are verified.'
        : 'Neon PostgreSQL is connected. Authentication tables will be created automatically on next request.'
    };
  } catch (err: any) {
    return {
      configured: true,
      activeEnvVar,
      connected: false,
      storageType: 'neon_postgres',
      isPersistent: true,
      status: 'connection_error',
      tablesExist: false,
      latencyMs: undefined,
      notice: `Neon PostgreSQL connection probe failed: ${err?.message || 'Network error'}`
    };
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const dbHealth = await checkDatabaseHealth();
    const isDegraded = dbHealth.configured && !dbHealth.connected;

    return res.status(isDegraded ? 503 : 200).json({
      status: isDegraded ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      service: 'StudyPilot AI Agent API',
      environment: process.env.NODE_ENV || 'development',
      hasApiKey: Boolean((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()),
      model: 'gemini-3.8-flash',
      database: {
        configured: dbHealth.configured,
        activeEnvVar: dbHealth.activeEnvVar,
        connected: dbHealth.connected,
        storageType: dbHealth.storageType,
        isPersistent: dbHealth.isPersistent,
        status: dbHealth.status,
        tablesExist: dbHealth.tablesExist,
        latencyMs: dbHealth.latencyMs,
        notice: dbHealth.notice
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'StudyPilot AI Agent API',
      error: {
        message: 'Health probe encountered an internal error.',
        code: 'HEALTH_CHECK_FAILED'
      }
    });
  }
}
