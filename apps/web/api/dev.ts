import { serve } from '@hono/node-server';
import app from './index.ts';

serve({ fetch: app.fetch, port: 3002 });
