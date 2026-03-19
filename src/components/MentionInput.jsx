import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * MentionInput — a textarea/input that supports @mentions.
 * When the user types @, shows a dropdown of friends to pick from.
 * Stores mentions as @[First Last](userId) in the raw text.
 * Props:
 *   value, onChange — controlled text value
 *   placeholder — input placeholder
 *   onSubmit — called on Enter key
 *   multiline — use textarea instead of input
 *   className — extra class name
 *   autoFocus — auto focus on mount
 */
export default function MentionInput({
  value,
  onChange,
  placeholder,
  onSubmit,
  multiline,
  className,
  autoFocus,
}) {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef();

  const friends = user?.friends || [];
  const filtered = friends.filter((f) => {
    if (!mentionQuery) return true;
    const name = `${f.firstName} ${f.lastName}`.toLowerCase();
    return name.includes(mentionQuery.toLowerCase());
  }).slice(0, 6);

  const handleChange = (e) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(text);

    // Check if we're in a mention context
    const textBefore = text.slice(0, cursorPos);
    const atIdx = textBefore.lastIndexOf("@");

    if (atIdx !== -1) {
      const afterAt = textBefore.slice(atIdx + 1);
      // Only show dropdown if @ is at start or after a space, and no space break in query
      const charBefore = atIdx > 0 ? text[atIdx - 1] : " ";
      if ((charBefore === " " || charBefore === "\n" || atIdx === 0) && !afterAt.includes("\n")) {
        setShowDropdown(true);
        setMentionQuery(afterAt);
        setMentionStart(atIdx);
        setSelectedIdx(0);
        return;
      }
    }
    setShowDropdown(false);
  };

  const insertMention = (friend) => {
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + 1 + mentionQuery.length);
    const mention = `@[${friend.firstName} ${friend.lastName}](${friend._id}) `;
    const newText = before + mention + after;
    onChange(newText);
    setShowDropdown(false);

    // Refocus
    setTimeout(() => {
      if (inputRef.current) {
        const pos = before.length + mention.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showDropdown && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => (i + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filtered[selectedIdx]);
        return;
      }
      if (e.key === "Escape") {
        setShowDropdown(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey && !showDropdown) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  const Tag = multiline ? "textarea" : "input";

  return (
    <div className="mention-input-wrapper">
      <Tag
        ref={inputRef}
        className={className || ""}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
      />
      {showDropdown && filtered.length > 0 && (
        <div className="mention-dropdown">
          {filtered.map((f, i) => (
            <div
              key={f._id}
              className={`mention-option ${i === selectedIdx ? "selected" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(f);
              }}
            >
              <img
                src={f.profilePicture || "/default-avatar.svg"}
                alt=""
                className="avatar-small"
              />
              <span>{f.firstName} {f.lastName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
