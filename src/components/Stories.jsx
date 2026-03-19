import { useState, useEffect } from "react";
import { FaPlus, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function Stories() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showViewer, setShowViewer] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [newStory, setNewStory] = useState({ text: "", backgroundColor: "#1877f2" });
  const [storyImage, setStoryImage] = useState(null);

  useEffect(() => {
    api.get("/stories/feed").then((r) => setStoryGroups(r.data));
  }, []);

  const handleCreateStory = async () => {
    const formData = new FormData();
    if (newStory.text) formData.append("text", newStory.text);
    formData.append("backgroundColor", newStory.backgroundColor);
    if (storyImage) formData.append("image", storyImage);
    if (!newStory.text && !storyImage) return;
    await api.post("/stories", formData);
    const res = await api.get("/stories/feed");
    setStoryGroups(res.data);
    setShowCreate(false);
    setNewStory({ text: "", backgroundColor: "#1877f2" });
    setStoryImage(null);
  };

  const openStory = (groupIndex) => {
    setShowViewer(groupIndex);
    setCurrentStoryIndex(0);
    const story = storyGroups[groupIndex].stories[0];
    api.put(`/stories/${story._id}/view`);
  };

  const COLORS = ["#1877f2", "#e74c3c", "#2ecc71", "#9b59b6", "#f39c12", "#1abc9c"];

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
            style={
              group.stories[0].image
                ? { backgroundImage: `url(${group.stories[0].image})` }
                : { backgroundColor: group.stories[0].backgroundColor }
            }
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
              <p className="story-preview-text">{group.stories[0].text}</p>
            )}
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal story-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Story</h3>
              <button onClick={() => setShowCreate(false)}><FaTimes /></button>
            </div>
            <div
              className="story-preview"
              style={{ backgroundColor: newStory.backgroundColor }}
            >
              {storyImage && (
                <img src={URL.createObjectURL(storyImage)} alt="" />
              )}
              {newStory.text && <p>{newStory.text}</p>}
            </div>
            <div className="story-form">
              <textarea
                placeholder="Write something..."
                value={newStory.text}
                onChange={(e) => setNewStory({ ...newStory, text: e.target.value })}
              />
              <div className="color-picker">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className={`color-btn ${newStory.backgroundColor === c ? "selected" : ""}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setNewStory({ ...newStory, backgroundColor: c })}
                  />
                ))}
              </div>
              <label className="file-upload-btn">
                Add Photo
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setStoryImage(e.target.files[0])}
                />
              </label>
              <button className="btn-primary" onClick={handleCreateStory}>
                Share to Story
              </button>
            </div>
          </div>
        </div>
      )}

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
                  style={
                    story.image
                      ? { backgroundImage: `url(${story.image})` }
                      : { backgroundColor: story.backgroundColor }
                  }
                >
                  {story.text && <p className="story-text">{story.text}</p>}
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
