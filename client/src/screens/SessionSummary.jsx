import { useEffect, useState, useRef } from 'react';
import ScoreRing from '../components/ScoreRing';
import { useApi } from '../hooks/useApi';
import { Sparkles, Flame, RefreshCw } from 'lucide-react';

export default function SessionSummary({ results, words, showToast, onRestart }) {
  const { callApi } = useApi(showToast);
  const [displayScore, setDisplayScore] = useState(0);
  const [vocabGained, setVocabGained] = useState(0);
  const animRef = useRef(null);

  const avg = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;

  useEffect(() => {
    const duration = 1500;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * avg));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [avg]);

  useEffect(() => {
    if (results.length > 0) {
      // Dummy vocab gained calculation: +2 words per round if score > 70
      const gained = results.filter(r => r.score > 70).length * 2;
      setVocabGained(gained);
      
      callApi('/api/sessions', { words, rounds: results, averageScore: avg, vocabGained: gained });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen-container" style={{ paddingTop: '40px' }}>
      <h2 className="section-title">Session Complète</h2>
      <p className="section-sub">Excellent work today.</p>

      <div className="stats-grid">
        <div className="stat-card main-score">
          <p className="stat-label">Fluency Score</p>
          <ScoreRing score={displayScore} size={140} strokeWidth={8} className="score-ring-big" />
        </div>
        
        <div className="stat-card" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="stat-label" style={{ marginBottom: '8px' }}>Vocab Gained</p>
            <p className="stat-value">+{vocabGained} <span className="stat-sub">words</span></p>
          </div>
          <div style={{ background: 'rgba(201,168,76,0.1)', padding: '12px', borderRadius: '50%', color: 'var(--gold)' }}>
            <Sparkles size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="stat-label" style={{ marginBottom: '8px' }}>Current Streak</p>
            <p className="stat-value">1 <span className="stat-sub">days</span></p>
          </div>
          <div style={{ background: 'rgba(217,64,64,0.1)', padding: '12px', borderRadius: '50%', color: 'var(--red)' }}>
            <Flame size={24} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '64px' }}>
        <h3 className="timeline-header">Session Highlights</h3>
        <div className="timeline">
          {results.map((r, i) => (
            <div key={i} className={`timeline-item ${r.isPerfect ? 'perfect' : ''}`}>
              <p className="tl-fr">"{r.sentence}"</p>
              <p className="tl-en">"{r.sentenceEn}"</p>
              
              <div className={`tl-badge ${r.isPerfect ? 'perfect' : ''}`}>
                {r.isPerfect ? (
                  <><Sparkles size={14} /> Perfect Pronunciation</>
                ) : (
                  <><BookOpen size={14} /> Needs Practice</>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={onRestart} style={{ margin: '64px auto', minWidth: '240px' }}>
        <RefreshCw size={18} /> Practice Again
      </button>
    </div>
  );
}

// Just adding a quick BookOpen icon inside since it wasn't imported at the top
const BookOpen = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);
