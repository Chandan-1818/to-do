// src/components/ConfirmDialog.jsx
// A reusable modal confirmation dialog.
// Usage: <ConfirmDialog open={open} title="Delete task?" message="..." onConfirm={fn} onCancel={fn} />

import { FiAlertTriangle } from "react-icons/fi";

function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = "Confirm", danger = false }) {
  if (!open) return null;

  return (
    // Backdrop — clicking it cancels
    <div className="dialog-backdrop" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      {/* Stop clicks inside the dialog from bubbling to the backdrop */}
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog__icon">
          <FiAlertTriangle />
        </div>
        <h2 className="dialog__title" id="dialog-title">{title}</h2>
        {message && <p className="dialog__message">{message}</p>}
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
      </div>
    </div>
  );
}

export default ConfirmDialog;
