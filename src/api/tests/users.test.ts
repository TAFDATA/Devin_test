import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import users from '../routes/users';
import { createTestApp, type MockD1Database } from './utils';

describe('User Management API', () => {
  let app: Hono<{ Bindings: { DB: D1Database } }>;
  let mockDB: MockD1Database;

  beforeEach(() => {
    const { app: testApp, mockDB: testDB } = createTestApp(users);
    app = testApp;
    mockDB = testDB;
  });

  describe('GET /api/users/me', () => {
    it('should handle database errors gracefully', async () => {
      mockDB.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockRejectedValue(new Error('DB Error')),
        run: vi.fn().mockRejectedValue(new Error('DB Error')),
      });

      const res = await app.request('/api/users/me', {
        headers: {
          'Cf-Access-Authenticated-User-Email': 'test@example.com',
        },
      });
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Internal server error' });
    });
    it('should return 401 when no email header is present', async () => {
      const res = await app.request('/api/users/me');
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 when user is not found', async () => {
      mockDB.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      });

      const res = await app.request('/api/users/me', {
        headers: {
          'Cf-Access-Authenticated-User-Email': 'test@example.com',
        },
      });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'User not found' });
    });

    it('should return user profile when found', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: '2024-02-17T00:00:00Z',
        lastSeen: '2024-02-17T00:00:00Z',
      };

      mockDB.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      });

      const res = await app.request('/api/users/me', {
        headers: {
          'Cf-Access-Authenticated-User-Email': 'test@example.com',
        },
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(mockUser);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should return 401 when no email header is present', async () => {
      const res = await app.request('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should update user profile successfully', async () => {
      mockDB.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: '123' }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });

      const res = await app.request('/api/users/me', {
        method: 'PUT',
        headers: {
          'Cf-Access-Authenticated-User-Email': 'test@example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'New Name' }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: 'Profile updated successfully' });
    });

    it('should handle database error in profile update', async () => {
      mockDB.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: '123' }),
        run: vi.fn().mockRejectedValue(new Error('DB Error')),
      });

      const res = await app.request('/api/users/me', {
        method: 'PUT',
        headers: {
          'Cf-Access-Authenticated-User-Email': 'test@example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'New Name' }),
      });
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Internal server error' });
    });

    it('should reject empty name', async () => {
      const res = await app.request('/api/users/me', {
        method: 'PUT',
        headers: {
          'Cf-Access-Authenticated-User-Email': 'test@example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '' }),
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toHaveProperty('error', 'Invalid input');
    });

    it('should reject missing name field', async () => {
      const res = await app.request('/api/users/me', {
        method: 'PUT',
        headers: {
          'Cf-Access-Authenticated-User-Email': 'test@example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toHaveProperty('error', 'Invalid input');
    });
  });

  describe('POST /api/users/me/heartbeat', () => {
    it('should return 401 when no email header is present', async () => {
      const res = await app.request('/api/users/me/heartbeat', {
        method: 'POST',
      });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should update last seen timestamp successfully', async () => {
      mockDB.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
      });

      const res = await app.request('/api/users/me/heartbeat', {
        method: 'POST',
        headers: {
          'Cf-Access-Authenticated-User-Email': 'test@example.com',
        },
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: 'Heartbeat updated' });
    });

    it('should handle concurrent heartbeat updates', async () => {
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      mockDB.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: mockRun,
      });

      const requests = Array(3).fill(null).map(() => 
        app.request('/api/users/me/heartbeat', {
          method: 'POST',
          headers: {
            'Cf-Access-Authenticated-User-Email': 'test@example.com',
          },
        })
      );

      const responses = await Promise.all(requests);
      
      expect(mockRun).toHaveBeenCalledTimes(3);
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });
    });

    it('should handle database error in heartbeat update', async () => {
      mockDB.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockRejectedValue(new Error('DB Error')),
      });

      const res = await app.request('/api/users/me/heartbeat', {
        method: 'POST',
        headers: {
          'Cf-Access-Authenticated-User-Email': 'test@example.com',
        },
      });
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Internal server error' });
    });
  });
});
