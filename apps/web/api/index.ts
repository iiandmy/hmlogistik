import { Hono } from 'hono';
// import { authMiddleware } from './middleware/auth.js';
// import { chatRoute } from './routes/chat.js';
import { transfersRoute } from './routes/transfers.js';

const app = new Hono().basePath('/api');

// app.use('*', authMiddleware());
app.route('/', transfersRoute);

export default app;
