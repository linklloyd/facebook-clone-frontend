import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUserFriends, FaFacebookMessenger, FaBookmark, FaUsers, FaBolt, FaStore } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useLanguage } from "../context/LanguageContext";
import CreatePost from "../components/CreatePost";
import Post from "../components/Post";
import Stories from "../components/Stories";
import { PostSkeleton } from "../components/Skeleton";
import api from "../utils/api";

export default function Home() {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    loadPosts(1);
    api.get("/users/suggestions/people").then((r) => setSuggestions(r.data));
  }, []);

  const loadPosts = async (p) => {
    try {
      const res = await api.get(`/posts/feed?page=${p}`);
      if (p === 1) {
        setPosts(res.data);
      } else {
        setPosts((prev) => [...prev, ...res.data]);
      }
      setHasMore(res.data.length === 10);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handlePostCreated = (post) => {
    setPosts([{ ...post, comments: [] }, ...posts]);
  };

  const handleDelete = (postId) => {
    setPosts(posts.filter((p) => p._id !== postId));
  };

  const onlineFriends = user?.friends?.filter((f) =>
    onlineUsers.includes(f._id)
  ) || [];

  return (
    <div className="home-page">
      <div className="home-left">
        <Link to={`/profile/${user?._id}`} className="sidebar-item">
          <img
            src={user?.profilePicture || "/default-avatar.svg"}
            alt=""
            className="avatar-small"
          />
          <span>{user?.firstName} {user?.lastName}</span>
        </Link>
        <Link to="/friends" className="sidebar-item">
          <FaUserFriends className="sidebar-icon" />
          <span>{t("friends")}</span>
        </Link>
        <Link to="/messenger" className="sidebar-item">
          <FaFacebookMessenger className="sidebar-icon" />
          <span>{t("messenger")}</span>
        </Link>
        <Link to="/friends" className="sidebar-item">
          <FaUsers className="sidebar-icon" />
          <span>{t("findFriends")}</span>
        </Link>
        <Link to="/activity" className="sidebar-item">
          <FaBolt className="sidebar-icon" />
          <span>{t("activityFeed")}</span>
        </Link>
        <Link to="/marketplace" className="sidebar-item">
          <FaStore className="sidebar-icon" />
          <span>{t("marketplace")}</span>
        </Link>
      </div>

      <div className="home-center">
        <Stories />
        <CreatePost onPostCreated={handlePostCreated} onPostingChange={setIsPosting} />
        {isPosting && (
          <div className="creating-post-placeholder">
            <div className="creating-post-shimmer">
              <div className="shimmer-avatar" />
              <div className="shimmer-lines">
                <div className="shimmer-line" style={{ width: "60%" }} />
                <div className="shimmer-line" style={{ width: "40%" }} />
              </div>
            </div>
            <span className="creating-post-text">{t("creatingPost")}</span>
          </div>
        )}
        {loading ? (
          <PostSkeleton count={3} />
        ) : posts.length === 0 ? (
          <div className="empty-feed">
            <h3>{t("welcomeTitle")}</h3>
            <p>{t("welcomeText")}</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <Post key={post._id} post={post} onDelete={handleDelete} />
            ))}
            {hasMore && (
              <button
                className="load-more"
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  loadPosts(next);
                }}
              >
                {t("loadMore")}
              </button>
            )}
          </>
        )}
      </div>

      <div className="home-right">
        {suggestions.length > 0 && (
          <div className="sidebar-section">
            <h4>{t("peopleYouMayKnow")}</h4>
            {suggestions.map((s) => (
              <Link key={s._id} to={`/profile/${s._id}`} className="suggestion-item">
                <img
                  src={s.profilePicture || "/default-avatar.svg"}
                  alt=""
                  className="avatar-small"
                />
                <span>{s.firstName} {s.lastName}</span>
              </Link>
            ))}
          </div>
        )}
        <div className="sidebar-section">
          <h4>{t("contacts")}</h4>
          {onlineFriends.length === 0 ? (
            <p className="empty-text">{t("noFriendsOnline")}</p>
          ) : (
            onlineFriends.map((f) => (
              <Link key={f._id} to={`/profile/${f._id}`} className="contact-item">
                <div className="contact-avatar">
                  <img
                    src={f.profilePicture || "/default-avatar.svg"}
                    alt=""
                    className="avatar-small"
                  />
                  <span className="online-dot" />
                </div>
                <span>{f.firstName} {f.lastName}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
