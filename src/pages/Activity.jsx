import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaThumbsUp, FaComment, FaUserCheck, FaFileAlt } from "react-icons/fa";
import { format } from "timeago.js";
import api from "../utils/api";

const ICONS = {
  like_post: { icon: FaThumbsUp, color: "#1877f2", text: "liked a post" },
  comment_post: { icon: FaComment, color: "#44bd63", text: "commented on a post" },
  friend_accepted: { icon: FaUserCheck, color: "#1877f2", text: "became friends with" },
  new_post: { icon: FaFileAlt, color: "#f7b125", text: "shared a new post" },
};

export default function Activity() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadActivity(1);
  }, []);

  const loadActivity = async (p) => {
    try {
      const res = await api.get(`/activity?page=${p}`);
      if (p === 1) {
        setFeed(res.data);
      } else {
        setFeed((prev) => [...prev, ...res.data]);
      }
      setHasMore(res.data.length === 20);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getActivityInfo = (item) => ICONS[item.activityType] || ICONS.new_post;

  return (
    <div className="activity-page">
      <div className="activity-container">
        <h2>Activity Feed</h2>
        <p className="activity-subtitle">See what your friends have been up to</p>

        {loading ? (
          <div className="loading-spinner"><div className="spinner-circle" /></div>
        ) : feed.length === 0 ? (
          <div className="empty-feed">
            <p>No activity yet. Add friends to see their activity!</p>
          </div>
        ) : (
          <div className="activity-list">
            {feed.map((item) => {
              const info = getActivityInfo(item);
              const Icon = info.icon;
              return (
                <div key={item._id} className="activity-item">
                  <div className="activity-avatar">
                    <Link to={`/profile/${item.user._id}`}>
                      <img
                        src={item.user.profilePicture || "/default-avatar.svg"}
                        alt=""
                        className="avatar-medium"
                      />
                    </Link>
                    <div className="activity-icon" style={{ backgroundColor: info.color }}>
                      <Icon size={12} color="#fff" />
                    </div>
                  </div>
                  <div className="activity-content">
                    <p>
                      <Link to={`/profile/${item.user._id}`} className="activity-name">
                        {item.user.firstName} {item.user.lastName}
                      </Link>{" "}
                      {info.text}
                      {item.activityType === "friend_accepted" && item.target && (
                        <>
                          {" "}
                          <Link to={`/profile/${item.target._id}`} className="activity-name">
                            {item.target.firstName} {item.target.lastName}
                          </Link>
                        </>
                      )}
                      {item.activityType === "new_post" && item.postText && (
                        <span className="activity-post-preview">
                          : "{item.postText.length > 60 ? item.postText.slice(0, 60) + "..." : item.postText}"
                        </span>
                      )}
                    </p>
                    <span className="activity-time">{format(item.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && !loading && (
          <button
            className="load-more"
            onClick={() => {
              const next = page + 1;
              setPage(next);
              loadActivity(next);
            }}
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
