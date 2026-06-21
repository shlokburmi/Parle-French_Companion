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

      // Common French words to validate OCR output against
      const COMMON_FRENCH = new Set([
        'bonjour', 'bonsoir', 'salut', 'merci', 'beaucoup', 'oui', 'non',
        'bien', 'très', 'tres', 'aussi', 'avec', 'pour', 'dans', 'sur',
        'mais', 'donc', 'car', 'comme', 'quand', 'comment', 'pourquoi',
        'demain', 'aujourd', "aujourd'hui", 'hier', 'maintenant', 'bientôt', 'bientot',
        'toujours', 'jamais', 'souvent', 'parfois', 'encore', 'déjà', 'deja',
        'jour', 'journée', 'journee', 'soir', 'soirée', 'soiree', 'matin', 'nuit',
        'bon', 'bonne', 'beau', 'belle', 'petit', 'petite', 'grand', 'grande',
        'maison', 'école', 'ecole', 'livre', 'café', 'cafe', 'eau', 'pain',
        'fromage', 'jardin', 'ville', 'rue', 'ami', 'amie', 'famille', 'enfant',
        'homme', 'femme', 'fille', 'garçon', 'garcon', 'chat', 'chien',
        'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
        'suis', 'est', 'sont', 'avons', 'avez', 'ont', 'ai', 'as',
        'aime', 'mange', 'parle', 'fait', 'vais', 'veux', 'peux', 'dois',
        'aller', 'manger', 'parler', 'faire', 'voir', 'avoir', 'être', 'etre',
        'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de',
        'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
        'revoir', 'bienvenue', 'excusez', 'pardon', 'merci', 'plait', "s'il",
        'rouge', 'bleu', 'vert', 'blanc', 'noir', 'rose',
        'lire', 'écrire', 'ecrire', 'apprendre', 'comprendre', 'savoir',
        'content', 'contente', 'heureux', 'heureuse', 'triste', 'fatigué', 'fatigue',
      ]);

      const raw = text
        .replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ' ')
        .split(/\s+/)
        .map((w) => w.toLowerCase().trim())
        .filter((w) => w.length > 2);

      const unique = [...new Set(raw)];

      // Filter: keep words that are recognized French words or close matches
      const filtered = unique.filter((w) => {
        // Direct match
        if (COMMON_FRENCH.has(w)) return true;
        // Check if it's part of a known compound (e.g., "aujourd" from "aujourd'hui")
        for (const known of COMMON_FRENCH) {
          if (known.startsWith(w) && w.length >= 4) return true;
          if (w.startsWith(known) && known.length >= 4) return true;
        }
        return false;
      });

      if (filtered.length < 3) {
        showToast('Few recognizable words — using sample French vocabulary.');
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
            {['JPG', 'PNG', 'PDF'].map(ext => (
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
