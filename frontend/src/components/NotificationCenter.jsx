// src/components/NotificationCenter.jsx
// Full notification dropdown — animated bell, unread badge, item list,
// mark-read, delete, mark-all-read, clear-all, relative timestamps.

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence }     from "framer-motion";
import {
  FiBell, FiCheckCircle, FiTrash2, FiX,
  FiCheck, FiAlertCircle, FiEdit2, FiTag,
  FiClock, FiAlertTriangle, FiInfo,
} from "react-icons/fi";
import { MdCelebration } from "react-icons/md";
import { useNotifications } from "../context/NotificationContext";

// ── Config: type → icon + accent colour ──────────────────────────────────────
const TYPE_CONFIG = {
  task_created:    { icon: FiCheckCircle,   color: "#6366f1", bg: "rgba(99,102,241,.12)"  },
  task_completed:  { icon: MdCelebration,   color: "#22c55e", bg: "rgba(34,197,94,.12)"   },
  task_deleted:    { icon: FiTrash2,        color: "#ef4444", bg: "rgba(239,68,68,.12)"   },
  task_edited:     { icon: FiEdit2,         color: "#f59e0b", bg: "rgba(245,158,11,.12)"  },
  category_created:{ icon: FiTag,           color: "#8b5cf6", bg: "rgba(139,92,246,.12)"  },
  category_deleted:{ icon: FiTag,           color: "#ef4444", bg: "rgba(239,68,68,.12)"   },
  due_today:       { icon: FiClock,         color: "#f59e0b", bg: "rgba(245,158,11,.12)"  },
  overdue:         { icon: FiAlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,.12)"   },
  upcoming:        { icon: FiClock,         color: "#3b82f6", bg: "rgba(59,130,246,.12)"  },
  welcome:         { icon: FiCheckCircle,   color: "#22c55e", bg: "rgba(34,197,94,.12)"   },
  info:            { icon: FiInfo,          color: "#64748b", bg: "rgba(100,116,139,.12)" },
};

function relativeTime(dateStr) {
  const now   = Date.now();
  const diff  = now - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  === 1) return "Yesterday";
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function NotifItem({ notif }) {
  const { markRead, remove } = useNotifications();
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      className={`notif-item${notif.read ? " notif-item--read" : ""}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Icon bubble */}
      <div className="notif-item__icon" style={{ background: cfg.bg, color: cfg.color }}>
        <Icon />
      </div>

      {/* Content — click body to mark as read */}
      <div
        className="notif-item__body"
        onClick={() => !notif.read && markRead(notif._id)}
        style={{ cursor: notif.read ? "default" : "pointer" }}
        role={notif.read ? undefined : "button"}
        tabIndex={notif.read ? undefined : 0}
        onKeyDown={(e) => e.key === "Enter" && !notif.read && markRead(notif._id)}
        aria-label={notif.read ? undefined : "Mark as read"}
      >
        <div className="notif-item__title-row">
          <span className="notif-item__title">{notif.title}</span>
          {!notif.read && <span className="notif-item__unread-dot" aria-label="Unread" />}
        </div>
        {notif.message && <p className="notif-item__msg">{notif.message}</p>}
        <span className="notif-item__time">{relativeTime(notif.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="notif-item__actions">
        {!notif.read && (
          <button
            className="notif-item__action-btn"
            onClick={() => markRead(notif._id)}
            title="Mark as read"
            aria-label="Mark as read"
          >
            <FiCheck />
          </button>
        )}
        <button
          className="notif-item__action-btn notif-item__action-btn--del"
          onClick={() => remove(notif._id)}
          title="Delete notification"
          aria-label="Delete notification"
        >
          <FiX />
        </button>
      </div>
    </motion.div>
  );
}

export default function NotificationCenter() {
  const {
    notifications, unreadCount, loading,
    markAllRead, clearAll,
  }             = useNotifications();
  const [open,  setOpen]  = useState(false);
  const ref               = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="notif-center" ref={ref}>
      {/* ── Bell button ─────────────────────────────────────────────── */}
      <motion.button
        className="icon-btn notif-center__bell"
        onClick={() => setOpen((p) => !p)}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        whileTap={{ scale: 0.88 }}
      >
        <motion.span
          animate={unreadCount > 0 && !open ? { rotate: [0, -18, 16, -12, 8, 0] } : {}}
          transition={{ duration: 0.55, repeat: Infinity, repeatDelay: 4 }}
          style={{ display: "flex" }}
        >
          <FiBell />
        </motion.span>

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              className="notif-center__badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Dropdown panel ──────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="notif-panel"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            role="dialog"
            aria-label="Notifications"
          >
            {/* Header */}
            <div className="notif-panel__header">
              <div className="notif-panel__header-left">
                <h3 className="notif-panel__title">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="notif-panel__count">{unreadCount} new</span>
                )}
              </div>
              <div className="notif-panel__header-actions">
                {unreadCount > 0 && (
                  <button
                    className="notif-panel__action-btn"
                    onClick={markAllRead}
                    title="Mark all as read"
                  >
                    <FiCheckCircle /> All read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    className="notif-panel__action-btn notif-panel__action-btn--danger"
                    onClick={clearAll}
                    title="Clear all notifications"
                  >
                    <FiTrash2 /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="notif-panel__body">
              {loading && notifications.length === 0 ? (
                <div className="notif-panel__empty">
                  <div className="spinner spinner--sm" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="notif-panel__empty">
                  <FiBell className="notif-panel__empty-icon" />
                  <p>You're all caught up!</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {notifications.map((n) => (
                    <NotifItem key={n._id} notif={n} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
