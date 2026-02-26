import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { query } from '../db/client';
import { signToken, type UserRole } from '../auth/jwt';

interface AuthBody {
  email: string;
  password: string;
}

async function getUserByEmail(email: string) {
  const result = await query<{ id: number; email: string; password_hash: string }>(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] ?? null;
}

async function getUserRole(userId: number): Promise<UserRole> {
  const result = await query<{ name: UserRole }>(
    `SELECT r.name
     FROM roles r
     INNER JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1
     ORDER BY r.id ASC
     LIMIT 1`,
    [userId]
  );

  return result.rows[0]?.name ?? 'ai_agent';
}

export const authRoutes = new Hono();

authRoutes.post('/register', async (c) => {
  const body = (await c.req.json()) as AuthBody;
  if (!body.email || !body.password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  const existing = await getUserByEmail(body.email);
  if (existing) {
    return c.json({ error: 'Email already exists' }, 409);
  }

  const hash = await bcrypt.hash(body.password, 10);
  const inserted = await query<{ id: number }>(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
    [body.email, hash]
  );

  return c.json({ id: inserted.rows[0].id, email: body.email }, 201);
});

authRoutes.post('/login', async (c) => {
  const body = (await c.req.json()) as AuthBody;
  const source = c.req.query('source');
  const user = await getUserByEmail(body.email);
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  const valid = await bcrypt.compare(body.password, user.password_hash);
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401);

  const role = source === 'ai' ? 'ai_agent' : await getUserRole(user.id);
  const token = signToken({ userId: user.id, role });

  if (source === 'ai') {
    return c.json({ token, userId: user.id, role });
  }

  c.header('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; SameSite=Lax`);
  return c.json({ userId: user.id, role });
});

authRoutes.post('/login/ai-agent', async (c) => {
  const body = (await c.req.json()) as AuthBody;
  const user = await getUserByEmail(body.email);
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  const valid = await bcrypt.compare(body.password, user.password_hash);
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401);

  const token = signToken({ userId: user.id, role: 'ai_agent' });
  return c.json({ token, userId: user.id, role: 'ai_agent' });
});
