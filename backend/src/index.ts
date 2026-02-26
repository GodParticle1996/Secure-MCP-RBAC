import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { apiRoutes } from './routes/api';
import { authMiddleware, rbacMiddleware } from './middleware/auth';

const app = new Hono();
app.use('*', cors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000', credentials: true }));

app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/auth', authRoutes);
app.use('/api/*', authMiddleware, rbacMiddleware);
app.route('/api', apiRoutes);

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port });
console.log(`Backend running on ${port}`);
