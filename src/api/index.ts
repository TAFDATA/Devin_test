import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth.js';
import users from './routes/users';

const api = new Hono();

// Enable CORS
api.use('/*', cors());

// Health check endpoint
api.get('/health', (c) => c.json({ status: 'ok' }));

// Protected routes
api.use('/api/*', authMiddleware);

// Mount user routes
api.route('/api/users', users);

export default {
  fetch: api.fetch,
};
