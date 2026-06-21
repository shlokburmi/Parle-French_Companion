import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Mic, CheckCircle } from 'lucide-react';

const TOTAL_ROUNDS = 5;

export default function Conversation({ words, showToast, onComplete }) {
  const { callApi, loading } = useApi(showToast);
  const { supported, isRecording, transcript, error, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  const [round, setRound] = useState(1);
  const [sentenceFr, setSentenceFr] = useState('');
  const [sentenceEn, setSentenceEn] = useState('');
  const [results, setResults] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    generateSentence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When transcript is received, show confirmation briefly then advance
  useEffect(() => {
    if (transcript && !transitioning) {
      setLastTranscript(transcript);
      setShowConfirm(true);

      // Record this round's data
      const roundData = {
        round,
        sentence: sentenceFr,
        sentenceEn,
        userText: transcript,
      };

      setResults((prev) => {
        const updated = [...prev, roundData];

        // Check if this was the last round
        if (round >= TOTAL_ROUNDS) {
          // Small delay for UX, then complete
          setTimeout(() => {
            onComplete(updated);
          }, 1200);
        } else {
          // Auto-advance to next round after brief confirmation
          setTransitioning(true);
          setTimeout(() => {
            setRound((r) => r + 1);
            setShowConfirm(false);
            setLastTranscript('');
            resetTranscript();
            setTransitioning(false);
            generateNextSentence();
          }, 1500);
        }

        return updated;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  useEffect(() => {
    if (error) {
      showToast('Microphone error — please try again.');
    }
  }, [error, showToast]);

  const generateSentence = useCallback(async () => {
    const data = await callApi('/api/ai/generate', { words });

    if (data) {
      setSentenceFr(data.sentence);
      setSentenceEn(data.sentence_english || '');
    } else {
      const w = words[Math.floor(Math.random() * words.length)];
      setSentenceFr(`Bonjour, j'aime ${w}.`);
      setSentenceEn(`Hello, I like ${w}.`);
    }
  }, [words, callApi]);

  const generateNextSentence = useCallback(async () => {
    const data = await callApi('/api/ai/generate', { words });

    if (data) {
      setSentenceFr(data.sentence);
      setSentenceEn(data.sentence_english || '');
    } else {
      const w = words[Math.floor(Math.random() * words.length)];
      setSentenceFr(`Je vais bien avec ${w}.`);
      setSentenceEn(`I'm doing well with ${w}.`);
    }
  }, [words, callApi]);

  const handleMicClick = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  };

  const micLabel = isRecording
    ? 'Listening…'
    : showConfirm
      ? 'Recorded!'
      : 'Tap to speak';

  return (
    <div className="screen-container" style={{ textAlign: 'center', paddingTop: '40px' }}>
      <div className="round-badge">
        Round {round}/{TOTAL_ROUNDS}
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '16px 0 32px' }}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <div
            key={i}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: i < results.length
                ? 'var(--gold)'
                : i === round - 1
                  ? 'rgba(201,168,76,0.4)'
                  : 'rgba(240,230,200,0.1)',
              transition: 'all 0.3s ease',
              transform: i === round - 1 ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      <div className="sentence-display">
        {loading && !sentenceFr ? (
          <div className="loading-text"><span className="spinner" /> Generating sentence…</div>
        ) : (
          <>
            <h1 className="sentence-fr" style={{ opacity: showConfirm ? 0.4 : 1, transition: 'opacity 0.3s' }}>
              {sentenceFr}
            </h1>
            <p className="sentence-en">"{sentenceEn}"</p>
          </>
        )}
      </div>

      {/* Confirmation overlay after speaking */}
      {showConfirm && (
        <div style={{
          marginTop: '32px',
          padding: '16px 24px',
          background: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '12px',
          maxWidth: '400px',
          margin: '32px auto 0',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
            <CheckCircle size={18} style={{ color: '#4CAF50' }} />
            <span style={{ color: '#4CAF50', fontSize: '0.85rem', fontWeight: 600 }}>Response recorded</span>
          </div>
          <p style={{ color: 'var(--cream)', fontSize: '0.95rem', fontStyle: 'italic', margin: 0 }}>
            "{lastTranscript}"
          </p>
        </div>
      )}

      {/* Mic button - only show when not in transition and not showing confirm */}
      {!showConfirm && !transitioning && supported && (
        <div style={{ marginTop: '64px' }}>
          {/* Audio Bars */}
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

      {/* No speech recognition support message */}
      {!supported && (
        <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(217,64,64,0.1)', borderRadius: '12px', maxWidth: '400px', margin: '40px auto 0' }}>
          <p style={{ color: 'var(--red)', fontSize: '0.9rem', margin: 0 }}>
            🎤 Your browser doesn't support speech recognition. Please use Chrome or Edge for the best experience.
          </p>
        </div>
      )}

      {/* Subtle instruction */}
      {!showConfirm && !transitioning && !isRecording && sentenceFr && (
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '40px', opacity: 0.6 }}>
          Read the French sentence aloud — your pronunciation will be evaluated after all {TOTAL_ROUNDS} rounds.
        </p>
      )}
    </div>
  );
}
