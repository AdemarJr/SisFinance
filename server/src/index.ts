import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config, isSupabaseConfigured } from './config.js';
import { authRoutes } from './routes/auth.js';
import { dbRoutes } from './routes/db.js';
import { legacyRoutes } from './routes/legacy.js';

const app = new Hono();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.get('/api/health', (c) =>
  c.json({
    status: 'ok',
    supabase: isSupabaseConfigured(),
  })
);

app.route('/api/auth', authRoutes);
app.route('/api/db', dbRoutes);
app.route('/api/make-server-b1600651', legacyRoutes);

serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  () => {
    console.log(`🚀 SisFinance API em http://localhost:${config.port}`);
    if (!isSupabaseConfigured()) {
      console.warn('⚠️  Supabase não configurado — defina variáveis em server/.env');
    }
  }
);
