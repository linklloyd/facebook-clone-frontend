import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaCheck, FaTimes, FaUserPlus, FaClock } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function Friends() {
  const { user, updateUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [pendingSent, setPendingSent] = useState(new Set());
  const [tab, setTab] = useState("requests");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    loadData();
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadData = async () => {
    const [reqRes, sugRes] = await Promise.all([
      api.get("/users/friend-requests/pending"),
      api.get("/users/suggestions/people"),
    ]);
    setRequests(reqRes.data);
    setSuggestions(sugRes.data);
  };

  const busyRef = useRef(new Set());
  const guard = useCallback((key, fn) => async (...args) => {
    if (busyRef.current.has(key)) return;
    busyRef.current.add(key);
    try { await fn(...args); }
    finally { busyRef.current.delete(key); }
  }, []);

  const handleAccept = async (id) => {
    await guard(`accept-${id}`, async () => {
      await api.put(`/users/friend-request/${id}/accept`);
      setRequests(requests.filter((r) => r._id !== id));
      const res = await api.get("/auth/me");
      updateUser(res.data);
    })();
  };

  const handleDecline = async (id) => {
    await guard(`decline-${id}`, async () => {
      await api.put(`/users/friend-request/${id}/decline`);
      setRequests(requests.filter((r) => r._id !== id));
    })();
  };

  const handleSendRequest = async (userId) => {
    await guard(`send-${userId}`, async () => {
      await api.post(`/users/friend-request/${userId}`);
      setPendingSent((prev) => new Set([...prev, userId]));
    })();
  };

  // Render friend requests section
  const renderRequests = () => (
    <div className="friends-section">
      <h3>Friend Requests</h3>
      {requests.length === 0 ? (
        <p className="empty-text">No pending friend requests</p>
      ) : (
        <div className="friends-grid">
          {requests.map((r) => (
            <div key={r._id} className="friend-card">
              <Link to={`/profile/${r.sender._id}`}>
                <img
                  src={r.sender.profilePicture || "/default-avatar.svg"}
                  alt=""
                  className="friend-card-img"
                />
              </Link>
              <div className="friend-card-info">
                <Link to={`/profile/${r.sender._id}`}>
                  <h4>{r.sender.firstName} {r.sender.lastName}</h4>
                </Link>
                <div className="friend-card-actions">
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => handleAccept(r._id)}
                  >
                    <FaCheck /> Confirm
                  </button>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => handleDecline(r._id)}
                  >
                    <FaTimes /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render suggestions section
  const renderSuggestions = () => (
    <div className="friends-section">
      <h3>People You May Know</h3>
      {suggestions.length === 0 ? (
        <p className="empty-text">No suggestions right now</p>
      ) : (
        <div className="friends-grid">
          {suggestions.map((s) => (
            <div key={s._id} className="friend-card">
              <Link to={`/profile/${s._id}`}>
                <img
                  src={s.profilePicture || "/default-avatar.svg"}
                  alt=""
                  className="friend-card-img"
                />
              </Link>
              <div className="friend-card-info">
                <Link to={`/profile/${s._id}`}>
                  <h4>{s.firstName} {s.lastName}</h4>
                </Link>
                {pendingSent.has(s._id) ? (
                  <button className="btn-pending btn-sm" disabled>
                    <FaClock /> Pending
                  </button>
                ) : (
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => handleSendRequest(s._id)}
                  >
                    <FaUserPlus /> Add Friend
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render all friends section
  const renderAllFriends = () => (
    <div className="friends-section">
      <h3>All Friends ({user?.friends?.length || 0})</h3>
      {!user?.friends?.length ? (
        <p className="empty-text">No friends yet. Add some!</p>
      ) : (
        <div className="friends-grid">
          {user.friends.map((f) => (
            <div key={f._id} className="friend-card">
              <Link to={`/profile/${f._id}`}>
                <img
                  src={f.profilePicture || "/default-avatar.svg"}
                  alt=""
                  className="friend-card-img"
                />
              </Link>
              <div className="friend-card-info">
                <Link to={`/profile/${f._id}`}>
                  <h4>{f.firstName} {f.lastName}</h4>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // On mobile: show all sections stacked, no tabs needed
  if (isMobile) {
    return (
      <div className="friends-page friends-page-mobile">
        <div className="friends-content">
          {requests.length > 0 && renderRequests()}
          {renderSuggestions()}
          {renderAllFriends()}
        </div>
      </div>
    );
  }

  // Desktop: keep tab-based layout
  return (
    <div className="friends-page">
      <div className="friends-sidebar">
        <h2>Friends</h2>
        <button
          className={`sidebar-btn ${tab === "requests" ? "active" : ""}`}
          onClick={() => setTab("requests")}
        >
          Friend Requests {requests.length > 0 && `(${requests.length})`}
        </button>
        <button
          className={`sidebar-btn ${tab === "suggestions" ? "active" : ""}`}
          onClick={() => setTab("suggestions")}
        >
          Suggestions
        </button>
        <button
          className={`sidebar-btn ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          All Friends
        </button>
      </div>

      <div className="friends-content">
        {tab === "requests" && renderRequests()}
        {tab === "suggestions" && renderSuggestions()}
        {tab === "all" && renderAllFriends()}
      </div>
    </div>
  );
}
