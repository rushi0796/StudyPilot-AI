import { processGoogleStart } from '../../googleAuth.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const result = processGoogleStart(req);
  if (result.cookie) {
    res.setHeader('Set-Cookie', result.cookie);
  }

  res.setHeader('Location', result.redirect);
  return res.status(result.status).end();
}
