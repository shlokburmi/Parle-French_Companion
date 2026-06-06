import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import geminiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import sessionsRoutes from './routes/sessions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root (one level up)
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', geminiRoutes);
app.use('/api/sessions', sessionsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start only if running locally (Vercel will import the app instead)
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✓ Parle server running on http://localhost:${PORT}`);
  });
};

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  start();
} else {
  // We still need to connect to the DB for Vercel Serverless function executions
  connectDB().catch(console.error);
}

// Export the express app so Vercel can run it as a serverless function
export default app;
