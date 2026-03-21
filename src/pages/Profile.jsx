import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaCamera,
  FaMapMarkerAlt,
  FaBriefcase,
  FaHome,
  FaHeart,
  FaUserPlus,
  FaUserCheck,
  FaUserTimes,
  FaEdit,
  FaFacebookMessenger,
  FaLock,
  FaGlobe,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import CreatePost from "../components/CreatePost";
import Post from "../components/Post";
import ImageCropper from "../components/ImageCropper";
import api from "../utils/api";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [friendStatus, setFriendStatus] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [cropImage, setCropImage] = useState(null);
  const [cropType, setCropType] = useState(null);
  const coverRef = useRef();
  const avatarRef = useRef();
  const isMe = me?._id === id;

  useEffect(() => {
    loadProfile();
    loadPosts();
    if (!isMe) checkFriendStatus();
  }, [id]);

  const loadProfile = async () => {
    const res = await api.get(`/users/${id}`);
    setProfile(res.data);
    setEditForm({
      bio: res.data.bio || "",
      city: res.data.city || "",
      hometown: res.data.hometown || "",
      workplace: res.data.workplace || "",
      relationship: res.data.relationship || "",
      isPublicProfile: res.data.isPublicProfile || false,
    });
  };

  const loadPosts = async () => {
    const res = await api.get(`/posts/user/${id}`);
    setPosts(res.data);
  };

  const checkFriendStatus = async () => {
    if (me?.friends?.some((f) => (f._id || f) === id)) {
      setFriendStatus("friends");
      return;
    }
    try {
      const res = await api.get("/users/friend-requests/pending");
      const sent = res.data.find(
        (r) => r.sender._id === me?._id || r.sender === me?._id
      );
      if (sent) {
        setFriendStatus("pending_sent");
        setRequestId(sent._id);
        return;
      }
      const received = res.data.find(
        (r) => r.sender._id === id || r.sender === id
      );
      if (received) {
        setFriendStatus("pending_received");
        setRequestId(received._id);
        return;
      }
    } catch {}
    setFriendStatus("none");
  };

  const handleFriendAction = async () => {
    if (friendStatus === "none") {
      await api.post(`/users/friend-request/${id}`);
      setFriendStatus("pending_sent");
    } else if (friendStatus === "pending_received" && requestId) {
      await api.put(`/users/friend-request/${requestId}/accept`);
      setFriendStatus("friends");
      loadProfile();
    } else if (friendStatus === "friends") {
      await api.delete(`/users/friend/${id}`);
      setFriendStatus("none");
      loadProfile();
    }
  };

  const handleMessage = async () => {
    const res = await api.post("/messages/conversations", { receiverId: id });
    navigate("/messenger");
  };

  const handleUpdateProfile = async () => {
    const res = await api.put("/users", editForm);
    setProfile(res.data);
    if (isMe) updateUser(res.data);
    setEditing(false);
  };

  const handleFileSelected = (type, file) => {
    setCropImage(file);
    setCropType(type);
  };

  const handleCropDone = async (blob) => {
    const formData = new FormData();
    formData.append("image", blob, "cropped.jpg");
    const res = await api.post(`/users/${cropType}`, formData);
    setProfile((p) => ({ ...p, ...res.data }));
    if (isMe) updateUser(res.data);
    setCropImage(null);
    setCropType(null);
  };

  const handleUpload = async (type, file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await api.post(`/users/${type}`, formData);
    setProfile((p) => ({ ...p, ...res.data }));
    if (isMe) updateUser(res.data);
  };

  if (!profile) return <div className="loading-spinner"><div className="spinner-circle" /></div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="cover-photo" onClick={() => isMe && coverRef.current.click()}>
          {profile.coverPicture ? (
            <img src={profile.coverPicture} alt="" />
          ) : (
            <div className="cover-placeholder" />
          )}
          {isMe && (
            <>
              <button className="cover-edit-btn">
                <FaCamera /> Edit Cover Photo
              </button>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  if (e.target.files[0]) handleFileSelected("cover-picture", e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </>
          )}
        </div>
        <div className="profile-info-bar">
          <div className="profile-avatar-wrapper">
            <img
              src={profile.profilePicture || "/default-avatar.svg"}
              alt=""
              className="profile-avatar"
              onClick={() => isMe && avatarRef.current.click()}
            />
            {isMe && (
              <>
                <button className="avatar-edit-btn">
                  <FaCamera />
                </button>
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    if (e.target.files[0]) handleFileSelected("profile-picture", e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>
          <div className="profile-name-section">
            <h1>
              {profile.firstName} {profile.lastName}
            </h1>
            <span className="friend-count">
              {profile.friends?.length || 0} friends
            </span>
          </div>
          <div className="profile-actions">
            {isMe ? (
              <button className="btn-secondary" onClick={() => setEditing(true)}>
                <FaEdit /> Edit Profile
              </button>
            ) : (
              <>
                <button
                  className={`btn-${friendStatus === "friends" ? "secondary" : "primary"}`}
                  onClick={handleFriendAction}
                >
                  {friendStatus === "none" && (
                    <>
                      <FaUserPlus /> Add Friend
                    </>
                  )}
                  {friendStatus === "pending_sent" && "Request Sent"}
                  {friendStatus === "pending_received" && (
                    <>
                      <FaUserCheck /> Accept Request
                    </>
                  )}
                  {friendStatus === "friends" && (
                    <>
                      <FaUserTimes /> Unfriend
                    </>
                  )}
                </button>
                {friendStatus === "friends" && (
                  <button className="btn-primary" onClick={handleMessage}>
                    <FaFacebookMessenger /> Message
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-left-col">
          <div className="profile-card">
            <h3>Intro</h3>
            {profile.bio && <p className="bio">{profile.bio}</p>}
            {profile.workplace && (
              <div className="info-item">
                <FaBriefcase /> Works at {profile.workplace}
              </div>
            )}
            {profile.city && (
              <div className="info-item">
                <FaMapMarkerAlt /> Lives in {profile.city}
              </div>
            )}
            {profile.hometown && (
              <div className="info-item">
                <FaHome /> From {profile.hometown}
              </div>
            )}
            {profile.relationship && (
              <div className="info-item">
                <FaHeart /> {profile.relationship}
              </div>
            )}
          </div>
          <div className="profile-card">
            <div className="friends-card-header">
              <h3>Friends</h3>
              <span className="friends-total-count">{profile.friends?.length || 0} friends</span>
            </div>
            <div className="friends-grid">
              {profile.friends?.slice(0, 9).map((f) => (
                <Link key={f._id} to={`/profile/${f._id}`} className="friend-thumb">
                  <img
                    src={f.profilePicture || "/default-avatar.svg"}
                    alt=""
                  />
                  <span>{f.firstName}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-right-col">
          {profile.isPrivate && !isMe && (
            <div className="private-profile-msg">
              <FaLock size={24} />
              <h3>This profile is private</h3>
              <p>Add {profile.firstName} as a friend to see their posts.</p>
            </div>
          )}
          {isMe && <CreatePost onPostCreated={(p) => setPosts([{ ...p, comments: [] }, ...posts])} />}
          {/* Pinned post first */}
          {profile.pinnedPost && posts.find((p) => p._id === profile.pinnedPost) && (
            <Post
              key={`pinned-${profile.pinnedPost}`}
              post={posts.find((p) => p._id === profile.pinnedPost)}
              isPinned={true}
              onDelete={(id) => {
                setPosts(posts.filter((p) => p._id !== id));
                setProfile((pr) => ({ ...pr, pinnedPost: null }));
              }}
              onPin={(postId, pinned) => {
                setProfile((pr) => ({ ...pr, pinnedPost: pinned ? postId : null }));
              }}
            />
          )}
          {/* Rest of posts (skip pinned) */}
          {posts
            .filter((p) => p._id !== profile.pinnedPost)
            .map((post) => (
              <Post
                key={post._id}
                post={post}
                onDelete={(id) => setPosts(posts.filter((p) => p._id !== id))}
                onPin={(postId, pinned) => {
                  setProfile((pr) => ({ ...pr, pinnedPost: pinned ? postId : null }));
                }}
              />
            ))}
          {posts.length === 0 && (
            <div className="empty-feed">
              <p>No posts yet.</p>
            </div>
          )}
        </div>
      </div>

      {cropImage && (
        <ImageCropper
          image={cropImage}
          shape={cropType === "profile-picture" ? "circle" : "rectangle"}
          onCrop={handleCropDone}
          onCancel={() => {
            setCropImage(null);
            setCropType(null);
          }}
        />
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button onClick={() => setEditing(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <label>Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
                maxLength={200}
                placeholder="Tell us about yourself"
              />
              <label>City</label>
              <input
                value={editForm.city}
                onChange={(e) =>
                  setEditForm({ ...editForm, city: e.target.value })
                }
                placeholder="Current city"
              />
              <label>Hometown</label>
              <input
                value={editForm.hometown}
                onChange={(e) =>
                  setEditForm({ ...editForm, hometown: e.target.value })
                }
                placeholder="Hometown"
              />
              <label>Workplace</label>
              <input
                value={editForm.workplace}
                onChange={(e) =>
                  setEditForm({ ...editForm, workplace: e.target.value })
                }
                placeholder="Workplace"
              />
              <label>Relationship</label>
              <select
                value={editForm.relationship}
                onChange={(e) =>
                  setEditForm({ ...editForm, relationship: e.target.value })
                }
              >
                <option value="">Select</option>
                <option>Single</option>
                <option>In a relationship</option>
                <option>Married</option>
                <option>Complicated</option>
              </select>
              <label>Profile Privacy</label>
              <div
                className="privacy-toggle"
                onClick={() =>
                  setEditForm({ ...editForm, isPublicProfile: !editForm.isPublicProfile })
                }
              >
                <div className={`toggle-switch ${editForm.isPublicProfile ? "on" : ""}`}>
                  <div className="toggle-knob" />
                </div>
                <span>
                  {editForm.isPublicProfile ? (
                    <><FaGlobe /> Public — anyone can see your posts</>
                  ) : (
                    <><FaLock /> Private — only friends can see your posts</>
                  )}
                </span>
              </div>
              <button className="btn-primary" onClick={handleUpdateProfile}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
