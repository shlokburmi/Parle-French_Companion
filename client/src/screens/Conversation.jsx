import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import MicButton from '../components/MicButton';
import FeedbackCard from '../components/FeedbackCard';

const TOTAL_ROUNDS = 5;

export default function Conversation({ words, showToast, onComplete }) {
  const { callApi, loading } = useApi(showToast);
  const { supported, isRecording, transcript, error, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  const [round, setRound] = useState(1);
  const [sentenceFr, setSentenceFr] = useState('');
  const [sentenceEn, setSentenceEn] = useState('');
  const [userText, setUserText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(!supported);
  const [evaluating, setEvaluating] = useState(false);

  /* ── Generate first sentence on mount ── */
  useEffect(() => {
    generateSentence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── When transcript comes in from speech, auto-evaluate ── */
  useEffect(() => {
    if (transcript && !evaluating && !feedback) {
      setUserText(transcript);
      evaluateResponse(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  /* ── Show fallback on speech error ── */
  useEffect(() => {
    if (error) {
      setShowTextFallback(true);
    }
  }, [error]);

  const generateSentence = useCallback(async () => {
    setFeedback(null);
    setUserText('');
    resetTranscript();

    const data = await callApi('/api/gemini/generate', { words });

    if (data) {
      setSentenceFr(data.sentence);
      setSentenceEn(data.sentence_english || '');
    } else {
      // Offline fallback
      const w = words[Math.floor(Math.random() * words.length)];
      setSentenceFr(`Bonjour, j'aime le ${w}.`);
      setSentenceEn(`Hello, I like ${w}.`);
    }
  }, [words, callApi, resetTranscript]);

  const evaluateResponse = useCallback(async (text) => {
    setEvaluating(true);
    const data = await callApi('/api/gemini/evaluate', {
      sentence: sentenceFr,
      sentenceEn: sentenceEn,
      userText: text,
      words,
    });

    if (data) {
      setFeedback(data);
      setResults((prev) => [...prev, {
        sentence: sentenceFr,
        sentenceEn,
        userText: text,
        score: data.score,
        feedback: data.feedback,
        tip: data.tip,
      }]);

      // Prepare next sentence from evaluation response
      if (data.next_sentence) {
        setSentenceFr(data.next_sentence);
        setSentenceEn(data.next_sentence_english || '');
      }
    } else {
      setFeedback({
        score: 50,
        feedback: 'Could not evaluate — please try again.',
        tip: 'Check your internet connection.',
      });
    }
    setEvaluating(false);
  }, [sentenceFr, sentenceEn, words, callApi]);

  const handleMicClick = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
      setShowTextFallback(false);
    }
  };

  const handleTextSubmit = () => {
    const val = textInput.trim();
    if (!val) return;
    setUserText(val);
    setTextInput('');
    evaluateResponse(val);
  };

  const handleNext = () => {
    if (round >= TOTAL_ROUNDS) {
      // Complete — send results to summary
      onComplete(results);
    } else {
      setRound((r) => r + 1);
      setFeedback(null);
      setUserText('');
      resetTranscript();
      // The next sentence was already set from evaluation response
    }
  };

  const micLabel = isRecording
    ? 'Listening…'
    : evaluating
      ? 'Processing…'
      : 'Tap to speak';

  return (
    <>
      {/* Round indicator */}
      <div className="round-indicator">
        <span>Round {round} of {TOTAL_ROUNDS}</span>
        <div className="round-dots">
          {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
            <span
              key={i}
              className={`round-dot${i < round - 1 ? ' done' : ''}${i === round - 1 ? ' current' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="divider" />

      {/* Sentence display */}
      <div className="sentence-display card">
        {loading && !sentenceFr ? (
          <div className="loading-text"><span className="spinner" /> Generating sentence…</div>
        ) : (
          <>
            <p className="sentence-fr">{sentenceFr}</p>
            <p className="sentence-en">{sentenceEn}</p>
          </>
        )}
      </div>

      {/* Mic */}
      {supported && (
        <>
          <MicButton isRecording={isRecording} onClick={handleMicClick} />
          <p className="mic-label">{micLabel}</p>
        </>
      )}

      {/* Text fallback */}
      {showTextFallback && (
        <div className="text-fallback">
          <input
            type="text"
            placeholder="Type your French response…"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
          />
          <button className="submit-text" onClick={handleTextSubmit} type="button">Submit</button>
        </div>
      )}

      {/* User transcript */}
      {userText && (
        <div className="user-transcript">
          <p className="label">You said</p>
          <p className="text">"{userText}"</p>
        </div>
      )}

      {/* Loading during evaluation */}
      {evaluating && (
        <div className="loading-text"><span className="spinner" /> Evaluating…</div>
      )}

      {/* Feedback */}
      {feedback && !evaluating && (
        <>
          <FeedbackCard score={feedback.score} feedback={feedback.feedback} tip={feedback.tip} />
          <button className="btn-primary btn-next-round" onClick={handleNext}>
            {round >= TOTAL_ROUNDS ? 'View Summary →' : 'Next Round →'}
          </button>
        </>
      )}
    </>
  );
}
