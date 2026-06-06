import ScoreRing from './ScoreRing';

/**
 * Displays fluency score, feedback text, and improvement tip.
 */
export default function FeedbackCard({ score, feedback, tip }) {
  return (
    <div className="feedback-card">
      <div className="score-row">
        <ScoreRing score={score} size={56} strokeWidth={5} className="score-ring" />
        <div>
          <p className="score-label">Fluency Score</p>
          <p className="score-value">{score}/100</p>
        </div>
      </div>
      <p className="fb-text">{feedback}</p>
      {tip && <div className="fb-tip">💡 {tip}</div>}
    </div>
  );
}
