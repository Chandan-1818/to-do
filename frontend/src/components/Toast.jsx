// src/components/Toast.jsx
// Renders the toast notification stack in the top-right corner.
// Reads from ToastContext and renders one toast per entry.

import {
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";
import { useToast } from "../context/ToastContext";

// Maps type → icon component and CSS modifier class
const TOAST_CONFIG = {
  success: { icon: FiCheckCircle,   cls: "toast--success"  },
  error:   { icon: FiAlertCircle,   cls: "toast--error"    },
  info:    { icon: FiInfo,          cls: "toast--info"     },
  warning: { icon: FiAlertTriangle, cls: "toast--warning"  },
};

function ToastItem({ toast }) {
  const { removeToast } = useToast();
  const { icon: Icon, cls } = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  return (
    <div className={`toast ${cls}`} role="alert">
      <Icon className="toast__icon" />
      <span className="toast__message">{toast.message}</span>
      <button
        className="toast__close"
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss notification"
      >
        <FiX />
      </button>
    </div>
  );
}

function Toast() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

export default Toast;
