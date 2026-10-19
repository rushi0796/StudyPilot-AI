import { processGoogleCallback } from '../../googleAuth.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse query parameters
  const urlObj = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
  const query = Object.fromEntries(urlObj.searchParams.entries());

  const result = await processGoogleCallback(req, query);

  if (result.cookies && result.cookies.length > 0) {
    res.setHeader('Set-Cookie', result.cookies);
  }

  res.setHeader('Location', result.redirect);
  return res.status(result.status).end();
}
