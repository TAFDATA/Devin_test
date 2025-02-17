import type { D1Database } from '@cloudflare/workers-types';

declare module 'hono' {
  interface ContextEnv {
    Bindings: {
      DB: D1Database;
    }
  }
}
