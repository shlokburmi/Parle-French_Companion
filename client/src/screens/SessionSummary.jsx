import { useEffect, useState, useRef } from 'react';
import ScoreRing from '../components/ScoreRing';
import { useApi } from '../hooks/useApi';

export default function SessionSummary({ results, words, showToast, onRestart, onNewWords }) {
  const { callApi } = useApi(showToast);
  const [displayScore, setDisplayScore] = useState(0);
  const animRef = useRef(null);

  const avg = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;

  /* ── Animated count-up ── */
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

  /* ── Save session to MongoDB ── */
  useEffect(() => {
    if (results.length > 0) {
      callApi('/api/sessions', { words, rounds: results, averageScore: avg });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h2 className="section-title" style={{ textAlign: 'center' }}>Session Complete</h2>
      <p className="section-sub" style={{ textAlign: 'center' }}>Here's how you did</p>

      <div className="summary-hero">
        <ScoreRing score={displayScore} size={120} strokeWidth={8} className="score-ring-big" />
        <p className="big-score">{displayScore}</p>
        <p className="big-score-label">Average Fluency</p>
      </div>

      <div className="divider" />

      <ul className="summary-list">
        {results.map((r, i) => (
          <li
            className="summary-item"
            key={i}
            style={{ animationDelay: `${i * 100 + 400}ms` }}
          >
            <p className="si-round">Round {i + 1}</p>
            <p className="si-fr">{r.sentence}</p>
            <p className="si-user">You: "{r.userText}"</p>
            <p className="si-score">Score: {r.score}/100</p>
          </li>
        ))}
      </ul>

      <button className="btn-primary" onClick={onRestart}>Session Again</button>
      <button className="btn-secondary" onClick={onNewWords}>New Words</button>
    </>
  );
}
