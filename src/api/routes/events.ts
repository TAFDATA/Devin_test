import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

const events = new Hono<{ Bindings: { DB: D1Database } }>();

// SSE endpoint for real-time updates
events.get('/stream', async (c) => {
  const email = c.req.header('Cf-Access-Authenticated-User-Email');
  
  if (!email) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Get user's ID
  const user = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first<{ id: string }>();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const headers = new Headers();
  headers.append('Content-Type', 'text/event-stream');
  headers.append('Cache-Control', 'no-cache');
  headers.append('Connection', 'keep-alive');

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue('retry: 1000\n\n');
      
      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(':\n\n');
      }, 30000);

      // Cleanup on close
      c.req.raw.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers,
  });
});

export default events;
