import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Encapsulates Web Speech API with fallback detection.
 * Returns { supported, isRecording, transcript, startListening, stopListening, resetTranscript }
 */
export function useSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = !!SpeechRecognition;

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!supported) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.addEventListener('result', (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setIsRecording(false);
    });

    recognition.addEventListener('error', (e) => {
      setIsRecording(false);
      if (e.error === 'no-speech') {
        setError('No speech detected');
      } else {
        setError(e.error);
      }
    });

    recognition.addEventListener('end', () => {
      setIsRecording(false);
    });

    recognitionRef.current = recognition;

    return () => {
      try { recognition.abort(); } catch {}
    };
  }, [supported]);

  const startListening = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    setError('');
    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Microphone access denied');
    }
  }, [supported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
    setIsRecording(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError('');
  }, []);

  return { supported, isRecording, transcript, error, startListening, stopListening, resetTranscript };
}
