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
      'X-Title': 'Parlé French Tutor',
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
You are a French language tutor helping a beginner practice specific vocabulary.

The student is practicing ONLY these words:
${selected.join(', ')}

Rules:
- Create ONE simple, short French sentence (5-10 words max).
- You MUST use one or more of the provided words above. Do NOT use words outside basic French (je, tu, il, elle, nous, vous, est, suis, ai, le, la, les, un, une, de, et, avec, dans, pour, très, bien, oui, non, etc.) plus the provided words.
- The sentence must be easy enough for a beginner to read and repeat.
- Do NOT invent or include any word that is not in the provided list or basic French grammar words.
- If a provided word looks misspelled or unrecognizable, skip it and use another one from the list.

Respond ONLY with valid JSON:

{
  "sentence": "Simple French sentence using the provided words",
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
You are a French fluency evaluator helping a beginner practice specific vocabulary.

The learner was asked to say:

French Sentence:
"${sentence}"

English Translation:
"${sentenceEn || ''}"

The learner said:
"${userText}"

Evaluate:
- How closely the learner's response matches the original sentence
- Basic grammar
- Vocabulary accuracy

Then generate the NEXT practice sentence.

The student is practicing ONLY these words:
${nextWords.join(', ')}

Rules for the next_sentence:
- Create ONE simple, short French sentence (5-10 words max).
- You MUST use one or more of the provided words. Do NOT use words outside basic French (je, tu, il, elle, nous, vous, est, suis, ai, le, la, les, un, une, de, et, avec, dans, pour, très, bien, oui, non, etc.) plus the provided words.
- Keep it beginner-friendly and easy to repeat.
- If a provided word looks misspelled or unrecognizable, skip it and use another one from the list.

Respond ONLY with valid JSON:

{
  "score": 75,
  "feedback": "Helpful encouraging feedback",
  "tip": "One improvement tip",
  "next_sentence": "Simple French sentence using the provided words",
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

/* =====================================================
   POST /api/ai/evaluate-session
   Body: { rounds: Array<{ sentence, sentenceEn, userText }> }

   Evaluates ALL rounds at once and returns comprehensive scores.
   Returns:
   {
     overallScore,
     pronunciationScore,
     grammarScore,
     vocabularyScore,
     fluencyScore,
     strengths: string[],
     weaknesses: string[],
     tips: string[],
     rounds: Array<{ score, feedback }>
   }
===================================================== */
router.post('/evaluate-session', async (req, res) => {
  try {
    const { rounds } = req.body;

    if (!rounds?.length) {
      return res.status(400).json({
        error: 'rounds array is required',
      });
    }

    const roundsSummary = rounds
      .map(
        (r, i) =>
          `Round ${i + 1}:\n  Expected: "${r.sentence}" (${r.sentenceEn})\n  User said: "${r.userText}"`
      )
      .join('\n\n');

    const prompt = `
You are a French language fluency evaluator. A beginner learner just completed a pronunciation practice session with ${rounds.length} rounds.

Here is what happened in each round:

${roundsSummary}

Evaluate the learner's overall performance across ALL rounds.

Score each category from 0 to 100:
1. Pronunciation — How closely did the user's spoken words match the expected French sentences?
2. Grammar — Did the user use correct grammar and word order?
3. Vocabulary — Did the user use the correct vocabulary words?
4. Fluency — How natural and fluid was the user's speech overall?

Also provide:
- An overall score (average of the 4 categories)
- 2-3 specific strengths the learner showed
- 2-3 specific weaknesses or areas to improve
- 2-3 actionable tips for improvement
- A brief per-round feedback (1 sentence each)

Respond ONLY with valid JSON:

{
  "overallScore": 72,
  "pronunciationScore": 70,
  "grammarScore": 75,
  "vocabularyScore": 80,
  "fluencyScore": 65,
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "tips": ["Tip 1", "Tip 2"],
  "rounds": [
    { "score": 75, "feedback": "Brief feedback for round 1" },
    { "score": 80, "feedback": "Brief feedback for round 2" }
  ]
}

Rules:
- All scores must be between 0 and 100
- Be encouraging but honest
- If the user's text is empty or "...", give a low score for that round
- Feedback should be in English
- valid JSON only
`;

    const raw = await callAI(prompt);
    const parsed = extractJSON(raw);

    if (parsed && typeof parsed.overallScore === 'number') {
      return res.json(parsed);
    }

    // Fallback
    return res.json({
      overallScore: 60,
      pronunciationScore: 55,
      grammarScore: 65,
      vocabularyScore: 70,
      fluencyScore: 50,
      strengths: ['Good attempt at speaking French', 'Willingness to practice'],
      weaknesses: ['Pronunciation needs work', 'Try to match the sentence more closely'],
      tips: ['Practice each word individually before full sentences', 'Listen to native speakers for pronunciation patterns'],
      rounds: rounds.map(() => ({ score: 60, feedback: 'Keep practicing!' })),
    });
  } catch (err) {
    console.error('[evaluate-session]', err.message);

    return res.status(500).json({
      error: err.message,
    });
  }
});

/* =====================================================
   POST /api/ai/chat-reply
   Body: { chatLog: Array<{ sender: string, text: string }>, topic: string }
   Returns: AI Tutor's conversational response in French
===================================================== */
router.post('/chat-reply', async (req, res) => {
  try {
    const { chatLog, topic } = req.body;
    if (!chatLog || !Array.isArray(chatLog)) {
      return res.status(400).json({ error: 'chatLog array is required' });
    }

    const formattedLog = chatLog.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');

    const prompt = `
You are a friendly, encouraging native French language tutor.
The user has chosen the topic: "${topic || 'General Conversation'}".

Here is the conversation history so far:
${formattedLog}

Generate the NEXT response from the AI French Tutor.
Guidelines:
1. Respond in French.
2. Keep your response natural, conversational, and relatively short (1 to 3 sentences max) so it is easy to listen to.
3. Keep the conversation going by asking a follow-up question related to what the user said.
4. Respond ONLY with the text of your reply. Do not add explanations, notes, translations, or markdown.
`;

    const reply = await callAI(prompt);
    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error('[chat-reply]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   POST /api/ai/evaluate-chat
   Body: { chatLog: Array<{ sender: string, text: string }> }
   Returns: Fluency evaluation metrics & spelling corrections
===================================================== */
router.post('/evaluate-chat', async (req, res) => {
  try {
    const { chatLog } = req.body;
    if (!chatLog || !Array.isArray(chatLog)) {
      return res.status(400).json({
        error: 'chatLog array is required'
      });
    }

    const formattedLog = chatLog.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');

    const prompt = `
You are a French language fluency evaluator.
Analyze the following conversation between a French AI Tutor (AI) and a French learner (USER):

${formattedLog}

Evaluate the USER's French response entries on the following aspects:
1. Fluency (how natural their sentences are, phrasing)
2. Vocabulary (word choices, richness)
3. Grammar (syntax, spelling, gender agreement, verb conjugations)

Identify any grammatical errors, spelling mistakes, or awkward phrasing the USER made. Provide clear corrections.

Respond ONLY with a valid JSON object matching this schema:
{
  "fluencyScore": 80,
  "vocabularyScore": 75,
  "grammarScore": 70,
  "pronunciationScore": 78,
  "feedback": "Encouraging evaluation feedback paragraph in English detailing their strengths and weaknesses in this dialogue.",
  "corrections": [
    {
      "original": "The user's original wrong French sentence",
      "corrected": "The corrected/natural French version",
      "explanation": "Grammar correction details in English."
    }
  ],
  "tip": "One key improvement tip for their future dialogues."
}
`;

    const raw = await callAI(prompt);
    
    // Clean and parse
    const cleanText = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanText);
      res.json(parsed);
    } catch (e) {
      // JSON extraction fallback regex
      const match = cleanText.match(/\{[\s\S]*\}/);
      if (match) {
        res.json(JSON.parse(match[0]));
      } else {
        throw e;
      }
    }
  } catch (err) {
    console.error('[evaluate-chat]', err.message);
    res.status(500).json({
      error: err.message
    });
  }
});

/* =====================================================
   GET /api/ai/tts
   Query: ?text=Bonjour
   Returns: Audio stream (binary MP3 data)
===================================================== */
router.get('/tts', async (req, res) => {
  try {
    const { text } = req.query;
    if (!text) {
      return res.status(400).json({ error: 'text parameter is required' });
    }

    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel (Female Multilingual)

    // Check if key looks valid
    if (elevenKey && elevenKey.trim() !== '' && !elevenKey.includes('your_')) {
      try {
        console.log(`[TTS] Requesting ElevenLabs audio for: "${text.substring(0, 15)}..."`);
        const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenKey.trim(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        });

        if (elRes.ok) {
          const buffer = await elRes.arrayBuffer();
          res.setHeader('Content-Type', 'audio/mpeg');
          return res.send(Buffer.from(buffer));
        } else {
          const errText = await elRes.text();
          console.warn(`[TTS] ElevenLabs API failed (${elRes.status}): ${errText}. Falling back to Google TTS.`);
        }
      } catch (elErr) {
        console.error('[TTS] ElevenLabs connection error. Falling back to Google TTS:', elErr.message);
      }
    }

    // Google Translate TTS Fallback Proxy (server-to-server bypasses browser CORS hotlinking blocks)
    console.log(`[TTS] Requesting Google Translate TTS for: "${text.substring(0, 15)}..."`);
    const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fr&client=tw-ob&q=${encodeURIComponent(text)}`;
    const googleRes = await fetch(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (googleRes.ok) {
      const buffer = await googleRes.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.send(Buffer.from(buffer));
    } else {
      const errText = await googleRes.text();
      throw new Error(`Google TTS failed with status ${googleRes.status}: ${errText}`);
    }
  } catch (err) {
    console.error('[TTS Proxy Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;