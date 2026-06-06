export default function WordPill({ word, index }) {
  return (
    <span
      className="word-pill"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {word}
    </span>
  );
}
