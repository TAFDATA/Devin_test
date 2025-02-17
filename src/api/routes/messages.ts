import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Message } from '../types';
import type { D1Database } from '@cloudflare/workers-types';

const messages = new Hono<{ Bindings: { DB: D1Database } }>();

const messageSchema = z.object({
  content: z.string().min(1),
  receiverId: z.string().min(1),
});

// Get messages between current user and another user
messages.get('/:userId', async (c) => {
  const userId = c.req.param('userId');
  const email = c.req.header('Cf-Access-Authenticated-User-Email');
  
  if (!email) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Get current user's ID
  const currentUser = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first<{ id: string }>();

  if (!currentUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Get messages between users
  const messages = await c.env.DB.prepare(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?)
    OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at DESC
    LIMIT 50
  `).bind(currentUser.id, userId, userId, currentUser.id).all<Message>();

  return c.json(messages.results);
});

// Send a message
messages.post('/', zValidator('json', messageSchema), async (c) => {
  const { content, receiverId } = c.req.valid('json');
  const email = c.req.header('Cf-Access-Authenticated-User-Email');
  
  if (!email) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Get sender's ID
  const sender = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first<{ id: string }>();

  if (!sender) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Insert message
  const result = await c.env.DB.prepare(`
    INSERT INTO messages (id, sender_id, receiver_id, content)
    VALUES (?, ?, ?, ?)
  `).bind(crypto.randomUUID(), sender.id, receiverId, content).run();

  if (!result.success) {
    return c.json({ error: 'Failed to send message' }, 500);
  }

  // Send SSE event
  const headers = new Headers();
  headers.append('Content-Type', 'text/event-stream');
  const event = {
    type: 'new_message',
    data: {
      senderId: sender.id,
      receiverId,
      content,
    },
  };
  
  return c.json({ message: 'Message sent successfully' });
});

// Mark messages as read
messages.post('/:userId/read', async (c) => {
  const userId = c.req.param('userId');
  const email = c.req.header('Cf-Access-Authenticated-User-Email');
  
  if (!email) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Get current user's ID
  const currentUser = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first<{ id: string }>();

  if (!currentUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Mark messages as read
  await c.env.DB.prepare(`
    UPDATE messages 
    SET read_at = CURRENT_TIMESTAMP
    WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL
  `).bind(userId, currentUser.id).run();

  return c.json({ message: 'Messages marked as read' });
});

export default messages;
