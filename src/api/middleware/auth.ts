import { Context, Next } from 'hono';

export async function authMiddleware(c: Context, next: Next) {
  const cfAccessToken = c.req.header('Cf-Access-Jwt-Assertion');
  
  if (!cfAccessToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Token validation is handled by Cloudflare Access
  await next();
}
