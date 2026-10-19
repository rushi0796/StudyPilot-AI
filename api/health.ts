import { checkDatabaseHealth } from './db.ts';

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
      model: 'gemini-2.5-flash',
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
