import { Router } from 'express';

const router = Router();

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Proxy helper — calls Gemini API with the server-side key.
 */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return text;
}

/**
 * Extract JSON from a Gemini response that may contain markdown fences.
 */
function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* fall through */ }
  }
  try { return JSON.parse(text); } catch { /* fall through */ }
  return null;
}

/* ────────────────────────────────────────────
   POST /api/gemini/generate
   Body: { words: string[] }
   Returns: { sentence, sentence_english }
   ──────────────────────────────────────────── */
router.post('/generate', async (req, res) => {
  try {
    const { words } = req.body;
    if (!words?.length) {
      return res.status(400).json({ error: 'words array is required' });
    }

    const selected = words.sort(() => Math.random() - 0.5).slice(0, 3);

    const prompt = `You are a French language tutor. Create a single natural French sentence suitable for an intermediate learner that incorporates one or more of these French words: ${selected.join(', ')}.

Respond ONLY with valid JSON in this exact format, no extra text:
{"sentence": "The French sentence", "sentence_english": "The English translation"}`;

    const raw = await callGemini(prompt);
    const parsed = extractJSON(raw);

    if (parsed?.sentence) {
      return res.json(parsed);
    }

    // Fallback
    res.json({
      sentence: `Bonjour, j'aime le ${selected[0]}.`,
      sentence_english: `Hello, I like ${selected[0]}.`,
    });
  } catch (err) {
    console.error('[gemini/generate]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ────────────────────────────────────────────
   POST /api/gemini/evaluate
   Body: { sentence, sentenceEn, userText, words }
   Returns: { score, feedback, tip, next_sentence, next_sentence_english }
   ──────────────────────────────────────────── */
router.post('/evaluate', async (req, res) => {
  try {
    const { sentence, sentenceEn, userText, words } = req.body;
    if (!sentence || !userText) {
      return res.status(400).json({ error: 'sentence and userText are required' });
    }

    const nextWords = (words || []).sort(() => Math.random() - 0.5).slice(0, 3);

    const prompt = `You are a French language fluency evaluator. A student was asked to repeat or respond to this French sentence:

Sentence: "${sentence}"
English: "${sentenceEn || ''}"

The student said: "${userText}"

Evaluate their pronunciation attempt, grammar, vocabulary match, and overall fluency. Also generate the next practice sentence using some of these words: ${nextWords.join(', ')}.

Respond ONLY with valid JSON in this exact format, no extra text:
{"score": 75, "feedback": "Your feedback here", "tip": "An improvement tip", "next_sentence": "Next French sentence", "next_sentence_english": "English translation of next sentence"}

The score must be 0-100. Be encouraging but honest.`;

    const raw = await callGemini(prompt);
    const parsed = extractJSON(raw);

    if (parsed && typeof parsed.score === 'number') {
      return res.json(parsed);
    }

    // Fallback
    res.json({
      score: 60,
      feedback: 'Good attempt! Keep practicing.',
      tip: 'Try to match the sentence more closely.',
      next_sentence: `Le ${nextWords[0] || 'français'} est magnifique.`,
      next_sentence_english: 'That is magnificent.',
    });
  } catch (err) {
    console.error('[gemini/evaluate]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
