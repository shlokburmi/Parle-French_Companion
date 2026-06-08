import { Router } from 'express';
import Word from '../models/Word.js';

const router = Router();
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Call Gemini AI to enrich words in batch
 */
async function generateWordDetails(wordsList) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in .env');
  }

  const prompt = `
You are a French language tutor. Analyze the following French words and generate dictionary/learning entries for each of them:
${wordsList.join(', ')}

Respond ONLY with a valid JSON array of objects. Do not include markdown formatting, explanations, or \`\`\`json tags.
Each object in the array must match this schema exactly:
{
  "word": "french word",
  "translation": "English translation",
  "partOfSpeech": "noun / verb / adjective / adverb / conjunction / preposition",
  "definition": "brief definition in English",
  "examples": [
    {
      "textFr": "French sentence using the word",
      "textEn": "English translation of that sentence"
    }
  ],
  "quiz": {
    "question": "A multiple choice question in English testing understanding or translation of the word, with a blank or choices.",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "The exact correct option",
    "explanation": "Explanation of why this option is correct."
  }
}
`;

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Parle French Tutor',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b:free',
      messages: [
        {
          role: 'system',
          content: 'You are a French language tutor. Always return ONLY valid JSON array with no markdown, explanation, or extra text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error: ${err}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty AI response');

  // Strip possible markdown ticks
  const cleanJsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleanJsonText);
  } catch (e) {
    // If it failed to parse as array, try regex matching
    const match = cleanJsonText.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw e;
  }
}

/* ────────────────────────────────────────────
   GET /api/words
   Query: ?userId=xxx
   ──────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const words = await Word.find({ userId }).sort({ createdAt: -1 });
    res.json(words);
  } catch (err) {
    console.error('[words/list]', err);
    res.status(500).json({ error: err.message });
  }
});

/* ────────────────────────────────────────────
   POST /api/words/batch
   Body: { userId, words }
   ──────────────────────────────────────────── */
router.post('/batch', async (req, res) => {
  try {
    const { userId, words } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ error: 'words array is required' });
    }

    // Clean and normalize words list
    const cleanWords = words
      .map(w => w.toLowerCase().trim())
      .filter(w => w.length > 1);

    if (cleanWords.length === 0) {
      return res.json({ success: true, count: 0, added: [] });
    }

    // Find which words already exist for this user
    const existing = await Word.find({ userId, word: { $in: cleanWords } });
    const existingSet = new Set(existing.map(w => w.word));

    // Filter down to only new words
    const newWords = cleanWords.filter(w => !existingSet.has(w));

    if (newWords.length === 0) {
      return res.json({ success: true, count: 0, added: [] });
    }

    // We process in smaller sub-batches of 5 to avoid API timeouts
    const addedWords = [];
    const batchSize = 5;

    for (let i = 0; i < newWords.length; i += batchSize) {
      const subBatch = newWords.slice(i, i + batchSize);
      try {
        const enriched = await generateWordDetails(subBatch);
        
        // Ensure we got an array
        const enrichedList = Array.isArray(enriched) ? enriched : [enriched];

        // Save each word
        for (const item of enrichedList) {
          if (!item.word) continue;
          
          // Verify we aren't saving duplicates
          const normalizedWord = item.word.toLowerCase().trim();
          const alreadyExists = await Word.findOne({ userId, word: normalizedWord });
          if (alreadyExists) continue;

          const saved = await Word.create({
            userId,
            word: normalizedWord,
            translation: item.translation || '',
            partOfSpeech: item.partOfSpeech || 'noun',
            definition: item.definition || '',
            examples: item.examples || [],
            quiz: item.quiz || { question: '', options: [], answer: '', explanation: '' }
          });
          addedWords.push(saved);
        }
      } catch (aiErr) {
        console.error(`Error enriching sub-batch starting at index ${i}:`, aiErr);
        // Fail-safe: Save empty objects for words that failed to enrich so user can still see them
        for (const w of subBatch) {
          const alreadyExists = await Word.findOne({ userId, word: w });
          if (alreadyExists) continue;

          const saved = await Word.create({
            userId,
            word: w,
            translation: 'Click to translate',
            partOfSpeech: 'vocabulary',
            definition: 'Imported word from image scan.',
            examples: [{ textFr: `C'est le mot : ${w}.`, textEn: `This is the word: ${w}.` }],
            quiz: {
              question: `What does the word '${w}' mean?`,
              options: [w, 'translation', 'vocabulary', 'other'],
              answer: w,
              explanation: 'Default fallback word entry.'
            }
          });
          addedWords.push(saved);
        }
      }
    }

    res.json({ success: true, count: addedWords.length, added: addedWords });
  } catch (err) {
    console.error('[words/batch]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
