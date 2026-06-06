import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Mic } from 'lucide-react';
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

  useEffect(() => {
    generateSentence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (transcript && !evaluating && !feedback) {
      setUserText(transcript);
      evaluateResponse(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  useEffect(() => {
    if (error) {
      setShowTextFallback(true);
    }
  }, [error]);

  const generateSentence = useCallback(async () => {
    setFeedback(null);
    setUserText('');
    resetTranscript();

    const data = await callApi('/api/ai/generate', { words });

    if (data) {
      setSentenceFr(data.sentence);
      setSentenceEn(data.sentence_english || '');
    } else {
      const w = words[Math.floor(Math.random() * words.length)];
      setSentenceFr(`Bonjour, j'aime ${w}.`);
      setSentenceEn(`Hello, I like ${w}.`);
    }
  }, [words, callApi, resetTranscript]);

  const evaluateResponse = useCallback(async (text) => {
    setEvaluating(true);
    const data = await callApi('/api/ai/evaluate', {
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
        isPerfect: data.score > 85
      }]);

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
      onComplete(results);
    } else {
      setRound((r) => r + 1);
      setFeedback(null);
      setUserText('');
      resetTranscript();
    }
  };

  const micLabel = isRecording
    ? 'Listening…'
    : evaluating
      ? 'Processing…'
      : 'Tap to speak';

  return (
    <div className="screen-container" style={{ textAlign: 'center', paddingTop: '40px' }}>
      <div className="round-badge">
        Round {round}/{TOTAL_ROUNDS}
      </div>

      <div className="sentence-display">
        {loading && !sentenceFr ? (
          <div className="loading-text"><span className="spinner" /> Generating sentence…</div>
        ) : (
          <>
            <h1 className="sentence-fr">{sentenceFr}</h1>
            <p className="sentence-en">"{sentenceEn}"</p>
          </>
        )}
      </div>

      {!feedback && !evaluating && supported && (
        <div style={{ marginTop: '64px' }}>
          {/* Audio Bars Mockup */}
          <div className="audio-bars">
            <div className="bar" style={{ animationDelay: '0.1s' }}></div>
            <div className="bar" style={{ animationDelay: '0.4s', height: '15px' }}></div>
            <div className="bar" style={{ animationDelay: '0.2s', height: '25px' }}></div>
            <div className="bar" style={{ animationDelay: '0.5s', height: '12px' }}></div>
          </div>

          <button
            className={`mic-btn ${isRecording ? 'recording' : ''}`}
            onClick={handleMicClick}
          >
            <Mic size={32} />
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '24px' }}>{micLabel}</p>
        </div>
      )}

      {showTextFallback && !feedback && !evaluating && (
        <div style={{ marginTop: '24px', maxWidth: '400px', margin: '24px auto 0' }}>
          <input
            type="text"
            style={{ width: '100%', padding: '16px', borderRadius: '8px', background: 'var(--card)', border: '1px solid rgba(240,230,200,0.1)', color: 'var(--cream)', fontFamily: 'var(--sans)', fontSize: '1rem' }}
            placeholder="Type your French response…"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
          />
        </div>
      )}

      {evaluating && (
        <div className="loading-text" style={{ marginTop: '40px' }}><span className="spinner" /> Evaluating your pronunciation…</div>
      )}

      {feedback && !evaluating && (
        <div style={{ maxWidth: '480px', margin: '40px auto 0', textAlign: 'left' }}>
          <FeedbackCard score={feedback.score} feedback={feedback.feedback} tip={feedback.tip} />
          <button className="btn-primary" onClick={handleNext} style={{ width: '100%', marginTop: '24px' }}>
            {round >= TOTAL_ROUNDS ? 'View Session Summary' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}
