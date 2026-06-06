import { useState, useRef, useCallback } from 'react';
import WordPill from '../components/WordPill';

const FALLBACK_WORDS = ['bonjour', 'merci', 'café', "aujourd'hui", 'livre', 'bonsoir', 'maison', 'école', 'jardin', 'fromage'];

export default function ScanLearn({ onStartConversation, showToast }) {
  const [words, setWords] = useState([]);
  const [previewSrc, setPreviewSrc] = useState('');
  const [ocrProgress, setOcrProgress] = useState(-1); // -1 = hidden
  const [ready, setReady] = useState(false);
  const fileRef = useRef(null);
  const [dragover, setDragover] = useState(false);

  const processWords = useCallback((wordList) => {
    setWords(wordList);
    setReady(true);
  }, []);

  const handleFile = useCallback(async (file) => {
    if (!file?.type.startsWith('image/')) {
      showToast('Please upload an image file.');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewSrc(e.target.result);
    reader.readAsDataURL(file);

    // OCR
    setOcrProgress(0);
    setWords([]);
    setReady(false);

    try {
      // Dynamically load Tesseract.js if not already loaded
      if (!window.Tesseract) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const worker = await window.Tesseract.createWorker('fra', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      setOcrProgress(100);

      // Extract words
      const raw = text
        .replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ' ')
        .split(/\s+/)
        .map((w) => w.toLowerCase().trim())
        .filter((w) => w.length > 2);

      const unique = [...new Set(raw)];

      if (unique.length < 3) {
        showToast('Few words detected — using sample French vocabulary.');
        processWords(FALLBACK_WORDS);
      } else {
        processWords(unique.slice(0, 20));
      }
    } catch (err) {
      console.error('OCR error:', err);
      showToast('OCR failed — using sample vocabulary.');
      setOcrProgress(100);
      processWords(FALLBACK_WORDS);
    }
  }, [showToast, processWords]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragover(false);
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleStart = () => {
    if (words.length === 0) return;
    onStartConversation(words);
  };

  return (
    <>
      <h2 className="section-title">Scan &amp; Learn</h2>
      <p className="section-sub">Upload an image containing French text to begin</p>

      <div
        className={`drop-zone${dragover ? ' dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <div className="drop-icon">📸</div>
        <p className="drop-text">
          Drag &amp; drop an image here<br />
          or <strong>click to browse</strong>
        </p>
        <input
          type="file"
          ref={fileRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files.length && handleFile(e.target.files[0])}
        />
        {previewSrc && <img className="image-preview" src={previewSrc} alt="Uploaded preview" />}
      </div>

      {ocrProgress >= 0 && (
        <div className="ocr-progress-wrap">
          <p className="label"><span className="spinner"></span>Scanning with Tesseract…</p>
          <div className="ocr-progress-bar">
            <div className="fill" style={{ width: `${ocrProgress}%` }} />
          </div>
        </div>
      )}

      {words.length > 0 && (
        <div className="words-container">
          {words.map((w, i) => (
            <WordPill key={w + i} word={w} index={i} />
          ))}
        </div>
      )}

      {ready && (
        <button className="btn-primary" onClick={handleStart}>
          Start Conversation
        </button>
      )}
    </>
  );
}
