import { useState, useRef, useCallback } from "react";
import { FaPhotoVideo, FaSmile, FaTimes, FaGripVertical, FaPlay, FaSpinner, FaPoll } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import MentionInput from "./MentionInput";
import api from "../utils/api";
import { compressImage } from "../utils/imageUtils";

const FEELINGS = [
  "happy", "sad", "loved", "excited", "angry",
  "thankful", "crazy", "cool", "cachondo"
];

export default function CreatePost({ onPostCreated, onPostingChange }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [media, setMedia] = useState([]); // [{ id, file, preview, type: 'image'|'video' }]
  const [feeling, setFeeling] = useState("");
  const [showFeelings, setShowFeelings] = useState(false);
  const [loading, setLoading] = useState(false);
  // Poll state
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState("24");
  const [pollMultiple, setPollMultiple] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const fileRef = useRef();
  let idCounter = useRef(0);

  const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleMediaChange = async (e) => {
    const files = Array.from(e.target.files);
    const rejected = [];
    const accepted = [];

    for (const file of files) {
      const isVideo = file.type.startsWith("video/");

      if (isVideo) {
        if (file.size > MAX_VIDEO_SIZE) {
          rejected.push(`${file.name} (video max 10MB)`);
          continue;
        }
        accepted.push({
          id: `media-${Date.now()}-${idCounter.current++}`,
          file,
          preview: URL.createObjectURL(file),
          type: "video",
        });
      } else {
        try {
          const compressed = await compressImage(file);
          accepted.push({
            id: `media-${Date.now()}-${idCounter.current++}`,
            file: compressed,
            preview: URL.createObjectURL(compressed),
            type: "image",
          });
        } catch (err) {
          rejected.push(`${file.name} (${err.message})`);
        }
      }
    }

    if (rejected.length > 0) {
      alert(`These files were skipped:\n${rejected.join("\n")}`);
    }
    if (accepted.length > 0) {
      setMedia((prev) => [...prev, ...accepted]);
    }
    e.target.value = "";
  };

  const removeMedia = (id) => {
    setMedia((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  // Drag and drop handlers
  const handleDragStart = (idx) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    setDragOverIdx(idx);
  }, []);

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    setMedia((prev) => {
      const newArr = [...prev];
      const [dragged] = newArr.splice(draggedIdx, 1);
      newArr.splice(targetIdx, 0, dragged);
      return newArr;
    });
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // Touch drag support
  const [touchDragIdx, setTouchDragIdx] = useState(null);
  const touchStartY = useRef(0);

  const handleTouchStart = (idx, e) => {
    setTouchDragIdx(idx);
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (targetIdx) => {
    if (touchDragIdx !== null && touchDragIdx !== targetIdx) {
      setMedia((prev) => {
        const newArr = [...prev];
        const [dragged] = newArr.splice(touchDragIdx, 1);
        newArr.splice(targetIdx, 0, dragged);
        return newArr;
      });
    }
    setTouchDragIdx(null);
  };

  const hasPoll = showPoll && pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2;

  const handleSubmit = async () => {
    if (loading) return;
    if (!text.trim() && media.length === 0 && !hasPoll) return;
    setLoading(true);
    onPostingChange?.(true);
    try {
      const formData = new FormData();
      if (text) formData.append("text", text);
      if (feeling) formData.append("feeling", feeling);
      media.forEach((m) => formData.append("media", m.file));
      formData.append("mediaTypes", JSON.stringify(media.map((m) => m.type)));
      // Poll data
      if (hasPoll) {
        formData.append("pollQuestion", pollQuestion);
        formData.append("pollOptions", JSON.stringify(pollOptions.filter((o) => o.trim())));
        formData.append("pollDuration", pollDuration);
        formData.append("pollMultiple", pollMultiple);
      }
      const res = await api.post("/posts", formData);
      onPostCreated(res.data);
      setText("");
      media.forEach((m) => URL.revokeObjectURL(m.preview));
      setMedia([]);
      setFeeling("");
      setShowPoll(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setPollDuration("24");
      setPollMultiple(false);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    onPostingChange?.(false);
  };

  return (
    <div className="create-post">
      <div className="create-post-top">
        <img
          src={user?.profilePicture || "/default-avatar.svg"}
          alt=""
          className="avatar-medium"
        />
        <MentionInput
          placeholder={`What's on your mind, ${user?.firstName}? (@ to mention)`}
          value={text}
          onChange={setText}
          onSubmit={handleSubmit}
        />
      </div>
      {feeling && (
        <div className="feeling-tag">
          Feeling {feeling}{" "}
          <FaTimes className="remove-feeling" onClick={() => setFeeling("")} />
        </div>
      )}

      {/* Multi-media preview with drag-drop reorder */}
      {media.length > 0 && (
        <div className="multi-image-preview">
          {media.length > 1 && (
            <p className="reorder-hint">Drag to reorder</p>
          )}
          <div className="image-grid-preview">
            {media.map((item, idx) => (
              <div
                key={item.id}
                className={`preview-item ${draggedIdx === idx ? "dragging" : ""} ${dragOverIdx === idx ? "drag-over" : ""}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(idx, e)}
                onTouchEnd={() => handleTouchEnd(idx)}
              >
                <div className="preview-drag-handle">
                  <FaGripVertical />
                </div>
                {item.type === "video" ? (
                  <div className="video-preview-thumb">
                    <video src={item.preview} muted />
                    <FaPlay className="video-play-icon" />
                  </div>
                ) : (
                  <img src={item.preview} alt={`Preview ${idx + 1}`} />
                )}
                <button
                  className="remove-image"
                  onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}
                >
                  <FaTimes />
                </button>
                <span className="preview-number">{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Poll creator */}
      {showPoll && (
        <div className="poll-creator">
          <div className="poll-creator-header">
            <h4>{t("createPoll")}</h4>
            <button onClick={() => { setShowPoll(false); setPollQuestion(""); setPollOptions(["", ""]); }}>
              <FaTimes />
            </button>
          </div>
          <input
            className="poll-question-input"
            placeholder={t("pollQuestion")}
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
          />
          {pollOptions.map((opt, i) => (
            <div key={i} className="poll-option-row">
              <input
                className="poll-option-input"
                placeholder={`${t("pollOption")} ${i + 1}`}
                value={opt}
                onChange={(e) => {
                  const newOpts = [...pollOptions];
                  newOpts[i] = e.target.value;
                  setPollOptions(newOpts);
                }}
              />
              {pollOptions.length > 2 && (
                <button
                  className="poll-remove-option"
                  onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                >
                  <FaTimes />
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 6 && (
            <button className="poll-add-option" onClick={() => setPollOptions([...pollOptions, ""])}>
              + {t("addOption")}
            </button>
          )}
          <div className="poll-settings">
            <select value={pollDuration} onChange={(e) => setPollDuration(e.target.value)}>
              <option value="1">1 {t("hour")}</option>
              <option value="6">6 {t("hours")}</option>
              <option value="12">12 {t("hours")}</option>
              <option value="24">1 {t("day")}</option>
              <option value="72">3 {t("days")}</option>
              <option value="168">7 {t("days")}</option>
              <option value="0">{t("neverEnds")}</option>
            </select>
            <label className="poll-multiple-label">
              <input
                type="checkbox"
                checked={pollMultiple}
                onChange={(e) => setPollMultiple(e.target.checked)}
              />
              {t("multipleChoice")}
            </label>
          </div>
        </div>
      )}

      <hr />
      <div className="create-post-bottom">
        <button className="post-action" onClick={() => fileRef.current.click()}>
          <FaPhotoVideo color="#45bd62" /> {t("media")}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={handleMediaChange}
        />
        <button
          className="post-action"
          onClick={() => setShowFeelings(!showFeelings)}
        >
          <FaSmile color="#f7b928" /> {t("feeling")}
        </button>
        <button
          className="post-action"
          onClick={() => setShowPoll(!showPoll)}
        >
          <FaPoll color="#e74c3c" /> {t("poll")}
        </button>
        <button
          className="post-submit"
          onClick={handleSubmit}
          disabled={loading || (!text.trim() && media.length === 0 && !hasPoll)}
        >
          {loading ? <><FaSpinner className="spinner" /> {t("posting")}</> : t("post")}
        </button>
      </div>
      {showFeelings && (
        <div className="feelings-picker">
          {FEELINGS.map((f) => (
            <button
              key={f}
              className={`feeling-btn ${feeling === f ? "selected" : ""}`}
              onClick={() => {
                setFeeling(f);
                setShowFeelings(false);
              }}
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
