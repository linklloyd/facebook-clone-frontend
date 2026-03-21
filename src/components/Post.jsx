import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaComment, FaTrash, FaThumbtack, FaReply, FaChevronLeft, FaChevronRight, FaTimes, FaPaperPlane } from "react-icons/fa";

// Prevent double-click on async actions
function useLock() {
  const lock = useRef(false);
  return useCallback((fn) => async (...args) => {
    if (lock.current) return;
    lock.current = true;
    try { return await fn(...args); }
    finally { lock.current = false; }
  }, []);
}
import { format } from "timeago.js";
import { useAuth } from "../context/AuthContext";
import MentionInput from "./MentionInput";
import renderMentions from "../utils/renderMentions";
import api from "../utils/api";

const REACTIONS = [
  { type: "like",  emoji: "👍", label: "Like",  color: "#1877f2" },
  { type: "love",  emoji: "❤️", label: "Love",  color: "#f33e58" },
  { type: "haha",  emoji: "😂", label: "Haha",  color: "#f7b125" },
  { type: "wow",   emoji: "😮", label: "Wow",   color: "#f7b125" },
  { type: "sad",   emoji: "😢", label: "Sad",   color: "#f7b125" },
  { type: "angry", emoji: "😠", label: "Angry", color: "#e9710f" },
  { type: "dih", emoji: "🍆", label: "Dih", color: "#8e0fe9" },
  { type: "fire", emoji: "🔥", label: "Fire", color: "#e9710f" },

];

function getReactionInfo(type) {
  return REACTIONS.find((r) => r.type === type) || REACTIONS[0];
}

