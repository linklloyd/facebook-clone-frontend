import { useState, useEffect } from "react";
import {
  FaPlus,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaBold,
  FaItalic,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaFont,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { compressImage } from "../utils/imageUtils";

const SOLID_COLORS = [
  "#1877f2", "#e74c3c", "#2ecc71", "#9b59b6",
  "#f39c12", "#1abc9c", "#e91e63", "#00bcd4",
];

const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
];

const FONTS = [
  { label: "Sans", value: "sans-serif" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Mono", value: "'Courier New', monospace" },
  { label: "Cursive", value: "'Segoe Script', 'Comic Sans MS', cursive" },
  { label: "Impact", value: "Impact, sans-serif" },
];

const FONT_SIZES = [18, 24, 28, 36, 48];

const TEXT_COLORS = [
  "#ffffff", "#000000", "#f7b928", "#e74c3c",
  "#2ecc71", "#1877f2", "#ff69b4", "#00ffff",
];

export default function Stories() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showViewer, setShowViewer] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  useEffect(() => {
    api.get("/stories/feed").then((r) => setStoryGroups(r.data));
  }, []);

  const openStory = (groupIndex) => {
    setShowViewer(groupIndex);
    setCurrentStoryIndex(0);
    const story = storyGroups[groupIndex].stories[0];
    api.put(`/stories/${story._id}/view`);
  };

  const handleCreated = async () => {
    const res = await api.get("/stories/feed");
    setStoryGroups(res.data);
    setShowCreate(false);
  };

  // Get the background style for a story
  const storyBg = (story) => {
    if (story.image) return { backgroundImage: `url(${story.image})` };
    if (story.gradient) return { background: story.gradient };
    return { backgroundColor: story.backgroundColor };
  };

  return (
    <>
      <div className="stories-container">
        <div className="story-card create-story" onClick={() => setShowCreate(true)}>
          <div className="create-story-icon">
            <FaPlus />
          </div>
          <span>Create Story</span>
        </div>
        {storyGroups.map((group, i) => (
          <div
            key={group.author._id}
            className="story-card"
            onClick={() => openStory(i)}
            style={storyBg(group.stories[0])}
          >
            <img
              src={group.author.profilePicture || "/default-avatar.svg"}
              alt=""
              className="story-author-pic"
            />
            <span className="story-author-name">
              {group.author._id === user?._id
                ? "Your story"
                : group.author.firstName}
            </span>
            {group.stories[0].text && !group.stories[0].image && (
              <p
                className="story-preview-text"
                style={{
                  fontFamily: group.stories[0].fontFamily || "sans-serif",
                  fontSize: "12px",
                }}
              >
                {group.stories[0].text}
              </p>
            )}
          </div>
        ))}
      </div>

      {showCreate && <StoryCreator onClose={() => setShowCreate(false)} onCreated={handleCreated} />}

      {showViewer !== null && storyGroups[showViewer] && (
        <div className="modal-overlay story-viewer" onClick={() => setShowViewer(null)}>
          <div className="story-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="story-close" onClick={() => setShowViewer(null)}>
              <FaTimes />
            </button>
            <div className="story-progress">
              {storyGroups[showViewer].stories.map((_, i) => (
                <div
                  key={i}
                  className={`progress-bar ${i <= currentStoryIndex ? "active" : ""}`}
                />
              ))}
            </div>
            <div className="story-author-info">
              <img
                src={storyGroups[showViewer].author.profilePicture || "/default-avatar.svg"}
                alt=""
                className="avatar-small"
              />
              <span>{storyGroups[showViewer].author.firstName} {storyGroups[showViewer].author.lastName}</span>
            </div>
            {(() => {
              const story = storyGroups[showViewer].stories[currentStoryIndex];
              return (
                <div
                  className="story-display"
                  style={{
                    ...storyBg(story),
                    justifyContent:
                      story.textPosition === "top" ? "flex-start" :
                      story.textPosition === "bottom" ? "flex-end" : "center",
                  }}
                >
                  {story.text && (
                    <p
                      className="story-text"
                      style={{
                        fontFamily: story.fontFamily || "sans-serif",
                        fontSize: `${story.fontSize || 28}px`,
                        color: story.fontColor || "#ffffff",
                        textAlign: story.textAlign || "center",
                        fontWeight: story.fontWeight || "bold",
                        fontStyle: story.fontStyle || "normal",
                      }}
                    >
                      {story.text}
                    </p>
                  )}
                </div>
              );
            })()}
            {currentStoryIndex > 0 && (
              <button
                className="story-nav prev"
                onClick={() => setCurrentStoryIndex((i) => i - 1)}
              >
                <FaChevronLeft />
              </button>
            )}
            {currentStoryIndex < storyGroups[showViewer].stories.length - 1 && (
              <button
                className="story-nav next"
                onClick={() => {
                  const next = currentStoryIndex + 1;
                  setCurrentStoryIndex(next);
                  api.put(`/stories/${storyGroups[showViewer].stories[next]._id}/view`);
                }}
              >
                <FaChevronRight />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ---- Story Creator with full customization ---- */
function StoryCreator({ onClose, onCreated }) {
  const [text, setText] = useState("");
  const [bgColor, setBgColor] = useState("#1877f2");
  const [gradient, setGradient] = useState("");
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [fontSize, setFontSize] = useState(28);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [textAlign, setTextAlign] = useState("center");
  const [textPosition, setTextPosition] = useState("center");
  const [fontWeight, setFontWeight] = useState("bold");
  const [fontStyle, setFontStyle] = useState("normal");
  const [storyImage, setStoryImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("bg"); // bg | text | font

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setStoryImage(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch (err) {
      alert(err.message);
    }
    e.target.value = "";
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setStoryImage(null);
    setImagePreview(null);
  };

  const handleCreate = async () => {
    if (loading) return;
    if (!text && !storyImage) return;
    setLoading(true);
    try {
      const formData = new FormData();
      if (text) formData.append("text", text);
      formData.append("backgroundColor", bgColor);
      formData.append("gradient", gradient);
      formData.append("fontFamily", fontFamily);
      formData.append("fontSize", fontSize);
      formData.append("fontColor", fontColor);
      formData.append("textAlign", textAlign);
      formData.append("textPosition", textPosition);
      formData.append("fontWeight", fontWeight);
      formData.append("fontStyle", fontStyle);
      if (storyImage) formData.append("image", storyImage);
      await api.post("/stories", formData);
      onCreated();
    } catch (err) {
      console.error(err);
      alert("Failed to create story");
    }
    setLoading(false);
  };

  const previewBg = () => {
    if (imagePreview) return { backgroundImage: `url(${imagePreview})`, backgroundSize: "cover", backgroundPosition: "center" };
    if (gradient) return { background: gradient };
    return { backgroundColor: bgColor };
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal story-create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Story</h3>
          <button onClick={onClose}><FaTimes /></button>
        </div>

        {/* Live preview */}
        <div
          className="story-preview"
          style={{
            ...previewBg(),
            justifyContent:
              textPosition === "top" ? "flex-start" :
              textPosition === "bottom" ? "flex-end" : "center",
          }}
        >
          {imagePreview && (
            <button className="story-remove-img" onClick={removeImage}>
              <FaTimes />
            </button>
          )}
          {text && (
            <p
              className="story-preview-live-text"
              style={{
                fontFamily,
                fontSize: `${fontSize}px`,
                color: fontColor,
                textAlign,
                fontWeight,
                fontStyle,
              }}
            >
              {text}
            </p>
          )}
          {!text && !imagePreview && (
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }}>Preview</span>
          )}
        </div>

        {/* Customization tabs */}
        <div className="story-customize-tabs">
          <button className={activeTab === "bg" ? "active" : ""} onClick={() => setActiveTab("bg")}>
            Background
          </button>
          <button className={activeTab === "text" ? "active" : ""} onClick={() => setActiveTab("text")}>
            Text Style
          </button>
          <button className={activeTab === "font" ? "active" : ""} onClick={() => setActiveTab("font")}>
            Font
          </button>
        </div>

        <div className="story-form">
          <textarea
            placeholder="Write something..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ fontFamily, fontWeight, fontStyle }}
          />

          {/* Background tab */}
          {activeTab === "bg" && (
            <div className="story-customize-section">
              <label>Solid Colors</label>
              <div className="color-picker">
                {SOLID_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`color-btn ${!gradient && bgColor === c ? "selected" : ""}`}
                    style={{ backgroundColor: c }}
                    onClick={() => { setBgColor(c); setGradient(""); }}
                  />
                ))}
              </div>
              <label>Gradients</label>
              <div className="color-picker">
                {GRADIENTS.map((g, i) => (
                  <button
                    key={i}
                    className={`color-btn gradient-btn ${gradient === g ? "selected" : ""}`}
                    style={{ background: g }}
                    onClick={() => setGradient(g)}
                  />
                ))}
              </div>
              <label className="file-upload-btn">
                {imagePreview ? "Change Photo" : "Add Photo"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageSelect}
                />
              </label>
            </div>
          )}

          {/* Text style tab */}
          {activeTab === "text" && (
            <div className="story-customize-section">
              <label>Text Color</label>
              <div className="color-picker">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`color-btn ${fontColor === c ? "selected" : ""}`}
                    style={{ backgroundColor: c, border: c === "#ffffff" ? "2px solid #ccc" : "none" }}
                    onClick={() => setFontColor(c)}
                  />
                ))}
              </div>
              <label>Text Position</label>
              <div className="story-btn-group">
                {["top", "center", "bottom"].map((pos) => (
                  <button
                    key={pos}
                    className={textPosition === pos ? "active" : ""}
                    onClick={() => setTextPosition(pos)}
                  >
                    {pos.charAt(0).toUpperCase() + pos.slice(1)}
                  </button>
                ))}
              </div>
              <label>Alignment</label>
              <div className="story-btn-group">
                <button className={textAlign === "left" ? "active" : ""} onClick={() => setTextAlign("left")}>
                  <FaAlignLeft />
                </button>
                <button className={textAlign === "center" ? "active" : ""} onClick={() => setTextAlign("center")}>
                  <FaAlignCenter />
                </button>
                <button className={textAlign === "right" ? "active" : ""} onClick={() => setTextAlign("right")}>
                  <FaAlignRight />
                </button>
              </div>
              <div className="story-btn-group">
                <button
                  className={fontWeight === "bold" ? "active" : ""}
                  onClick={() => setFontWeight(fontWeight === "bold" ? "normal" : "bold")}
                >
                  <FaBold />
                </button>
                <button
                  className={fontStyle === "italic" ? "active" : ""}
                  onClick={() => setFontStyle(fontStyle === "italic" ? "normal" : "italic")}
                >
                  <FaItalic />
                </button>
              </div>
            </div>
          )}

          {/* Font tab */}
          {activeTab === "font" && (
            <div className="story-customize-section">
              <label>Font Family</label>
              <div className="story-font-list">
                {FONTS.map((f) => (
                  <button
                    key={f.value}
                    className={`story-font-btn ${fontFamily === f.value ? "active" : ""}`}
                    style={{ fontFamily: f.value }}
                    onClick={() => setFontFamily(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <label>Font Size</label>
              <div className="story-btn-group">
                {FONT_SIZES.map((s) => (
                  <button
                    key={s}
                    className={fontSize === s ? "active" : ""}
                    onClick={() => setFontSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className="btn-primary" onClick={handleCreate} disabled={loading || (!text && !storyImage)}>
            {loading ? "Sharing..." : "Share to Story"}
          </button>
        </div>
      </div>
    </div>
  );
}
