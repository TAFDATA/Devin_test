import { Hono } from 'hono';
import { vi } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';

export interface MockD1Database extends D1Database {
  prepare: ReturnType<typeof vi.fn>;
}

export function createMockDB(): MockD1Database {
  const mockDB = {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn().mockResolvedValue({ success: true }),
    }),
  } as MockD1Database;
  return mockDB;
}

type AppType = Hono<{ Bindings: { DB: D1Database } }>;

export function createTestApp(route: AppType) {
  const app = new Hono<{ Bindings: { DB: D1Database } }>();
  const mockDB = createMockDB();
  
  app.use('*', async (c, next) => {
    c.env = { DB: mockDB } as { DB: D1Database };
    await next();
  });
  app.route('/api/users', route);
  
  return { app, mockDB };
}
