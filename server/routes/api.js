import { Router } from 'express';

const router = Router();

const OPENROUTER_URL =
  'https://openrouter.ai/api/v1/chat/completions';

/**
 * Calls OpenRouter API
 */
async function callAI(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not configured in .env'
    );
  }

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
          content:
            'You are a French language tutor. Always return ONLY valid JSON with no markdown, explanations, or extra text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],

      temperature: 0.7,

      response_format: {
        type: 'json_object',
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(
      `OpenRouter API ${res.status}: ${errBody}`
    );
  }

  const data = await res.json();

  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Empty OpenRouter response');
  }

  return text;
}

/**
 * Extract JSON safely
 */
function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }

    return null;
  }
}

/* =====================================================
   POST /api/ai/generate
   Body: { words: string[] }

   Returns:
   {
     sentence,
     sentence_english
   }
===================================================== */
router.post('/generate', async (req, res) => {
  try {
    const { words } = req.body;

    if (!words?.length) {
      return res.status(400).json({
        error: 'words array is required',
      });
    }

    const selected = [...words]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const prompt = `
You are a French language tutor.

Create ONE natural French sentence suitable for an intermediate learner.

Use one or more of these words:
${selected.join(', ')}

Respond ONLY with valid JSON:

{
  "sentence": "French sentence",
  "sentence_english": "English translation"
}
`;

    const raw = await callAI(prompt);

    const parsed = extractJSON(raw);

    if (parsed?.sentence) {
      return res.json(parsed);
    }

    // fallback
    return res.json({
      sentence: `Bonjour, j'aime ${selected[0]}.`,
      sentence_english: `Hello, I like ${selected[0]}.`,
    });
  } catch (err) {
    console.error('[generate]', err.message);

    return res.status(500).json({
      error: err.message,
    });
  }
});

/* =====================================================
   POST /api/ai/evaluate

   Body:
   {
     sentence,
     sentenceEn,
     userText,
     words
   }

   Returns:
   {
     score,
     feedback,
     tip,
     next_sentence,
     next_sentence_english
   }
===================================================== */
router.post('/evaluate', async (req, res) => {
  try {
    const {
      sentence,
      sentenceEn,
      userText,
      words,
    } = req.body;

    if (!sentence || !userText) {
      return res.status(400).json({
        error:
          'sentence and userText are required',
      });
    }

    const nextWords = [...(words || [])]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const prompt = `
You are a French fluency evaluator.

The learner was asked to say:

French Sentence:
"${sentence}"

English Translation:
"${sentenceEn || ''}"

The learner said:
"${userText}"

Evaluate:
- pronunciation attempt
- grammar
- vocabulary match
- overall fluency

Then generate the next practice sentence using some of these words:
${nextWords.join(', ')}

Respond ONLY with valid JSON:

{
  "score": 75,
  "feedback": "Helpful encouraging feedback",
  "tip": "One improvement tip",
  "next_sentence": "French sentence",
  "next_sentence_english": "English translation"
}

Rules:
- score must be between 0 and 100
- be encouraging but honest
- valid JSON only
`;

    const raw = await callAI(prompt);

    const parsed = extractJSON(raw);

    if (
      parsed &&
      typeof parsed.score === 'number'
    ) {
      return res.json(parsed);
    }

    // fallback
    return res.json({
      score: 60,
      feedback:
        'Good attempt! Keep practicing.',
      tip:
        'Try matching pronunciation more closely.',
      next_sentence:
        `Le ${nextWords[0] || 'français'} est magnifique.`,
      next_sentence_english:
        'French is beautiful.',
    });
  } catch (err) {
    console.error('[evaluate]', err.message);

    return res.status(500).json({
      error: err.message,
    });
  }
});

export default router;