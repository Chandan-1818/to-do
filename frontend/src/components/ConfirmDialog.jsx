// src/components/ConfirmDialog.jsx
// Animated modal confirmation dialog with Framer Motion backdrop + scale.

import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle }         from "react-icons/fi";

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  danger = false,
  children,       // optional: rich content below the message
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="dialog-backdrop"
          onClick={onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          <motion.div
            className="dialog"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <div className="dialog__icon">
              <FiAlertTriangle />
            </div>
            <h2 className="dialog__title" id="dialog-title">{title}</h2>
            {message && <p className="dialog__message">{message}</p>}
            {children && <div className="dialog__children">{children}</div>}
            <div className="dialog__actions">
              <button className="btn btn--ghost" onClick={onCancel}>
                Cancel
              </button>
              <button
                className={`btn ${danger ? "btn--danger" : "btn--primary"}`}
                onClick={onConfirm}
                autoFocus
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
