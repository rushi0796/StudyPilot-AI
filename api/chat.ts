import { processChatRequest } from './chatHandler';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      status: 'active',
      service: 'StudyPilot AI Chat Service',
      version: '1.0.0',
      hasApiKey: Boolean((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim())
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      error: {
        message: 'Method Not Allowed. Please use POST.',
        code: 'METHOD_NOT_ALLOWED',
        status: 405
      }
    });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const result = await processChatRequest(body);

    if ('error' in result) {
      res.status(result.error.status || 500).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({
      error: {
        message: err?.message || 'Internal Server Error in chat handler',
        code: 'INTERNAL_SERVER_ERROR',
        status: 500
      }
    });
  }
}
