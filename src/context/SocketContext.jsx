import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadConvIds, setUnreadConvIds] = useState(new Set());

  useEffect(() => {
    if (user) {
      const serverUrl = import.meta.env.VITE_API_URL || "/";
      const s = io(serverUrl, { query: { userId: user._id } });
      setSocket(s);

      s.on("onlineUsers", (users) => setOnlineUsers(users));

      s.on("newMessage", (msg) => {
        const senderId = msg.sender?._id || msg.sender;
        if (senderId !== user._id) {
          setUnreadConvIds((prev) => new Set([...prev, msg.conversation]));
        }
      });

      return () => s.disconnect();
    } else {
      setSocket(null);
      setOnlineUsers([]);
    }
  }, [user]);

  const markConvRead = useCallback((convId) => {
    setUnreadConvIds((prev) => {
      const next = new Set(prev);
      next.delete(convId);
      return next;
    });
  }, []);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, unreadMessages: unreadConvIds.size, markConvRead }}>
      {children}
    </SocketContext.Provider>
  );
}
