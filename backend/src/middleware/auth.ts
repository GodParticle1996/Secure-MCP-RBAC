import type { Context, Next } from 'hono';
import { parse } from 'cookie';
import { verifyToken, type JwtPayload, type UserRole } from '../auth/jwt';

declare module 'hono' {
  interface ContextVariableMap {
    auth: JwtPayload;
  }
}

function extractToken(c: Context): string | null {
  const authHeader = c.req.header('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  const cookieHeader = c.req.header('cookie');
  if (!cookieHeader) return null;
  const cookies = parse(cookieHeader);
  return cookies.auth_token ?? null;
}

export async function authMiddleware(c: Context, next: Next) {
  const token = extractToken(c);
  if (!token) return c.json({ error: 'Unauthorized: missing token' }, 401);

  try {
    const payload = verifyToken(token);
    c.set('auth', payload);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized: invalid token' }, 401);
  }
}

const rolePermissions: Record<UserRole, ReadonlySet<string>> = {
  human_admin: new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  ai_agent: new Set(['GET', 'POST'])
};

export async function rbacMiddleware(c: Context, next: Next) {
  const auth = c.get('auth');
  const method = c.req.method.toUpperCase();
  const allowed = rolePermissions[auth.role]?.has(method);

  if (!allowed) {
    return c.json({ error: 'Insufficient permissions' }, 403);
  }

  await next();
}