/* ---- Comment component (used for both top-level and replies) ---- */
function CommentItem({ c, postId, user, isReply, onDelete, onUpdate }) {
  const guard = useLock();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState(c.replies || []);
  const [commentReactions, setCommentReactions] = useState(c.reactions || []);
  const pickerTimeout = useRef(null);
  const hidePickerTimeout = useRef(null);

  const myCommentReaction = commentReactions.find(
    (r) => (r.user?._id || r.user)?.toString() === user?._id?.toString()
  );
  const myCommentReactionInfo = myCommentReaction ? getReactionInfo(myCommentReaction.type) : null;

  const handleCommentReact = guard(async (type) => {
    setShowReactionPicker(false);
    try {
      const res = await api.put(`/posts/${postId}/comments/${c._id}/react`, { reaction: type });
      setCommentReactions(res.data.reactions || []);
    } catch (err) {
      console.error(err);
    }
  });

  const handleCommentLikeClick = () => {
    if (myCommentReaction) {
      handleCommentReact(myCommentReaction.type);
    } else {
      handleCommentReact("like");
    }
  };

  const handleReply = guard(async () => {
    if (!replyText.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comments/${c._id}/replies`, {
        text: replyText,
      });
      setReplies((prev) => [...prev, { ...res.data, replies: [] }]);
      setReplyText("");
      setShowReplies(true);
      setShowReplyInput(false);
    } catch (err) {
      console.error(err);
    }
  });

  const reactionSummary = commentReactions.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});
  const topCommentReactions = Object.entries(reactionSummary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => getReactionInfo(type));

  return (
    <div className={`comment ${isReply ? "comment-reply" : ""}`}>
      <Link to={`/profile/${c.author._id}`}>
        <img
          src={c.author.profilePicture || "/default-avatar.svg"}
          alt=""
          className="avatar-small"
        />
      </Link>
      <div className="comment-body">
        <div className="comment-content">
          <Link to={`/profile/${c.author._id}`} className="comment-author">
            {c.author.firstName} {c.author.lastName}
          </Link>
          <p>{renderMentions(c.text)}</p>
          {/* Reaction badge on comment bubble */}
          {commentReactions.length > 0 && (
            <span className="comment-reaction-badge">
              {topCommentReactions.map((r) => (
                <span key={r.type}>{r.emoji}</span>
              ))}
              {commentReactions.length > 1 && <span>{commentReactions.length}</span>}
            </span>
          )}
        </div>
        <div className="comment-actions-row">
          {/* Like / reaction button with hover picker */}
          <div
            className="comment-react-wrapper"
            onMouseEnter={() => {
              clearTimeout(hidePickerTimeout.current);
              pickerTimeout.current = setTimeout(() => setShowReactionPicker(true), 500);
            }}
            onMouseLeave={() => {
              clearTimeout(pickerTimeout.current);
              hidePickerTimeout.current = setTimeout(() => setShowReactionPicker(false), 400);
            }}
          >
            {showReactionPicker && (
              <div
                className="comment-reaction-picker"
                onMouseEnter={() => clearTimeout(hidePickerTimeout.current)}
                onMouseLeave={() => {
                  hidePickerTimeout.current = setTimeout(() => setShowReactionPicker(false), 300);
                }}
              >
                {REACTIONS.map((r) => (
                  <button key={r.type} onClick={() => handleCommentReact(r.type)} title={r.label}>
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
            <button
              className="comment-action-btn"
              style={myCommentReactionInfo ? { color: myCommentReactionInfo.color, fontWeight: 700 } : {}}
              onClick={handleCommentLikeClick}
            >
              {myCommentReactionInfo ? myCommentReactionInfo.label : "Like"}
            </button>
          </div>
          {!isReply && (
            <button className="comment-action-btn" onClick={() => setShowReplyInput(!showReplyInput)}>
              Reply
            </button>
          )}
          <span className="comment-time">{format(c.createdAt)}</span>
        </div>

        {/* Replies section */}
        {!isReply && replies.length > 0 && (
          <>
            {!showReplies && (
              <button className="show-replies-btn" onClick={() => setShowReplies(true)}>
                <FaReply size={11} /> {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </button>
            )}
            {showReplies && replies.map((r) => (
              <CommentItem
                key={r._id}
                c={r}
                postId={postId}
                user={user}
                isReply={true}
                onDelete={(rid) => setReplies((prev) => prev.filter((x) => x._id !== rid))}
              />
            ))}
          </>
        )}

        {/* Reply input */}
        {showReplyInput && (
          <div className="comment-form reply-form">
            <img src={user?.profilePicture || "/default-avatar.svg"} alt="" className="avatar-small" />
            <MentionInput
              value={replyText}
              onChange={setReplyText}
              placeholder={`Reply to ${c.author.firstName}...`}
              onSubmit={handleReply}
              autoFocus
            />
            <button
              className="comment-send-btn"
              onClick={handleReply}
              disabled={!replyText.trim()}
              title="Send"
            >
              <FaPaperPlane />
            </button>
          </div>
        )}
      </div>
      {c.author._id === user?._id && (
        <button
          className="delete-comment-btn"
          onClick={() => onDelete(c._id)}
          title="Delete"
        >
          <FaTrash size={11} />
        </button>
      )}
    </div>
  );
}

/* ---- Post Media Gallery (images + videos) ---- */
function PostMedia({ images, fallbackImage, mediaTypes = [] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  // Merge old single image with new images array
  const allMedia = images && images.length > 0
    ? images
    : fallbackImage ? [fallbackImage] : [];

  if (allMedia.length === 0) return null;

  const isVideo = (idx) => {
    if (mediaTypes[idx] === "video") return true;
    const src = allMedia[idx] || "";
    return src.startsWith("data:video/") || /\.(mp4|webm|mov|avi)$/i.test(src);
  };

  const openLightbox = (idx) => {
    if (isVideo(idx)) return; // Videos play inline, no lightbox
    setLightboxIdx(idx);
    setLightboxOpen(true);
  };

  // Filter only images for lightbox
  const imageOnly = allMedia.filter((_, i) => !isVideo(i));

  if (allMedia.length === 1) {
    if (isVideo(0)) {
      return (
        <video
          src={allMedia[0]}
          controls
          className="post-video"
          preload="metadata"
          playsInline
        />
      );
    }
    return (
      <>
        <img src={allMedia[0]} alt="" className="post-image" onClick={() => openLightbox(0)} style={{ cursor: "pointer" }} />
        {lightboxOpen && (
          <ImageLightbox images={imageOnly} startIdx={lightboxIdx} onClose={() => setLightboxOpen(false)} />
        )}
      </>
    );
  }

  const gridClass = `post-image-grid grid-${Math.min(allMedia.length, 5)}`;
  return (
    <>
      <div className={gridClass}>
        {allMedia.slice(0, 5).map((src, idx) => (
          <div key={idx} className={`grid-img-wrapper ${idx === 0 ? "grid-main" : ""}`} onClick={() => openLightbox(idx)}>
            {isVideo(idx) ? (
              <video src={src} controls preload="metadata" playsInline />
            ) : (
              <img src={src} alt="" />
            )}
            {idx === 4 && allMedia.length > 5 && (
              <div className="grid-more-overlay">+{allMedia.length - 5}</div>
            )}
          </div>
        ))}
      </div>
      {lightboxOpen && (
        <ImageLightbox images={imageOnly} startIdx={lightboxIdx} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}

/* ---- Image Lightbox ---- */
function ImageLightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const prev = () => setIdx((i) => (i > 0 ? i - 1 : images.length - 1));
  const next = () => setIdx((i) => (i < images.length - 1 ? i + 1 : 0));

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}><FaTimes /></button>
        {images.length > 1 && (
          <button className="lightbox-prev" onClick={prev}><FaChevronLeft /></button>
        )}
        <img src={images[idx]} alt="" className="lightbox-img" />
        {images.length > 1 && (
          <button className="lightbox-next" onClick={next}><FaChevronRight /></button>
        )}
        {images.length > 1 && (
          <div className="lightbox-counter">{idx + 1} / {images.length}</div>
        )}
      </div>
    </div>
  );
}

/* ---- Main Post component ---- */
export default function Post({ post, onDelete, onPin, isPinned, initialShowComments }) {
  const guard = useLock();
  const { user } = useAuth();
  const [reactions, setReactions] = useState(post.reactions || []);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(initialShowComments || false);
  const [showPicker, setShowPicker] = useState(false);
  const hoverTimeout = useRef(null);
  const hideTimeout = useRef(null);

  const myReaction = reactions.find(
    (r) => (r.user?._id || r.user)?.toString() === user?._id?.toString()
  );
  const myReactionInfo = myReaction ? getReactionInfo(myReaction.type) : null;

  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});
  const topReactions = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => getReactionInfo(type));

  const totalCommentCount = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length || 0), 0
  );

  const handleReact = guard(async (type) => {
    setShowPicker(false);
    try {
      const res = await api.put(`/posts/${post._id}/like`, { reaction: type });
      setReactions(res.data.reactions || []);
    } catch (err) {
      console.error(err);
    }
  });

  const handleLikeClick = () => {
    if (myReaction) handleReact(myReaction.type);
    else handleReact("like");
  };

  const handleMouseEnterBtn = () => {
    clearTimeout(hideTimeout.current);
    hoverTimeout.current = setTimeout(() => setShowPicker(true), 500);
  };
  const handleMouseLeaveBtn = () => {
    clearTimeout(hoverTimeout.current);
    hideTimeout.current = setTimeout(() => setShowPicker(false), 400);
  };
  const handleMouseEnterPicker = () => clearTimeout(hideTimeout.current);
  const handleMouseLeavePicker = () => {
    hideTimeout.current = setTimeout(() => setShowPicker(false), 300);
  };

  const handleComment = guard(async () => {
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/posts/${post._id}/comments`, { text: commentText });
      setComments([...comments, { ...res.data, replies: [] }]);
      setCommentText("");
      setShowComments(true);
    } catch (err) {
      console.error(err);
    }
  });

  const handleDelete = guard(async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      onDelete?.(post._id);
    } catch (err) {
      console.error(err);
    }
  });

  const handleDeleteComment = guard(async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.delete(`/posts/${post._id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error(err);
    }
  });

  const handlePin = guard(async () => {
    try {
      const res = await api.put(`/posts/${post._id}/pin`);
      onPin?.(post._id, res.data.pinned);
    } catch (err) {
      console.error(err);
    }
  });

  return (
    <div className={`post-card ${isPinned ? "pinned-post" : ""}`}>
      {isPinned && (
        <div className="pinned-label">
          <FaThumbtack /> Pinned Post
        </div>
      )}
      <div className="post-header">
        <Link to={`/profile/${post.author._id}`} className="post-author">
          <img src={post.author.profilePicture || "/default-avatar.svg"} alt="" className="avatar-medium" />
          <div>
            <span className="author-name">{post.author.firstName} {post.author.lastName}</span>
            {post.feeling && <span className="post-feeling"> is feeling {post.feeling}</span>}
            <span className="post-time">{format(post.createdAt)}</span>
          </div>
        </Link>
        <div className="post-header-actions">
          {post.author._id === user?._id && (
            <>
              <button className="pin-btn" onClick={handlePin} title={isPinned ? "Unpin" : "Pin"}>
                <FaThumbtack style={isPinned ? { color: "#1877f2" } : {}} />
              </button>
              <button className="delete-btn" onClick={handleDelete} title="Delete post">
                <FaTrash />
              </button>
            </>
          )}
        </div>
      </div>

      {post.text && <p className="post-text">{renderMentions(post.text)}</p>}
      <PostMedia images={post.images} fallbackImage={post.image} mediaTypes={post.mediaTypes} />

      <div className="post-stats">
        {reactions.length > 0 && (
          <span className="likes-count">
            {topReactions.map((r) => (
              <span key={r.type} className="reaction-emoji-small">{r.emoji}</span>
            ))}
            <span>{reactions.length}</span>
            <div className="reaction-tooltip">
              {reactions.slice(0, 10).map((r, i) => {
                const name = r.user?.firstName ? `${r.user.firstName} ${r.user.lastName}` : "Someone";
                const info = getReactionInfo(r.type);
                return <span key={i} className="reaction-tooltip-name">{info.emoji} {name}</span>;
              })}
              {reactions.length > 10 && (
                <span className="reaction-tooltip-name">...and {reactions.length - 10} more</span>
              )}
            </div>
          </span>
        )}
        {totalCommentCount > 0 && (
          <span className="comments-count" onClick={() => setShowComments(!showComments)}>
            {totalCommentCount} comment{totalCommentCount !== 1 && "s"}
          </span>
        )}
      </div>

      <hr />
      <div className="post-actions">
        <div
          className="reaction-wrapper"
          onMouseEnter={handleMouseEnterBtn}
          onMouseLeave={handleMouseLeaveBtn}
        >
          {showPicker && (
            <div
              className="reaction-picker"
              onMouseEnter={handleMouseEnterPicker}
              onMouseLeave={handleMouseLeavePicker}
            >
              {REACTIONS.map((r) => (
                <button key={r.type} className="reaction-option" onClick={() => handleReact(r.type)} title={r.label}>
                  <span className="reaction-option-emoji">{r.emoji}</span>
                  <span className="reaction-option-label">{r.label}</span>
                </button>
              ))}
            </div>
          )}
          <button
            className={`post-action-btn ${myReaction ? "reacted" : ""}`}
            style={myReactionInfo ? { color: myReactionInfo.color } : {}}
            onClick={handleLikeClick}
          >
            <span className="my-reaction-emoji">{myReactionInfo ? myReactionInfo.emoji : "👍"}</span>
            {myReactionInfo ? myReactionInfo.label : "Like"}
          </button>
        </div>
        <button className="post-action-btn" onClick={() => setShowComments(!showComments)}>
          <FaComment /> Comment
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {comments.map((c) => (
            <CommentItem
              key={c._id}
              c={c}
              postId={post._id}
              user={user}
              isReply={false}
              onDelete={handleDeleteComment}
            />
          ))}
          <div className="comment-form">
            <img src={user?.profilePicture || "/default-avatar.svg"} alt="" className="avatar-small" />
            <MentionInput
              value={commentText}
              onChange={setCommentText}
              placeholder="Write a comment... (type @ to mention)"
              onSubmit={handleComment}
            />
            <button
              className="comment-send-btn"
              onClick={handleComment}
              disabled={!commentText.trim()}
              title="Send"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
