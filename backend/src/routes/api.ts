import { Hono } from 'hono';
import { query } from '../db/client';

export const apiRoutes = new Hono();

apiRoutes.get('/projects', async (c) => {
  const { rows } = await query('SELECT * FROM projects ORDER BY id DESC');
  return c.json(rows);
});

apiRoutes.post('/projects', async (c) => {
  const auth = c.get('auth');
  const { name, description } = await c.req.json();
  const { rows } = await query(
    'INSERT INTO projects (name, description, user_id) VALUES ($1, $2, $3) RETURNING *',
    [name, description ?? null, auth.userId]
  );
  return c.json(rows[0], 201);
});

apiRoutes.get('/projects/:id', async (c) => {
  const { rows } = await query('SELECT * FROM projects WHERE id = $1', [c.req.param('id')]);
  if (!rows[0]) return c.json({ error: 'Project not found' }, 404);
  return c.json(rows[0]);
});

apiRoutes.put('/projects/:id', async (c) => {
  const { name, description } = await c.req.json();
  const { rows } = await query(
    'UPDATE projects SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [name, description ?? null, c.req.param('id')]
  );
  if (!rows[0]) return c.json({ error: 'Project not found' }, 404);
  return c.json(rows[0]);
});

apiRoutes.delete('/projects/:id', async (c) => {
  const result = await query('DELETE FROM projects WHERE id = $1', [c.req.param('id')]);
  if (result.rowCount === 0) return c.json({ error: 'Project not found' }, 404);
  return c.body(null, 204);
});

apiRoutes.get('/tasks', async (c) => {
  const { rows } = await query('SELECT * FROM tasks ORDER BY id DESC');
  return c.json(rows);
});

apiRoutes.post('/tasks', async (c) => {
  const auth = c.get('auth');
  const { name, description, project_id, status } = await c.req.json();
  const { rows } = await query(
    'INSERT INTO tasks (name, description, project_id, user_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, description ?? null, project_id, auth.userId, status ?? 'todo']
  );
  return c.json(rows[0], 201);
});

apiRoutes.get('/tasks/:id', async (c) => {
  const { rows } = await query('SELECT * FROM tasks WHERE id = $1', [c.req.param('id')]);
  if (!rows[0]) return c.json({ error: 'Task not found' }, 404);
  return c.json(rows[0]);
});

apiRoutes.put('/tasks/:id', async (c) => {
  const { name, description, status } = await c.req.json();
  const { rows } = await query(
    'UPDATE tasks SET name = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
    [name, description ?? null, status ?? 'todo', c.req.param('id')]
  );
  if (!rows[0]) return c.json({ error: 'Task not found' }, 404);
  return c.json(rows[0]);
});

apiRoutes.delete('/tasks/:id', async (c) => {
  const result = await query('DELETE FROM tasks WHERE id = $1', [c.req.param('id')]);
  if (result.rowCount === 0) return c.json({ error: 'Task not found' }, 404);
  return c.body(null, 204);
});
