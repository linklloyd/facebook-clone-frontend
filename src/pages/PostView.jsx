import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import Post from "../components/Post";
import api from "../utils/api";

export default function PostView() {
  const { id } = useParams();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const notifType = location.state?.notifType;
  const showComments = ["comment_post", "like_comment", "mention_comment"].includes(notifType);

  useEffect(() => {
    api
      .get(`/posts/single/${id}`)
      .then((res) => setPost(res.data))
      .catch((err) => setError(err.response?.data?.message || "Post not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    window.location.href = "/";
  };

  if (loading) return <div className="post-view-page"><p className="empty-text">Loading...</p></div>;
  if (error) return (
    <div className="post-view-page">
      <div className="post-view-container">
        <Link to="/" className="post-view-back"><FaChevronLeft /> Back to Feed</Link>
        <p className="empty-text">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="post-view-page">
      <div className="post-view-container">
        <Link to="/" className="post-view-back"><FaChevronLeft /> Back to Feed</Link>
        {post && (
          <Post
            post={post}
            onDelete={handleDelete}
            initialShowComments={showComments}
          />
        )}
      </div>
    </div>
  );
}
