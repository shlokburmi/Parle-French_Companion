import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import geminiRoutes from './routes/api.js';
import sessionRoutes from './routes/sessions.js';

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
app.use('/api/gemini', geminiRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✓ Parle server running on http://localhost:${PORT}`);
  });
};

start();
