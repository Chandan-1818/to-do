// src/components/TaskForm.jsx
// Add / edit task form with a portal-based category dropdown.
//
// The dropdown menu is rendered via a React Portal into document.body and
// positioned with `position: fixed` using the trigger's getBoundingClientRect().
// This completely avoids all overflow/clip/stacking-context issues caused by
// parent animation wrappers — regardless of how deep in the DOM the trigger sits.

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal }   from "react-dom";
import {
  FiPlus, FiSave, FiX, FiChevronDown, FiTag, FiCheck,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useCategories }  from "../context/CategoryContext";
import CategoryFormModal  from "./CategoryFormModal";

// ── Constants ────────────────────────────────────────────────────────────────
const INITIAL = {
  title: "", description: "", priority: "medium",
  categoryId: "", dueDate: "",
};

function toCategoryIdString(value) {
  if (!value) return "";
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

// ── ExpandableExtras ─────────────────────────────────────────────────────────
// Height-animated wrapper. Uses named variants so onAnimationComplete receives
// a string ("open"/"closed"), allowing overflow to switch correctly.
const extrasVariants = {
  open:   { height: "auto", opacity: 1 },
  closed: { height: 0,      opacity: 0 },
};

function ExpandableExtras({ children }) {
  const [overflow, setOverflow] = useState("hidden");
  return (
    <motion.div
      className="task-form__extras"
      variants={extrasVariants}
      initial="closed"
      animate="open"
      exit="closed"
      transition={{ duration: 0.22, ease: "easeInOut" }}
      style={{ overflow }}
      onAnimationStart={() => setOverflow("hidden")}
      onAnimationComplete={(def) => {
        if (def === "open") setOverflow("visible");
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Portal Dropdown Menu ──────────────────────────────────────────────────────
// Renders the menu into document.body at a fixed position calculated from the
// trigger element's bounding rect. Completely immune to parent overflow/clip.
function PortalDropdown({ triggerRef, open, onClose, children }) {
  const [rect, setRect] = useState(null);

  // Recalculate position whenever the dropdown opens or the window resizes/scrolls
  const measure = useCallback(() => {
    if (triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
  }, [triggerRef]);

  useEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener("resize",  measure, { passive: true });
    window.addEventListener("scroll",  measure, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize",  measure);
      window.removeEventListener("scroll",  measure, { capture: true });
    };
  }, [open, measure]);

  if (!open || !rect) return null;

  // Determine whether to open downward or upward based on available space
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const menuHeight = Math.min(260, window.innerHeight * 0.45); // max menu height
  const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;

  const style = {
    position:  "fixed",
    left:      rect.left,
    width:     rect.width,
    zIndex:    9999,
    ...(openUpward
      ? { bottom: window.innerHeight - rect.top + 4 }
      : { top: rect.bottom + 4 }
    ),
  };

  return createPortal(
    <motion.div
      className="cat-dropdown__menu"
      role="listbox"
      aria-label="Category options"
      style={style}
      initial={{ opacity: 0, y: openUpward ? 6 : -6, scaleY: 0.95 }}
      animate={{ opacity: 1, y: 0, scaleY: 1 }}
      exit={{    opacity: 0, y: openUpward ? 6 : -6, scaleY: 0.95 }}
      transition={{ duration: 0.14 }}
    >
      {children}
    </motion.div>,
    document.body
  );
}

// ── TaskForm ─────────────────────────────────────────────────────────────────
export default function TaskForm({
  onSubmit,
  initialData = null,
  onCancel,
  loading = false,
  isEdit  = false,
}) {
  const { categories } = useCategories();

  const [form,         setForm]         = useState(INITIAL);
  const [errors,       setErrors]       = useState({});
  const [expanded,     setExpanded]     = useState(isEdit);
  const [catSearch,    setCatSearch]    = useState("");
  const [catOpen,      setCatOpen]      = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);

  // catRef points to the trigger button — used to measure its position
  const catTriggerRef = useRef(null);
  // catContainerRef wraps the whole dropdown group for outside-click detection
  const catContainerRef = useRef(null);

  // ── Pre-fill when editing ─────────────────────────────────────────────────
  useEffect(() => {
    if (initialData) {
      setForm({
        title:       initialData.title       || "",
        description: initialData.description || "",
        priority:    initialData.priority    || "medium",
        categoryId:  toCategoryIdString(initialData.category),
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split("T")[0]
          : "",
      });
      setExpanded(true);
    }
  }, [initialData]);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    if (!catOpen) return;
    const handler = (e) => {
      // Close if the click is outside both the container AND the portal menu.
      // The portal menu is in document.body, so we check for the CSS class.
      const clickedInsideContainer = catContainerRef.current?.contains(e.target);
      const clickedInsideMenu      = e.target.closest(".cat-dropdown__menu");
      if (!clickedInsideContainer && !clickedInsideMenu) {
        setCatOpen(false);
      }
    };
    // Use capture so we intercept before any stopPropagation in children
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [catOpen]);

  // ── Close on Escape key ────────────────────────────────────────────────────
  useEffect(() => {
    if (!catOpen) return;
    const handler = (e) => { if (e.key === "Escape") setCatOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [catOpen]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const filteredCats = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );
  const selectedCat = categories.find((c) => String(c._id) === form.categoryId);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.title.trim())             errs.title = "Title is required";
    if (form.title.trim().length > 200) errs.title = "Max 200 characters";
    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const categoryValue = form.categoryId || null;
    onSubmit({
      title:       form.title.trim(),
      description: form.description.trim(),
      priority:    form.priority,
      categoryId:  categoryValue,
      category:    categoryValue,
      dueDate:     form.dueDate || null,
    });

    if (!isEdit) {
      setForm(INITIAL);
      setExpanded(false);
      setErrors({});
      setCatSearch("");
    }
  };

  const handleCancel = () => {
    setForm(INITIAL);
    setErrors({});
    setExpanded(false);
    setCatSearch("");
    setCatOpen(false);
    if (onCancel) onCancel();
  };

  const change = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleCategoryCreated = (newCat) => {
    setForm((p) => ({ ...p, categoryId: String(newCat._id) }));
    setCatSearch("");
    setCatModalOpen(false);
  };

  const selectCategory = (id) => {
    setForm((p) => ({ ...p, categoryId: String(id) }));
    setCatOpen(false);
    setCatSearch("");
  };

  const clearCategory = () => {
    setForm((p) => ({ ...p, categoryId: "" }));
    setCatOpen(false);
    setCatSearch("");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <form className="task-form glass-card" onSubmit={handleSubmit} noValidate>

        {/* ── Title row ──────────────────────────────────────────────────── */}
        <div className="task-form__row">
          <div className={`form-group form-group--flex${errors.title ? " form-group--error" : ""}`}>
            <input
              type="text"
              className="input task-form__title-input"
              placeholder={isEdit ? "Task title" : "What needs to be done?"}
              value={form.title}
              onChange={change("title")}
              disabled={loading}
              maxLength={200}
              aria-label="Task title"
              autoFocus={!isEdit}
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          {!isEdit && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setExpanded((p) => !p)}
              aria-expanded={expanded}
            >
              {expanded ? "Less" : "Details"}
            </button>
          )}

          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading || !form.title.trim()}
          >
            {loading
              ? <span className="spinner spinner--sm" />
              : isEdit
                ? <><FiSave /> Save</>
                : <><FiPlus /> Add</>
            }
          </button>

          {isEdit && (
            <button type="button" className="btn btn--ghost" onClick={handleCancel}>
              <FiX />
            </button>
          )}
        </div>

        {/* ── Expandable extras ──────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <ExpandableExtras>
              <div className="task-form__extras-inner">

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <textarea
                    className="input textarea"
                    placeholder="Add context or notes…"
                    value={form.description}
                    onChange={change("description")}
                    disabled={loading}
                    maxLength={1000}
                    rows={2}
                  />
                </div>

                <div className="task-form__grid">

                  {/* Priority */}
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="input select"
                      value={form.priority}
                      onChange={change("priority")}
                      disabled={loading}
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                  </div>

                  {/* ── Category dropdown (portal-based) ───────────────── */}
                  <div className="form-group" ref={catContainerRef}>
                    <label className="form-label">Category</label>
                    <div className="cat-dropdown">

                      {/* Trigger button — ref used for position calculation */}
                      <button
                        ref={catTriggerRef}
                        type="button"
                        className="input cat-dropdown__trigger"
                        onClick={() => setCatOpen((p) => !p)}
                        aria-expanded={catOpen}
                        aria-haspopup="listbox"
                        aria-label="Select category"
                        disabled={loading}
                      >
                        {selectedCat ? (
                          <span className="cat-dropdown__selected">
                            <span
                              className="cat-dropdown__dot"
                              style={{ background: selectedCat.color }}
                            />
                            <span className="cat-dropdown__selected-name">
                              {selectedCat.name}
                            </span>
                          </span>
                        ) : (
                          <span className="cat-dropdown__placeholder">
                            <FiTag /> No category
                          </span>
                        )}
                        <FiChevronDown className="cat-dropdown__chevron" />
                      </button>

                      {/* Menu rendered in a portal — bypasses all overflow clips */}
                      <AnimatePresence>
                        {catOpen && (
                          <PortalDropdown
                            triggerRef={catTriggerRef}
                            open={catOpen}
                            onClose={() => setCatOpen(false)}
                          >
                            {/* Search */}
                            <input
                              className="input cat-dropdown__search"
                              placeholder="Search categories…"
                              value={catSearch}
                              onChange={(e) => setCatSearch(e.target.value)}
                              autoFocus
                              aria-label="Search categories"
                            />

                            {/* No category option */}
                            <button
                              type="button"
                              role="option"
                              aria-selected={!form.categoryId}
                              className={`cat-dropdown__option${!form.categoryId ? " cat-dropdown__option--active" : ""}`}
                              onClick={clearCategory}
                            >
                              <span className="cat-dropdown__dot" style={{ background: "var(--text-disabled)" }} />
                              <span className="cat-dropdown__option-name">No category</span>
                              {!form.categoryId && <FiCheck className="cat-dropdown__option-check" />}
                            </button>

                            {/* No search results */}
                            {filteredCats.length === 0 && catSearch && (
                              <p className="cat-dropdown__empty">No categories match "{catSearch}"</p>
                            )}

                            {/* Category list */}
                            {filteredCats.map((cat) => {
                              const isSelected = String(cat._id) === form.categoryId;
                              return (
                                <button
                                  key={cat._id}
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  className={`cat-dropdown__option${isSelected ? " cat-dropdown__option--active" : ""}`}
                                  onClick={() => selectCategory(cat._id)}
                                >
                                  <span className="cat-dropdown__dot" style={{ background: cat.color }} />
                                  <span className="cat-dropdown__option-name">{cat.name}</span>
                                  {cat.taskCount > 0 && (
                                    <span className="cat-dropdown__option-count">{cat.taskCount}</span>
                                  )}
                                  {isSelected && <FiCheck className="cat-dropdown__option-check" />}
                                </button>
                              );
                            })}

                            {/* Quick create */}
                            <button
                              type="button"
                              className="cat-dropdown__create"
                              onClick={() => { setCatOpen(false); setCatModalOpen(true); }}
                            >
                              <FiPlus /> New category…
                            </button>
                          </PortalDropdown>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Due date */}
                  <div className="form-group">
                    <label className="form-label">Due date</label>
                    <input
                      type="date"
                      className="input"
                      value={form.dueDate}
                      onChange={change("dueDate")}
                      disabled={loading}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                </div>
              </div>
            </ExpandableExtras>
          )}
        </AnimatePresence>
      </form>

      <CategoryFormModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        onCreated={handleCategoryCreated}
      />
    </>
  );
}
