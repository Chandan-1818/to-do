// src/components/CategoryFormModal.jsx
// Create / edit category modal with icon picker and colour swatch picker.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX, FiFolder, FiBriefcase, FiHome, FiBook, FiHeart,
  FiShoppingCart, FiMusic, FiCamera, FiCode, FiStar,
  FiZap, FiGlobe, FiAward, FiTool, FiCoffee,
  FiTrello, FiFeather, FiSun,
} from "react-icons/fi";
import { useToast }      from "../context/ToastContext";
import { useCategories } from "../context/CategoryContext";
import { categoriesAPI } from "../api";

// ── Available icons ────────────────────────────────────────────────────────────
const ICONS = [
  { id: "FiFolder",       Icon: FiFolder       },
  { id: "FiBriefcase",    Icon: FiBriefcase    },
  { id: "FiHome",         Icon: FiHome         },
  { id: "FiBook",         Icon: FiBook         },
  { id: "FiHeart",        Icon: FiHeart        },
  { id: "FiShoppingCart", Icon: FiShoppingCart },
  { id: "FiMusic",        Icon: FiMusic        },
  { id: "FiCamera",       Icon: FiCamera       },
  { id: "FiCode",         Icon: FiCode         },
  { id: "FiStar",         Icon: FiStar         },
  { id: "FiZap",          Icon: FiZap          },
  { id: "FiGlobe",        Icon: FiGlobe        },
  { id: "FiAward",        Icon: FiAward        },
  { id: "FiTool",         Icon: FiTool         },
  { id: "FiCoffee",       Icon: FiCoffee       },
  { id: "FiTrello",       Icon: FiTrello       },
  { id: "FiFeather",      Icon: FiFeather      },
  { id: "FiSun",          Icon: FiSun          },
];

// ── Available colour swatches ──────────────────────────────────────────────────
const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#10b981",
  "#06b6d4", "#3b82f6", "#64748b", "#1e293b",
];

// Map icon id string → React component (used for rendering the selected icon)
const ICON_MAP = Object.fromEntries(ICONS.map(({ id, Icon }) => [id, Icon]));

const INITIAL = { name: "", icon: "FiFolder", color: "#6366f1", description: "" };

export default function CategoryFormModal({ open, onClose, editData = null, onUpdated, onCreated }) {
  const { showToast }                          = useToast();
  const { addCategory, updateCategory }        = useCategories();
  const [form,    setForm]    = useState(INITIAL);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const isEdit = !!editData;

  // Pre-fill when editing
  useEffect(() => {
    if (editData) {
      setForm({
        name:        editData.name        || "",
        icon:        editData.icon        || "FiFolder",
        color:       editData.color       || "#6366f1",
        description: editData.description || "",
      });
    } else {
      setForm(INITIAL);
    }
    setErrors({});
  }, [editData, open]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim())             errs.name = "Name is required";
    else if (form.name.trim().length > 50) errs.name = "Max 50 characters";
    if (form.description.length > 200) errs.description = "Max 200 characters";
    return errs;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      if (isEdit) {
        const res = await categoriesAPI.update(editData._id, form);
        updateCategory(res.data.data);
        if (onUpdated) onUpdated(res.data.data);   // notify parent (e.g. CategoryDetailPage)
        showToast("Category updated!", "success");
      } else {
        const res = await categoriesAPI.create(form);
        addCategory(res.data.data);
        if (onCreated) onCreated(res.data.data); // e.g. auto-select in TaskForm
        showToast("Category created!", "success");
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const SelectedIcon = ICON_MAP[form.icon] || FiFolder;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="dialog-backdrop"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="dialog dialog--wide"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 28 }}
            animate={{ opacity: 1, scale: 1,   y: 0  }}
            exit={{    opacity: 0, scale: 0.9, y: 28 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
          >
            {/* Header */}
            <div className="dialog__header">
              <h2 className="dialog__title" style={{ textAlign: "left" }}>
                {isEdit ? "Edit Category" : "New Category"}
              </h2>
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Preview */}
              <div className="cat-modal__preview">
                <div
                  className="cat-modal__preview-icon"
                  style={{ background: form.color + "22", color: form.color }}
                >
                  <SelectedIcon />
                </div>
                <span className="cat-modal__preview-name">{form.name || "Category name"}</span>
              </div>

              {/* Name */}
              <div className={`form-group ${errors.name ? "form-group--error" : ""}`}>
                <label className="form-label">Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                  }}
                  placeholder="e.g. Work, Personal, Health"
                  maxLength={50}
                  disabled={loading}
                  autoFocus
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              {/* Description */}
              <div className={`form-group ${errors.description ? "form-group--error" : ""}`}>
                <label className="form-label">Description (optional)</label>
                <input
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What is this category for?"
                  maxLength={200}
                  disabled={loading}
                />
                {errors.description && <span className="form-error">{errors.description}</span>}
              </div>

              {/* Icon picker */}
              <div className="form-group">
                <label className="form-label">Icon</label>
                <div className="cat-modal__icon-grid">
                  {ICONS.map(({ id, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      className={`cat-modal__icon-btn${form.icon === id ? " cat-modal__icon-btn--selected" : ""}`}
                      style={form.icon === id ? { background: form.color + "28", color: form.color, borderColor: form.color } : {}}
                      onClick={() => setForm((p) => ({ ...p, icon: id }))}
                      aria-label={id}
                      title={id}
                    >
                      <Icon />
                    </button>
                  ))}
                </div>
              </div>

              {/* Colour picker */}
              <div className="form-group">
                <label className="form-label">Colour</label>
                <div className="cat-modal__color-grid">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`cat-modal__color-btn${form.color === c ? " cat-modal__color-btn--selected" : ""}`}
                      style={{ background: c }}
                      onClick={() => setForm((p) => ({ ...p, color: c }))}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                  {/* Custom hex input */}
                  <input
                    type="color"
                    className="cat-modal__color-custom"
                    value={form.color}
                    onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                    title="Custom colour"
                    aria-label="Custom colour"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="dialog__actions" style={{ marginTop: "1.5rem" }}>
                <button type="button" className="btn btn--ghost" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={loading}>
                  {loading
                    ? <span className="spinner spinner--sm" />
                    : isEdit ? "Save Changes" : "Create Category"
                  }
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
