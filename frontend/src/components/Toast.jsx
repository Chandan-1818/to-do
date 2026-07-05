// src/components/Toast.jsx
// Animated toast stack — slides in from the right with Framer Motion.

import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle, FiX } from "react-icons/fi";
import { useToast } from "../context/ToastContext";

const CONFIG = {
  success: { icon: FiCheckCircle,   cls: "toast--success" },
  error:   { icon: FiAlertCircle,   cls: "toast--error"   },
  info:    { icon: FiInfo,          cls: "toast--info"    },
  warning: { icon: FiAlertTriangle, cls: "toast--warning" },
};

function ToastItem({ toast }) {
  const { removeToast } = useToast();
  const { icon: Icon, cls } = CONFIG[toast.type] || CONFIG.info;

  return (
    <motion.div
      className={`toast ${cls}`}
      role="alert"
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 80, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
    >
      <Icon className="toast__icon" />
      <span className="toast__message">{toast.message}</span>
      <button
        className="toast__close icon-btn"
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss"
      >
        <FiX />
      </button>
    </motion.div>
  );
}

export default function Toast() {
  const { toasts } = useToast();

  return (
    <div className="toast-container" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
      </AnimatePresence>
    </div>
  );
}
