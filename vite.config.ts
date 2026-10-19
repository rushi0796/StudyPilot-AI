import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { processChatRequest } from './api/chat';
import evaluateHandler from './api/evaluate';
import quizHandler from './api/quiz';
import authHandler from './api/auth';
import healthHandler from './api/health';
import progressHandler from './api/progress';

function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // Helper to parse JSON body
        const readBody = (): Promise<any> => new Promise((resolve) => {
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', () => {
            try {
              resolve(bodyStr ? JSON.parse(bodyStr) : {});
            } catch {
              resolve({});
            }
          });
        });

        // Mock response helper for Vercel-like handlers
        const createVercelRes = (res: any) => ({
          setHeader: (name: string, val: string | string[]) => res.setHeader(name, val),
          redirect: (statusOrUrl: number | string, optUrl?: string) => {
            const status = typeof statusOrUrl === 'number' ? statusOrUrl : 302;
            const targetUrl = typeof statusOrUrl === 'string' ? statusOrUrl : (optUrl || '/');
            res.writeHead(status, { Location: targetUrl });
            res.end();
          },
          status: (code: number) => ({
            json: (data: any) => {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = code;
              res.end(JSON.stringify(data));
            },
            end: () => {
              res.statusCode = code;
              res.end();
            }
          })
        });

        if (url.startsWith('/api/chat')) {
          res.setHeader('Content-Type', 'application/json');
          if (req.method === 'GET') {
            res.end(JSON.stringify({
              status: 'active',
              service: 'StudyPilot AI Dev API',
              hasApiKey: Boolean((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim())
            }));
            return;
          }
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: { message: 'Method Not Allowed' } }));
            return;
          }
          const body = await readBody();
          const result = await processChatRequest(body);
          if ('error' in result) {
            res.statusCode = result.error.status || 500;
          } else {
            res.statusCode = 200;
          }
          res.end(JSON.stringify(result));
          return;
        }

        if (url.startsWith('/api/evaluate')) {
          const body = await readBody();
          req.body = body;
          await evaluateHandler(req, createVercelRes(res));
          return;
        }

        if (url.startsWith('/api/quiz')) {
          const body = await readBody();
          req.body = body;
          await quizHandler(req, createVercelRes(res));
          return;
        }

        if (url.startsWith('/api/auth')) {
          if (req.method === 'POST') {
            const body = await readBody();
            req.body = body;
          } else {
            req.body = {};
          }
          await authHandler(req, createVercelRes(res));
          return;
        }

        if (url.startsWith('/api/health')) {
          await healthHandler(req, createVercelRes(res));
          return;
        }

        if (url.startsWith('/api/progress')) {
          if (req.method === 'POST') {
            const body = await readBody();
            req.body = body;
          } else {
            req.body = {};
          }
          await progressHandler(req, createVercelRes(res));
          return;
        }

        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiDevMiddleware()],
  server: {
    port: 5173,
    host: true,
  }
});
