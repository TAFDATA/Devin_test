import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth.js';
import users from './routes/users';
import messages from './routes/messages';
import events from './routes/events';

const api = new Hono();

// Enable CORS
api.use('/*', cors());

// Health check endpoint
api.get('/health', (c) => c.json({ status: 'ok' }));

// Protected routes
api.use('/api/*', authMiddleware);

// Mount routes
api.route('/api/users', users);
api.route('/api/messages', messages);
api.route('/api/events', events);

export default {
  fetch: api.fetch,
};
