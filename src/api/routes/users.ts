import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { User } from '../types';
import type { D1Database } from '@cloudflare/workers-types';

const users = new Hono<{ Bindings: { DB: D1Database } }>();

const userSchema = z.object({
  name: z.string().min(1),
});

// Get current user profile
users.get('/me', async (c) => {
  const email = c.req.header('Cf-Access-Authenticated-User-Email');
  if (!email) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first<User>();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user profile
users.put('/me', async (c) => {
  const email = c.req.header('Cf-Access-Authenticated-User-Email');
  if (!email) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const result = userSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: 'Invalid input', details: result.error.errors }, 400);
    }
    const { name } = result.data;

    const dbResult = await c.env.DB.prepare(
      'UPDATE users SET name = ?, last_seen = CURRENT_TIMESTAMP WHERE email = ?'
    ).bind(name, email).run();

    if (!dbResult.success) {
      return c.json({ error: 'Failed to update profile' }, 500);
    }

    return c.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user's last seen timestamp
users.post('/me/heartbeat', async (c) => {
  const email = c.req.header('Cf-Access-Authenticated-User-Email');
  if (!email) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const result = await c.env.DB.prepare(
      'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE email = ?'
    ).bind(email).run();

    if (!result.success) {
      return c.json({ error: 'Failed to update heartbeat' }, 500);
    }

    return c.json({ message: 'Heartbeat updated' });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default users;
