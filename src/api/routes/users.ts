import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { User } from '../types';
import type { D1Database } from '@cloudflare/workers-types';

const users = new Hono<{ Bindings: { DB: D1Database } }>();

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// Get current user profile
users.get('/me', async (c) => {
  const email = c.req.header('Cf-Access-Authenticated-User-Email');
  if (!email) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first<User>();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user);
});

// Update user profile
users.put('/me', zValidator('json', userSchema), async (c) => {
  const email = c.req.header('Cf-Access-Authenticated-User-Email');
  if (!email) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { name } = c.req.valid('json');

  await c.env.DB.prepare(
    'UPDATE users SET name = ?, last_seen = CURRENT_TIMESTAMP WHERE email = ?'
  ).bind(name, email).run();

  return c.json({ message: 'Profile updated successfully' });
});

// Update user's last seen timestamp
users.post('/me/heartbeat', async (c) => {
  const email = c.req.header('Cf-Access-Authenticated-User-Email');
  if (!email) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await c.env.DB.prepare(
    'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE email = ?'
  ).bind(email).run();

  return c.json({ message: 'Heartbeat updated' });
});

export default users;
