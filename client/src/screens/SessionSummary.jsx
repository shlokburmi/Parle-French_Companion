import { useEffect, useState, useRef } from 'react';
import ScoreRing from '../components/ScoreRing';
import { useApi } from '../hooks/useApi';
import { Sparkles, Flame, RefreshCw, TrendingUp, TrendingDown, Lightbulb, Volume2 } from 'lucide-react';

export default function SessionSummary({ results, words, showToast, onRestart, onNewWords }) {
  const { callApi } = useApi(showToast);
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(true);
  const [displayScores, setDisplayScores] = useState({
    overall: 0,
    pronunciation: 0,
    grammar: 0,
    vocabulary: 0,
    fluency: 0,
  });
  const animRef = useRef(null);

  // Call the comprehensive evaluation endpoint
  useEffect(() => {
    const evaluate = async () => {
      setEvaluating(true);

      const data = await callApi('/api/ai/evaluate-session', {
        rounds: results.map((r) => ({
          sentence: r.sentence,
          sentenceEn: r.sentenceEn,
          userText: r.userText,
        })),
      });

      if (data) {
        setEvaluation(data);

        // Save session
        callApi('/api/sessions', {
          words,
          rounds: results.map((r, i) => ({
            ...r,
            score: data.rounds?.[i]?.score || 60,
            feedback: data.rounds?.[i]?.feedback || '',
          })),
          averageScore: data.overallScore,
          vocabGained: words.length,
        }).catch(console.error);
      }
      setEvaluating(false);
    };

    evaluate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate scores when evaluation arrives
  useEffect(() => {
    if (!evaluation) return;

    const targets = {
      overall: evaluation.overallScore || 0,
      pronunciation: evaluation.pronunciationScore || 0,
      grammar: evaluation.grammarScore || 0,
      vocabulary: evaluation.vocabularyScore || 0,
      fluency: evaluation.fluencyScore || 0,
    };

    const duration = 1500;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayScores({
        overall: Math.round(eased * targets.overall),
        pronunciation: Math.round(eased * targets.pronunciation),
        grammar: Math.round(eased * targets.grammar),
        vocabulary: Math.round(eased * targets.vocabulary),
        fluency: Math.round(eased * targets.fluency),
      });

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [evaluation]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return 'var(--gold)';
    if (score >= 40) return '#FF9800';
    return 'var(--red)';
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 30) return 'Needs Work';
    return 'Keep Trying';
  };

  if (evaluating) {
    return (
      <div className="screen-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div className="loading-text" style={{ fontSize: '1.1rem' }}>
          <span className="spinner" style={{ width: '24px', height: '24px' }} />
        </div>
        <h2 className="section-title" style={{ marginTop: '24px' }}>Analyzing Your Performance</h2>
        <p className="section-sub">Evaluating pronunciation, grammar, vocabulary & fluency…</p>

        {/* Loading skeleton */}
        <div style={{ maxWidth: '500px', margin: '40px auto 0' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              height: '60px',
              background: 'rgba(240,230,200,0.03)',
              borderRadius: '12px',
              marginBottom: '12px',
              animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="screen-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <h2 className="section-title">Evaluation Unavailable</h2>
        <p className="section-sub">Could not evaluate your session. Please try again.</p>
        <button className="btn-primary" onClick={onRestart} style={{ marginTop: '24px' }}>
          <RefreshCw size={18} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="screen-container" style={{ paddingTop: '40px' }}>
      <h2 className="section-title">Session Complète</h2>
      <p className="section-sub">Here's your detailed performance breakdown.</p>

      {/* Main Score */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '32px 0',
      }}>
        <ScoreRing score={displayScores.overall} size={160} strokeWidth={10} className="score-ring-big" />
        <p style={{
          marginTop: '12px',
          fontSize: '1rem',
          fontWeight: 600,
          color: getScoreColor(displayScores.overall),
        }}>
          {getScoreLabel(displayScores.overall)}
        </p>
      </div>

      {/* Score Breakdown Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        maxWidth: '500px',
        margin: '0 auto 40px',
      }}>
        {[
          { label: 'Pronunciation', icon: '🗣️', score: displayScores.pronunciation, key: 'pronunciation' },
          { label: 'Grammar', icon: '📝', score: displayScores.grammar, key: 'grammar' },
          { label: 'Vocabulary', icon: '📚', score: displayScores.vocabulary, key: 'vocabulary' },
          { label: 'Fluency', icon: '🌊', score: displayScores.fluency, key: 'fluency' },
        ].map((item) => (
          <div key={item.key} style={{
            background: 'var(--card)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            border: '1px solid rgba(240,230,200,0.06)',
          }}>
            <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--muted)',
              margin: '8px 0 4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {item.label}
            </p>
            <p style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              color: getScoreColor(item.score),
              margin: 0,
              fontFamily: 'var(--sans)',
            }}>
              {item.score}
            </p>
            <div style={{
              height: '4px',
              background: 'rgba(240,230,200,0.06)',
              borderRadius: '2px',
              marginTop: '12px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${item.score}%`,
                background: getScoreColor(item.score),
                borderRadius: '2px',
                transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Weaknesses */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        maxWidth: '500px',
        margin: '0 auto 32px',
      }}>
        {/* Strengths */}
        <div style={{
          background: 'rgba(76, 175, 80, 0.06)',
          border: '1px solid rgba(76, 175, 80, 0.15)',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <TrendingUp size={16} style={{ color: '#4CAF50' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4CAF50', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Strengths</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(evaluation.strengths || []).map((s, i) => (
              <li key={i} style={{
                fontSize: '0.82rem',
                color: 'var(--cream)',
                padding: '6px 0',
                borderBottom: i < evaluation.strengths.length - 1 ? '1px solid rgba(240,230,200,0.05)' : 'none',
              }}>
                ✓ {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div style={{
          background: 'rgba(217, 64, 64, 0.06)',
          border: '1px solid rgba(217, 64, 64, 0.15)',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <TrendingDown size={16} style={{ color: 'var(--red)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>To Improve</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(evaluation.weaknesses || []).map((w, i) => (
              <li key={i} style={{
                fontSize: '0.82rem',
                color: 'var(--cream)',
                padding: '6px 0',
                borderBottom: i < evaluation.weaknesses.length - 1 ? '1px solid rgba(240,230,200,0.05)' : 'none',
              }}>
                △ {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tips */}
      {evaluation.tips?.length > 0 && (
        <div style={{
          maxWidth: '500px',
          margin: '0 auto 40px',
          background: 'rgba(201, 168, 76, 0.06)',
          border: '1px solid rgba(201, 168, 76, 0.15)',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Lightbulb size={16} style={{ color: 'var(--gold)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tips for Improvement</span>
          </div>
          {evaluation.tips.map((tip, i) => (
            <p key={i} style={{
              fontSize: '0.85rem',
              color: 'var(--cream)',
              margin: '8px 0',
              paddingLeft: '8px',
              borderLeft: '2px solid rgba(201, 168, 76, 0.3)',
            }}>
              {tip}
            </p>
          ))}
        </div>
      )}

      {/* Round-by-Round */}
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h3 className="timeline-header">Round-by-Round Breakdown</h3>
        <div className="timeline">
          {results.map((r, i) => {
            const roundEval = evaluation.rounds?.[i];
            const score = roundEval?.score || 0;
            return (
              <div key={i} className={`timeline-item ${score >= 80 ? 'perfect' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Round {i + 1}
                  </span>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: getScoreColor(score),
                  }}>
                    {score}/100
                  </span>
                </div>
                <p className="tl-fr">"{r.sentence}"</p>
                <p className="tl-en">"{r.sentenceEn}"</p>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--gold)',
                  margin: '6px 0 4px',
                  fontStyle: 'italic',
                }}>
                  You said: "{r.userText}"
                </p>
                {roundEval?.feedback && (
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--muted)',
                    margin: '4px 0 0',
                  }}>
                    {roundEval.feedback}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '48px auto', maxWidth: '400px', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={onRestart} style={{ flex: 1, minWidth: '160px' }}>
          <RefreshCw size={18} /> Practice Again
        </button>
        {onNewWords && (
          <button
            className="btn-primary"
            onClick={onNewWords}
            style={{
              flex: 1,
              minWidth: '160px',
              background: 'transparent',
              border: '1px solid var(--gold)',
              color: 'var(--gold)',
            }}
          >
            <Sparkles size={18} /> New Words
          </button>
        )}
      </div>
    </div>
  );
}
