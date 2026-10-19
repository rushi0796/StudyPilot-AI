import signupHandler, { processSignup } from './_lib/handlers/signup.ts';
import loginHandler, { processLogin } from './_lib/handlers/login.ts';
import meHandler, { processGetCurrentUser } from './_lib/handlers/me.ts';
import logoutHandler, { processLogout } from './_lib/handlers/logout.ts';
import googleStartHandler from './_lib/handlers/googleStart.ts';
import googleCallbackHandler from './_lib/handlers/googleCallback.ts';
import { processGoogleStart, processGoogleCallback } from './_lib/googleAuth.ts';

export { 
  processSignup, 
  processLogin, 
  processGetCurrentUser, 
  processLogout, 
  processGoogleStart, 
  processGoogleCallback 
};

/**
 * StudyPilot AI - Unified Authentication Router & Dispatcher
 * Consolidates all 6 authentication sub-routes into a single Serverless Function
 * to comply with Vercel's Hobby plan limit (<= 12 Serverless Functions).
 */
export default async function authHandler(req: any, res: any) {
  // Ensure CORS headers on all authentication routes
  res.setHeader('Access-Control-Allow-Origin', req.headers?.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse query parameters if not pre-populated by hosting runtime
  const url = req.url || '';
  if (!req.query && url.includes('?')) {
    try {
      const urlObj = new URL(url, 'http://localhost');
      req.query = Object.fromEntries(urlObj.searchParams.entries());
    } catch {
      req.query = {};
    }
  }

  // Ensure JSON body is parsed if delivered as a string
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // Keep original body
    }
  }

  const subroute = String(req.query?.subroute || req.query?.action || req.query?.path || '').toLowerCase();
  const matchedPath = String(req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || '').toLowerCase();
  const rawUrl = url.toLowerCase();
  const target = `${rawUrl} ${subroute} ${matchedPath}`;

  // 1. Google OAuth Endpoints
  if (target.includes('google/start') || target.includes('google-start') || subroute === 'google/start') {
    return await googleStartHandler(req, res);
  }
  if (target.includes('google/callback') || target.includes('google-callback') || subroute === 'google/callback') {
    return await googleCallbackHandler(req, res);
  }

  // 2. Email & Password Authentication Endpoints
  if (target.includes('/signup') || subroute === 'signup' || target.endsWith('signup')) {
    return await signupHandler(req, res);
  }
  if (target.includes('/login') || subroute === 'login' || target.endsWith('login')) {
    return await loginHandler(req, res);
  }
  if (target.includes('/me') || subroute === 'me' || target.endsWith('me')) {
    return await meHandler(req, res);
  }
  if (target.includes('/logout') || subroute === 'logout' || target.endsWith('logout')) {
    return await logoutHandler(req, res);
  }

  return res.status(404).json({
    error: {
      message: 'Unknown authentication route. Supported routes: /signup, /login, /me, /logout, /google/start, /google/callback',
      code: 'AUTH_ROUTE_NOT_FOUND'
    }
  });
}
