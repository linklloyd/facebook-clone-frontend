import { useState, useEffect, useRef, useCallback } from "react";
import { FaPaperPlane, FaSearch, FaSmile, FaEdit, FaUsers, FaCheck, FaCheckDouble, FaArrowLeft, FaCog, FaTimes, FaSignOutAlt, FaCamera, FaImage } from "react-icons/fa";
import { format } from "timeago.js";
import EmojiPicker from "emoji-picker-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { ConversationSkeleton } from "../components/Skeleton";
import api from "../utils/api";

export default function Messenger() {
  const { user } = useAuth();
  const { socket, onlineUsers, markConvRead } = useSocket();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [readReceipts, setReadReceipts] = useState({});
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [chatImage, setChatImage] = useState(null);
  const [chatImagePreview, setChatImagePreview] = useState(null);
  const messagesEndRef = useRef();
  const typingTimeoutRef = useRef();
  const groupPhotoRef = useRef();
  const chatImageRef = useRef();
  const sendLock = useRef(false);

  useEffect(() => {
    api.get("/messages/conversations").then((r) => {
      setConversations(r.data);
      setConvLoading(false);
      // If navigated from marketplace with a conversation to open
      if (location.state?.openConversation) {
        const conv = location.state.openConversation;
        // Add to list if not already there
        if (!r.data.find((c) => c._id === conv._id)) {
          setConversations((prev) => [conv, ...prev]);
        }
        openChat(conv);
        // Clear the state so it doesn't re-open on re-render
        window.history.replaceState({}, document.title);
      }
    });
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleRead = ({ conversationId, readBy }) => {
      setReadReceipts((prev) => ({ ...prev, [conversationId]: readBy }));
    };
    socket.on("messagesRead", handleRead);
    return () => socket.off("messagesRead", handleRead);
  }, [socket]);

  const startNewChat = async (friendId) => {
    const res = await api.post("/messages/conversations", { receiverId: friendId });
    const conv = res.data;
    if (!conversations.find((c) => c._id === conv._id)) {
      setConversations((prev) => [conv, ...prev]);
    }
    openChat(conv);
    setShowNewChat(false);
    setFriendSearch("");
  };

  const createGroup = async () => {
    if (groupMembers.length < 2) return alert("Select at least 2 friends for a group");
    const res = await api.post("/messages/conversations/group", {
      participantIds: groupMembers.map((m) => m._id),
      groupName: groupName || "Group Chat",
    });
    setConversations((prev) => [res.data, ...prev]);
    openChat(res.data);
    setShowNewGroup(false);
    setGroupName("");
    setGroupMembers([]);
  };

  const toggleGroupMember = (friend) => {
    setGroupMembers((prev) =>
      prev.find((m) => m._id === friend._id)
        ? prev.filter((m) => m._id !== friend._id)
        : [...prev, friend]
    );
  };

  const filteredFriends = user?.friends?.filter((f) => {
    if (!friendSearch) return true;
    const name = `${f.firstName} ${f.lastName}`.toLowerCase();
    return name.includes(friendSearch.toLowerCase());
  }) || [];

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      if (currentChat && msg.conversation === currentChat._id) {
        setMessages((prev) => [...prev, msg]);
        api.put(`/messages/${currentChat._id}/read`);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === msg.conversation
            ? { ...c, lastMessage: msg, updatedAt: new Date().toISOString() }
            : c
        )
      );
    };
    const handleTyping = ({ conversationId }) => {
      if (currentChat?._id === conversationId) setTyping(true);
    };
    const handleStopTyping = ({ conversationId }) => {
      if (currentChat?._id === conversationId) setTyping(false);
    };
    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, currentChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openChat = async (conv) => {
    setCurrentChat(conv);
    setShowEmoji(false);
    setShowGroupSettings(false);
    markConvRead(conv._id);
    const res = await api.get(`/messages/${conv._id}`);
    setMessages(res.data);
    api.put(`/messages/${conv._id}/read`);
  };

  const getOtherUser = (conv) => {
    if (conv.isGroup) return null;
    return conv.participants.find((p) => p._id !== user._id);
  };

  const getConvName = (conv) => {
    if (conv.isGroup) return conv.groupName || "Group Chat";
    const other = getOtherUser(conv);
    return other ? `${other.firstName} ${other.lastName}` : "Unknown";
  };

  const getConvAvatar = (conv) => {
    if (conv.isGroup) return conv.groupPhoto || null;
    const other = getOtherUser(conv);
    return other?.profilePicture || "/default-avatar.svg";
  };

  const getOtherIds = (conv) =>
    conv.participants.filter((p) => p._id !== user._id).map((p) => p._id);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (sendLock.current) return;
    if (!newMessage.trim() && !chatImage) return;
    if (!currentChat) return;
    sendLock.current = true;
    const receiverIds = getOtherIds(currentChat);
    socket?.emit("stopTyping", { conversationId: currentChat._id, receiverIds });

    let res;
    if (chatImage) {
      const formData = new FormData();
      formData.append("conversationId", currentChat._id);
      if (newMessage.trim()) formData.append("text", newMessage);
      formData.append("image", chatImage);
      res = await api.post("/messages", formData);
    } else {
      res = await api.post("/messages", {
        conversationId: currentChat._id,
        text: newMessage,
      });
    }

    setMessages((prev) => [...prev, res.data]);
    setNewMessage("");
    setChatImage(null);
    setChatImagePreview(null);
    setConversations((prev) =>
      prev.map((c) =>
        c._id === currentChat._id
          ? { ...c, lastMessage: res.data, updatedAt: new Date().toISOString() }
          : c
      )
    );
    sendLock.current = false;
  };

  const handleTypingEvent = () => {
    if (!currentChat || !socket) return;
    const receiverIds = getOtherIds(currentChat);
    socket.emit("typing", { conversationId: currentChat._id, receiverIds });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { conversationId: currentChat._id, receiverIds });
    }, 2000);
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    return getConvName(c).toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getReadStatus = () => {
    if (!currentChat || messages.length === 0) return null;
    const lastOwnMsg = [...messages].reverse().find(
      (m) => (m.sender._id || m.sender) === user._id
    );
    if (!lastOwnMsg) return null;
    if (lastOwnMsg.readBy?.some((id) => id !== user._id)) return "seen";
    if (readReceipts[currentChat._id]) return "seen";
    return "sent";
  };

  // --- Group settings handlers ---
  const openGroupSettings = () => {
    setEditGroupName(currentChat.groupName || "");
    setAddMemberSearch("");
    setShowGroupSettings(true);
  };

  const updateGroupName = async () => {
    if (!editGroupName.trim()) return;
    const res = await api.put(`/messages/conversations/${currentChat._id}/name`, {
      groupName: editGroupName,
    });
    setCurrentChat(res.data);
    setConversations((prev) => prev.map((c) => (c._id === res.data._id ? res.data : c)));
  };

  const updateGroupPhoto = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await api.put(`/messages/conversations/${currentChat._id}/photo`, formData);
    setCurrentChat(res.data);
    setConversations((prev) => prev.map((c) => (c._id === res.data._id ? res.data : c)));
  };

  const addMember = async (userId) => {
    const res = await api.put(`/messages/conversations/${currentChat._id}/members/add`, { userId });
    setCurrentChat(res.data);
    setConversations((prev) => prev.map((c) => (c._id === res.data._id ? res.data : c)));
    setAddMemberSearch("");
  };

  const removeMember = async (userId) => {
    if (!window.confirm("Remove this member?")) return;
    const res = await api.put(`/messages/conversations/${currentChat._id}/members/remove`, { userId });
    setCurrentChat(res.data);
    setConversations((prev) => prev.map((c) => (c._id === res.data._id ? res.data : c)));
  };

  const leaveGroup = async () => {
    if (!window.confirm("Leave this group?")) return;
    await api.put(`/messages/conversations/${currentChat._id}/leave`);
    setConversations((prev) => prev.filter((c) => c._id !== currentChat._id));
    setCurrentChat(null);
    setShowGroupSettings(false);
  };

  const addableFriends = user?.friends?.filter((f) => {
    if (!currentChat) return false;
    const isMember = currentChat.participants.some((p) => p._id === f._id);
    if (isMember) return false;
    if (!addMemberSearch) return true;
    return `${f.firstName} ${f.lastName}`.toLowerCase().includes(addMemberSearch.toLowerCase());
  }) || [];

  return (
    <div className={`messenger-page ${currentChat ? "chat-open" : ""}`}>
      <div className="messenger-sidebar">
        <div className="messenger-header">
          <h2>Chats</h2>
          <div className="messenger-header-actions">
            <button className="new-chat-btn" onClick={() => { setShowNewGroup(!showNewGroup); setShowNewChat(false); }} title="New Group">
              <FaUsers />
            </button>
            <button className="new-chat-btn" onClick={() => { setShowNewChat(!showNewChat); setShowNewGroup(false); }} title="New Message">
              <FaEdit />
            </button>
          </div>
        </div>

        {showNewGroup && (
          <div className="new-chat-panel">
            <input placeholder="Group name..." value={groupName} onChange={(e) => setGroupName(e.target.value)} autoFocus />
            <input placeholder="Search friends to add..." value={friendSearch} onChange={(e) => setFriendSearch(e.target.value)} />
            {groupMembers.length > 0 && (
              <div className="group-members-preview">
                {groupMembers.map((m) => (
                  <span key={m._id} className="group-member-tag" onClick={() => toggleGroupMember(m)}>
                    {m.firstName} &times;
                  </span>
                ))}
              </div>
            )}
            <div className="friend-list">
              {filteredFriends.map((f) => (
                <div key={f._id} className={`conversation-item ${groupMembers.find((m) => m._id === f._id) ? "selected" : ""}`} onClick={() => toggleGroupMember(f)}>
                  <img src={f.profilePicture || "/default-avatar.svg"} alt="" className="avatar-medium" />
                  <span className="conv-name">{f.firstName} {f.lastName}</span>
                  {groupMembers.find((m) => m._id === f._id) && <FaCheck className="check-icon" />}
                </div>
              ))}
            </div>
            <button className="btn-primary create-group-btn" onClick={createGroup} disabled={groupMembers.length < 2}>
              Create Group ({groupMembers.length} selected)
            </button>
          </div>
        )}

        {showNewChat && (
          <div className="new-chat-panel">
            <input placeholder="Search friends..." value={friendSearch} onChange={(e) => setFriendSearch(e.target.value)} autoFocus />
            <div className="friend-list">
              {filteredFriends.map((f) => (
                <div key={f._id} className="conversation-item" onClick={() => startNewChat(f._id)}>
                  <img src={f.profilePicture || "/default-avatar.svg"} alt="" className="avatar-medium" />
                  <span className="conv-name">{f.firstName} {f.lastName}</span>
                </div>
              ))}
              {filteredFriends.length === 0 && <p className="empty-text">No friends found</p>}
            </div>
          </div>
        )}

        <div className="messenger-search">
          <FaSearch />
          <input placeholder="Search Messenger" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="conversation-list">
          {convLoading ? <ConversationSkeleton count={8} /> : filteredConversations.map((conv) => {
            const other = getOtherUser(conv);
            const isOnline = conv.isGroup ? false : onlineUsers.includes(other?._id);
            return (
              <div key={conv._id} className={`conversation-item ${currentChat?._id === conv._id ? "active" : ""}`} onClick={() => openChat(conv)}>
                <div className="conv-avatar">
                  {conv.isGroup ? (
                    conv.groupPhoto ? (
                      <img src={conv.groupPhoto} alt="" className="avatar-medium" style={{ borderRadius: "50%" }} />
                    ) : (
                      <div className="group-avatar-icon"><FaUsers size={20} /></div>
                    )
                  ) : (
                    <img src={getConvAvatar(conv)} alt="" className="avatar-medium" />
                  )}
                  {isOnline && <span className="online-dot" />}
                </div>
                <div className="conv-info">
                  <span className="conv-name">{getConvName(conv)}</span>
                  {conv.lastMessage && (
                    <span className="conv-last-msg">
                      {conv.lastMessage.sender === user._id ? "You: " : ""}
                      {conv.lastMessage.text?.slice(0, 30)}{conv.lastMessage.text?.length > 30 ? "..." : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="messenger-main">
        {currentChat ? (
          <>
            <div className="chat-header">
              <button className="chat-back-btn" onClick={() => setCurrentChat(null)}>
                <FaArrowLeft />
              </button>
              <div className="chat-header-user">
                {currentChat.isGroup ? (
                  currentChat.groupPhoto ? (
                    <img src={currentChat.groupPhoto} alt="" className="avatar-medium" style={{ borderRadius: "50%" }} />
                  ) : (
                    <div className="group-avatar-icon" style={{ width: 40, height: 40 }}><FaUsers size={20} /></div>
                  )
                ) : (
                  <img src={getConvAvatar(currentChat)} alt="" className="avatar-medium" />
                )}
                <div>
                  <span className="chat-user-name">{getConvName(currentChat)}</span>
                  <span className="chat-user-status">
                    {currentChat.isGroup
                      ? `${currentChat.participants.length} members`
                      : onlineUsers.includes(getOtherUser(currentChat)?._id) ? "Active now" : "Offline"}
                  </span>
                </div>
              </div>
              {currentChat.isGroup && (
                <button className="group-settings-toggle" onClick={openGroupSettings} title="Group Settings">
                  <FaCog />
                </button>
              )}
            </div>

            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                <div className="messages-container">
                  {messages.map((msg) => {
                    const isMine = (msg.sender._id || msg.sender) === user._id;
                    return (
                      <div key={msg._id} className={`message ${isMine ? "own" : "other"}`}>
                        {!isMine && (
                          <img
                            src={msg.sender.profilePicture || getConvAvatar(currentChat) || "/default-avatar.svg"}
                            alt="" className="avatar-small"
                          />
                        )}
                        <div className="message-bubble">
                          {currentChat.isGroup && !isMine && (
                            <span className="message-sender-name">{msg.sender.firstName}</span>
                          )}
                          {msg.text && <p>{msg.text}</p>}
                          {msg.image && <img src={msg.image} alt="" className="message-image" />}
                          <span className="message-time">{format(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {typing && (
                    <div className="message other">
                      <div className="typing-indicator"><span /><span /><span /></div>
                    </div>
                  )}
                  {getReadStatus() === "seen" && (
                    <div className="read-receipt"><FaCheckDouble size={12} /> Seen</div>
                  )}
                  {getReadStatus() === "sent" && (
                    <div className="read-receipt sent"><FaCheck size={12} /> Sent</div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                  {showEmoji && (
                    <div className="emoji-picker-wrapper">
                      <EmojiPicker onEmojiClick={(e) => setNewMessage((m) => m + e.emoji)} width="100%" height={350} />
                    </div>
                  )}
                  {chatImagePreview && (
                    <div className="chat-image-preview">
                      <img src={chatImagePreview} alt="Preview" />
                      <button onClick={() => { setChatImage(null); setChatImagePreview(null); }}><FaTimes /></button>
                    </div>
                  )}
                  <button className="emoji-btn" onClick={() => setShowEmoji(!showEmoji)}><FaSmile /></button>
                  <button className="emoji-btn" onClick={() => chatImageRef.current?.click()}><FaImage /></button>
                  <input
                    ref={chatImageRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setChatImage(file);
                        setChatImagePreview(URL.createObjectURL(file));
                      }
                      e.target.value = "";
                    }}
                  />
                  <form onSubmit={handleSend} className="chat-form">
                    <input
                      placeholder="Aa"
                      value={newMessage}
                      onChange={(e) => { setNewMessage(e.target.value); handleTypingEvent(); }}
                    />
                    <button type="submit" disabled={!newMessage.trim() && !chatImage}><FaPaperPlane /></button>
                  </form>
                </div>
              </div>

              {/* Group Settings Panel */}
              {showGroupSettings && currentChat?.isGroup && (
                <div className="group-settings-panel">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3>Group Settings</h3>
                    <button className="group-settings-toggle" onClick={() => setShowGroupSettings(false)}>
                      <FaTimes />
                    </button>
                  </div>

                  {/* Group Photo */}
                  <div className="group-settings-photo">
                    {currentChat.groupPhoto ? (
                      <img src={currentChat.groupPhoto} alt="" />
                    ) : (
                      <div className="group-avatar-icon"><FaUsers size={32} /></div>
                    )}
                    <label onClick={() => groupPhotoRef.current?.click()}>
                      <FaCamera /> Change Photo
                    </label>
                    <input
                      ref={groupPhotoRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        if (e.target.files[0]) updateGroupPhoto(e.target.files[0]);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  {/* Group Name */}
                  <input
                    className="group-name-input"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    onBlur={updateGroupName}
                    onKeyDown={(e) => e.key === "Enter" && updateGroupName()}
                    placeholder="Group name"
                  />

                  {/* Members */}
                  <div className="group-settings-section">
                    <h4>Members ({currentChat.participants.length})</h4>
                    {currentChat.participants.map((p) => (
                      <div key={p._id} className="group-member-item">
                        <img src={p.profilePicture || "/default-avatar.svg"} alt="" />
                        <span className="group-member-name">{p.firstName} {p.lastName}</span>
                        {currentChat.groupAdmin === p._id && (
                          <span className="group-member-role">Admin</span>
                        )}
                        {currentChat.groupAdmin === user._id && p._id !== user._id && (
                          <button className="group-member-remove" onClick={() => removeMember(p._id)}>
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Member */}
                  <div className="group-settings-section">
                    <h4>Add Member</h4>
                    <div className="group-add-member">
                      <input
                        placeholder="Search friends..."
                        value={addMemberSearch}
                        onChange={(e) => setAddMemberSearch(e.target.value)}
                      />
                      {addableFriends.slice(0, 5).map((f) => (
                        <div key={f._id} className="group-add-result" onClick={() => addMember(f._id)}>
                          <img src={f.profilePicture || "/default-avatar.svg"} alt="" />
                          <span>{f.firstName} {f.lastName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leave Group */}
                  <button className="leave-group-btn" onClick={leaveGroup}>
                    <FaSignOutAlt /> Leave Group
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <h2>Select a conversation</h2>
            <p>Choose from your existing conversations or start a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
