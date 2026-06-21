import { useState, useRef, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import WordPill from '../components/WordPill';
import { useApi } from '../hooks/useApi';

const FALLBACK_WORDS = ['bonjour', 'merci', 'café', "aujourd'hui", 'livre', 'bonsoir', 'maison', 'école', 'jardin', 'fromage'];

const STATUS_LABELS = {
  'loading tesseract core': 'Loading OCR engine',
  'initializing tesseract': 'Initializing',
  'loading language traineddata': 'Downloading French language data',
  'loaded language traineddata': 'Language data loaded',
  'initializing api': 'Preparing OCR',
  'recognizing text': 'Scanning text',
};

export default function ScanLearn({ onStartConversation, showToast }) {
  const { callApi } = useApi(showToast);
  const [words, setWords] = useState([]);
  const [previewSrc, setPreviewSrc] = useState('');
  const [ocrProgress, setOcrProgress] = useState(-1);
  const [ocrStatus, setOcrStatus] = useState('');
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

    const reader = new FileReader();
    reader.onload = (e) => setPreviewSrc(e.target.result);
    reader.readAsDataURL(file);

    setOcrProgress(0);
    setOcrStatus('Loading OCR engine');
    setWords([]);
    setReady(false);

    try {
      const worker = await createWorker('fra', 1, {
        logger: (m) => {
          const label = STATUS_LABELS[m.status] || m.status;
          setOcrStatus(label);
          if (m.progress != null) {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      setOcrProgress(100);
      setOcrStatus('');

      const raw = text
        .replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ' ')
        .split(/\s+/)
        .map((w) => w.toLowerCase().trim())
        .filter((w) => w.length > 2);

      const unique = [...new Set(raw)];

      // Filter out OCR garbage using linguistic heuristics (not a whitelist)
      const VOWELS = /[aeiouyàâäéèêëïîôùûüÿœæ]/i;
      const filtered = unique.filter((w) => {
        // Must contain at least one vowel
        if (!VOWELS.test(w)) return false;
        // Reject words longer than 20 chars (OCR noise)
        if (w.length > 20) return false;
        // Reject 4+ consecutive consonants (unlikely in French)
        if (/[^aeiouyàâäéèêëïîôùûüÿœæ\s'-]{4,}/i.test(w)) return false;
        // Reject 3+ repeated characters (e.g., "aaa", "lll")
        if (/(.)\1{2,}/.test(w)) return false;
        return true;
      });

      if (filtered.length < 3) {
        showToast('Few words detected — using sample French vocabulary.');
        processWords(FALLBACK_WORDS);
      } else {
        processWords(filtered.slice(0, 20));
      }
    } catch (err) {
      console.error('OCR error:', err);
      showToast('OCR failed — using sample vocabulary.');
      setOcrProgress(100);
      setOcrStatus('');
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
    
    // Save words to database portfolio in the background (fire-and-forget for instant transition)
    const savedUser = localStorage.getItem('user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    if (user?._id) {
      callApi('/api/words/batch', { userId: user._id, words }).catch(console.error);
    }
    
    onStartConversation(words);
  };

  return (
    <div className="screen-container">
      <h2 className="section-title">Scan &amp; Learn</h2>
      <p className="section-sub" style={{ maxWidth: '400px', margin: '0 auto 40px' }}>
        Transform any real-world French text into an interactive lesson. Upload a menu, a page, or a sign.
      </p>

      <div className="upload-modal" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Background floating pills effect if we have words */}
        {words.length > 0 && (
          <div style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none', opacity: 0.5 }}>
            <div className="words-container" style={{ justifyContent: 'center' }}>
              {words.map((w, i) => (
                <WordPill key={w + i} word={w} index={i} />
              ))}
            </div>
          </div>
        )}

        <div
          className={`drop-zone${dragover ? ' dragover' : ''}`}
          style={{ border: 'none', padding: 0 }}
          onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
          onDragLeave={() => setDragover(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="drop-icon-bg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
              <path d="M12 12v9"></path>
              <path d="m16 16-4-4-4 4"></path>
            </svg>
          </div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', color: 'var(--cream)', marginBottom: '8px' }}>
            Drop image here
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            or click to browse your device
          </p>
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '24px' }}>
            {['JPG', 'PNG', 'WEBP'].map(ext => (
              <span key={ext} style={{ fontSize: '0.7rem', padding: '4px 10px', background: 'rgba(240,230,200,0.05)', borderRadius: '100px', color: 'var(--muted)', fontWeight: 600 }}>
                {ext}
              </span>
            ))}
          </div>

          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files.length && handleFile(e.target.files[0])}
          />
        </div>
      </div>

      {ocrProgress >= 0 && ocrProgress < 100 && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px' }}>{ocrStatus || 'Preparing'}... {ocrProgress}%</p>
        </div>
      )}

      {ready && (
        <button className="btn-primary" onClick={handleStart}>
          Start Conversation &rarr;
        </button>
      )}
    </div>
  );
}
