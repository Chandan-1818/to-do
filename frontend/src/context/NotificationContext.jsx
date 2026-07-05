// src/context/NotificationContext.jsx
// Global notification state. Polls every 30 s when the tab is visible.
// Exposes helpers: markRead, markAllRead, remove, clearAll, refresh.

import {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from "react";
import { notificationsAPI } from "../api";
import { useAuth }          from "./AuthContext";

const NotificationContext = createContext({
  notifications: [],
  unreadCount:   0,
  loading:       false,
  refresh:       async () => {},
  markRead:      async () => {},
  markAllRead:   async () => {},
  remove:        async () => {},
  clearAll:      async () => {},
});

export function NotificationProvider({ children }) {
  const { user }                              = useAuth();
  const [notifications, setNotifications]    = useState([]);
  const [unreadCount,   setUnreadCount]      = useState(0);
  const [loading,       setLoading]          = useState(false);
  const intervalRef                          = useRef(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error("[NotificationContext] fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load + poll every 30 s while tab is visible
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    refresh();

    const startPoll = () => {
      intervalRef.current = setInterval(refresh, 30_000);
    };
    const stopPoll = () => {
      clearInterval(intervalRef.current);
    };

    startPoll();
    // Pause polling when tab is hidden
    const handleVisibility = () => {
      document.hidden ? stopPoll() : startPoll();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopPoll();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, refresh]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) { console.error(err); }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  }, []);

  const remove = useCallback(async (id) => {
    try {
      const wasUnread = notifications.find((n) => n._id === id && !n.read);
      await notificationsAPI.deleteOne(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) { console.error(err); }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    try {
      await notificationsAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, refresh, markRead, markAllRead, remove, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
