import { Link } from "react-router-dom";

/**
 * Renders text with @[Name](userId) mentions as clickable links.
 * Returns an array of strings and Link elements.
 */
export default function renderMentions(text) {
  if (!text) return null;
  const regex = /@\[([^\]]+)\]\(([a-f0-9]{24})\)/g;
  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before the mention
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    // The mention itself
    parts.push(
      <Link
        key={match.index}
        to={`/profile/${match[2]}`}
        className="mention-link"
      >
        @{match[1]}
      </Link>
    );
    lastIdx = match.index + match[0].length;
  }

  // Remaining text
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length ? parts : text;
}
