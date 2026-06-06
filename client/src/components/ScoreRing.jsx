/**
 * Animated SVG score ring.
 * @param {number} score — 0 to 100
 * @param {number} size — pixel size of the SVG
 * @param {number} strokeWidth — ring thickness
 * @param {string} className — optional extra class
 */
export default function ScoreRing({ score = 0, size = 56, strokeWidth = 5, className = '' }) {
  const radius = (size / 2) - (strokeWidth + 2);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg
      className={`score-ring-svg ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      <circle
        className="track"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      <circle
        className="fill-ring"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + (size < 80 ? 5 : 8)}
        textAnchor="middle"
        fontSize={size < 80 ? 14 : 28}
      >
        {score}
      </text>
    </svg>
  );
}
