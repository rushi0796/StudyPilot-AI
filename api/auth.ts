import signupHandler from './auth/signup.ts';
import loginHandler from './auth/login.ts';
import meHandler from './auth/me.ts';
import logoutHandler from './auth/logout.ts';
import googleStartHandler from './auth/google/start.ts';
import googleCallbackHandler from './auth/google/callback.ts';

export { processSignup } from './auth/signup.ts';
export { processLogin } from './auth/login.ts';
export { processGetCurrentUser } from './auth/me.ts';
export { processLogout } from './auth/logout.ts';
export { processGoogleStart, processGoogleCallback } from './googleAuth.ts';

export default async function authHandler(req: any, res: any) {
  const url = req.url || '';
  
  if (url.includes('/api/auth/google/start') || url.endsWith('/google/start')) {
    return await googleStartHandler(req, res);
  }
  if (url.includes('/api/auth/google/callback') || url.endsWith('/google/callback') || url.includes('/google/callback?')) {
    return await googleCallbackHandler(req, res);
  }
  if (url.includes('/api/auth/signup') || url.endsWith('/signup')) {
    return await signupHandler(req, res);
  }
  if (url.includes('/api/auth/login') || url.endsWith('/login')) {
    return await loginHandler(req, res);
  }
  if (url.includes('/api/auth/me') || url.endsWith('/me')) {
    return await meHandler(req, res);
  }
  if (url.includes('/api/auth/logout') || url.endsWith('/logout')) {
    return await logoutHandler(req, res);
  }

  return res.status(404).json({
    error: {
      message: 'Unknown authentication route.',
      code: 'AUTH_ROUTE_NOT_FOUND'
    }
  });
}
