import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUserFriends,
  FaFacebookMessenger,
  FaBell,
  FaSearch,
  FaSignOutAlt,
  FaUser,
  FaCaretDown,
  FaFileAlt,
  FaMoon,
  FaSun,
  FaStore,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../utils/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { socket, unreadMessages } = useSocket();
  const { dark, toggleDark } = useTheme();
  const { t, lang, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ users: [], posts: [] });
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileSearch, setMobileSearch] = useState(false);
  const searchRef = useRef();
  const mobileSearchRef = useRef();
  const notifRef = useRef();
  const menuRef = useRef();

  useEffect(() => {
    api.get("/notifications/unread-count").then((r) => setUnreadCount(r.data.count));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      setNotifications((prev) => {
        // Deduplicate by _id — replace if exists, otherwise prepend
        const exists = prev.some((n) => n._id === notif._id);
        if (exists) return prev.map((n) => (n._id === notif._id ? notif : n));
        return [notif, ...prev];
      });
      setUnreadCount((c) => c + 1);
    };
    socket.on("notification", handler);
    return () => socket.off("notification", handler);
  }, [socket]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults({ users: [], posts: [] });
      setShowSearch(false);
      return;
    }
    const enc = encodeURIComponent(q);
    const [usersRes, postsRes] = await Promise.all([
      api.get(`/users/search?q=${enc}`),
      api.get(`/posts/search?q=${enc}`),
    ]);
    setSearchResults({ users: usersRes.data, posts: postsRes.data });
    setShowSearch(true);
  };

  const openNotifications = async () => {
    setShowNotifications(!showNotifications);
    setShowMenu(false);
    if (!showNotifications) {
      const res = await api.get("/notifications");
      setNotifications(res.data);
      await api.put("/notifications/read");
      setUnreadCount(0);
    }
  };

  const getNotifText = (n) => {
    if (!n.sender) return lang === "es" ? "Alguien interactuó con tu contenido" : "Someone interacted with your content";
    const name = `${n.sender.firstName} ${n.sender.lastName}`;
    if (lang === "es") {
      switch (n.type) {
        case "like_post": return `A ${name} le gustó tu publicación`;
        case "comment_post": return `${name} comentó en tu publicación`;
        case "friend_request": return `${name} te envió una solicitud de amistad`;
        case "friend_accepted": return `${name} aceptó tu solicitud de amistad`;
        case "mention_post": return `${name} te mencionó en una publicación`;
        case "mention_comment": return `${name} te mencionó en un comentario`;
        default: return `${name} interactuó con tu contenido`;
      }
    }
    switch (n.type) {
      case "like_post": return `${name} liked your post`;
      case "comment_post": return `${name} commented on your post`;
      case "friend_request": return `${name} sent you a friend request`;
      case "friend_accepted": return `${name} accepted your friend request`;
      case "mention_post": return `${name} mentioned you in a post`;
      case "mention_comment": return `${name} mentioned you in a comment`;
      default: return `${name} interacted with your content`;
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-logo">
          <img src="/favicon.png" alt="Tlacobook" className="nav-logo-icon" />
          <span className="nav-logo-text">tlacobook</span>
        </Link>
        <button className="mobile-search-btn" onClick={() => setMobileSearch(true)}>
          <FaSearch />
        </button>
        <div className="nav-search" ref={searchRef}>
          <FaSearch className="search-icon" />
          <input
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => (searchResults.users.length || searchResults.posts.length) && setShowSearch(true)}
          />
          {showSearch && (searchResults.users.length > 0 || searchResults.posts.length > 0) && (
            <div className="search-dropdown">
              {searchResults.users.length > 0 && (
                <>
                  <div className="search-section-label">People</div>
                  {searchResults.users.map((u) => (
                    <div
                      key={u._id}
                      className="search-result"
                      onClick={() => {
                        navigate(`/profile/${u._id}`);
                        setShowSearch(false);
                        setSearchQuery("");
                        setSearchResults({ users: [], posts: [] });
                      }}
                    >
                      <img
                        src={u.profilePicture || "/default-avatar.svg"}
                        alt=""
                        className="avatar-small"
                      />
                      <span>{u.firstName} {u.lastName}</span>
                    </div>
                  ))}
                </>
              )}
              {searchResults.posts.length > 0 && (
                <>
                  <div className="search-section-label">Posts</div>
                  {searchResults.posts.map((p) => (
                    <div
                      key={p._id}
                      className="search-result"
                      onClick={() => {
                        navigate(`/profile/${p.author._id}`);
                        setShowSearch(false);
                        setSearchQuery("");
                        setSearchResults({ users: [], posts: [] });
                      }}
                    >
                      <FaFileAlt className="search-post-icon" />
                      <div className="search-post-info">
                        <span className="search-post-author">{p.author.firstName} {p.author.lastName}</span>
                        <span className="search-post-text">{p.text.length > 60 ? p.text.slice(0, 60) + "…" : p.text}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="nav-center">
        <Link to="/" className={`nav-tab ${isActive("/") ? "active" : ""}`}>
          <FaHome size={24} />
        </Link>
        <Link to="/friends" className={`nav-tab ${isActive("/friends") ? "active" : ""}`}>
          <FaUserFriends size={24} />
        </Link>
        <Link
          to="/messenger"
          className={`nav-tab ${isActive("/messenger") ? "active" : ""}`}
        >
          <FaFacebookMessenger size={24} />
          {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}
        </Link>
        <Link to="/marketplace" className={`nav-tab ${isActive("/marketplace") ? "active" : ""}`}>
          <FaStore size={24} />
        </Link>
      </div>

      <div className="nav-right">
        <div className="nav-icon-wrapper" ref={notifRef}>
          <button className="nav-icon-btn" onClick={openNotifications}>
            <FaBell size={20} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="dropdown notifications-dropdown">
              <h3>{t("notifications")}</h3>
              {notifications.length === 0 ? (
                <p className="empty-text">{t("noNotifications")}</p>
              ) : (
                notifications.filter((n) => n.sender).map((n) => (
                  <div
                    key={n._id}
                    className={`notif-item ${!n.read ? "unread" : ""}`}
                    onClick={() => {
                      setShowNotifications(false);
                      if (n.type === "friend_request" || n.type === "friend_accepted") {
                        navigate("/friends");
                      } else if (n.reference && ["like_post", "comment_post", "like_comment", "mention_post", "mention_comment"].includes(n.type)) {
                        navigate(`/post/${n.reference}`, { state: { notifType: n.type } });
                      } else {
                        navigate(`/profile/${n.sender._id}`);
                      }
                    }}
                  >
                    <img
                      src={n.sender.profilePicture || "/default-avatar.svg"}
                      alt=""
                      className="avatar-small"
                    />
                    <div className="notif-text-wrapper">
                      <span>{getNotifText(n)}</span>
                      {n.commentPreview && (
                        <span className="notif-comment-preview">"{n.commentPreview}"</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="nav-icon-wrapper" ref={menuRef}>
          <button
            className="nav-icon-btn"
            onClick={() => {
              setShowMenu(!showMenu);
              setShowNotifications(false);
            }}
          >
            <img
              src={user?.profilePicture || "/default-avatar.svg"}
              alt=""
              className="avatar-small"
            />
            <FaCaretDown size={12} />
          </button>
          {showMenu && (
            <div className="dropdown menu-dropdown">
              <Link
                to={`/profile/${user._id}`}
                className="menu-item"
                onClick={() => setShowMenu(false)}
              >
                <FaUser /> {lang === "es" ? "Mi Perfil" : "My Profile"}
              </Link>
              <button className="menu-item" onClick={toggleDark}>
                {dark ? <FaSun /> : <FaMoon />}
                {dark ? (lang === "es" ? "Modo Claro" : "Light Mode") : t("darkMode")}
              </button>
              <div className="menu-item lang-menu-item">
                <span>{t("language")}</span>
                <div className="lang-selector">
                  <button
                    className={`lang-btn ${lang === "en" ? "active" : ""}`}
                    onClick={() => setLanguage("en")}
                  >
                    EN
                  </button>
                  <button
                    className={`lang-btn ${lang === "es" ? "active" : ""}`}
                    onClick={() => setLanguage("es")}
                  >
                    ES
                  </button>
                </div>
              </div>
              <button
                className="menu-item"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <FaSignOutAlt /> {t("logout")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search overlay */}
      {mobileSearch && (
        <div className="mobile-search-overlay" ref={mobileSearchRef}>
          <div className="mobile-search-header">
            <button className="mobile-search-back" onClick={() => { setMobileSearch(false); setSearchQuery(""); setSearchResults({ users: [], posts: [] }); }}>
              <FaSearch />
            </button>
            <input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="mobile-search-results">
            {searchResults.users.map((u) => (
              <div
                key={u._id}
                className="search-result"
                onClick={() => {
                  navigate(`/profile/${u._id}`);
                  setMobileSearch(false);
                  setSearchQuery("");
                  setSearchResults({ users: [], posts: [] });
                }}
              >
                <img src={u.profilePicture || "/default-avatar.svg"} alt="" className="avatar-small" />
                <span>{u.firstName} {u.lastName}</span>
              </div>
            ))}
            {searchResults.posts.map((p) => (
              <div
                key={p._id}
                className="search-result"
                onClick={() => {
                  navigate(`/profile/${p.author._id}`);
                  setMobileSearch(false);
                  setSearchQuery("");
                  setSearchResults({ users: [], posts: [] });
                }}
              >
                <FaFileAlt className="search-post-icon" />
                <div className="search-post-info">
                  <span className="search-post-author">{p.author.firstName} {p.author.lastName}</span>
                  <span className="search-post-text">{p.text.length > 60 ? p.text.slice(0, 60) + "..." : p.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
