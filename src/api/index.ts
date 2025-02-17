import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';

const api = new Hono();

// Enable CORS
api.use('/*', cors());

// Health check endpoint
api.get('/health', (c) => c.json({ status: 'ok' }));

// Protected routes
api.use('/api/*', authMiddleware);

// Initialize routes
api.get('/api/me', (c) => {
  return c.json({ message: 'Protected endpoint' });
});

export default {
  fetch: api.fetch,
};
