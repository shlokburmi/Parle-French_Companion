import { Router } from 'express';
import Session from '../models/Session.js';

const router = Router();

/* ────────────────────────────────────────────
   POST /api/sessions
   Body: { words, rounds, averageScore }
   ──────────────────────────────────────────── */
router.post('/', async (req, res) => {
  try {
    const { words, rounds, averageScore } = req.body;
    const session = await Session.create({ words, rounds, averageScore });
    res.status(201).json(session);
  } catch (err) {
    console.error('[sessions/create]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ────────────────────────────────────────────
   GET /api/sessions
   Returns latest 20 sessions
   ──────────────────────────────────────────── */
router.get('/', async (_req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 }).limit(20);
    res.json(sessions);
  } catch (err) {
    console.error('[sessions/list]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
