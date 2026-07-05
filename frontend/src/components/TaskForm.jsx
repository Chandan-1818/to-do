// src/components/TaskForm.jsx
// Add / edit task form. Category field uses a searchable dropdown populated
// from CategoryContext. Includes an inline "Create category" shortcut.

import { useState, useEffect, useRef } from "react";
import { FiPlus, FiSave, FiX, FiChevronDown, FiTag } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useCategories }       from "../context/CategoryContext";
import { getCategoryIcon }     from "../utils/categoryIcons";
import CategoryFormModal       from "./CategoryFormModal";

const INITIAL = {
  title: "", description: "", priority: "medium",
  category: "", dueDate: "",
};

export default function TaskForm({
  onSubmit,
  initialData = null,
  onCancel,
  loading = false,
  isEdit  = false,
}) {
  const { categories, loading: catsLoading } = useCategories();
  const [form,     setForm]     = useState(INITIAL);
  const [errors,   setErrors]   = useState({});
  const [expanded, setExpanded] = useState(isEdit);
  const [catSearch, setCatSearch] = useState("");
  const [catOpen,   setCatOpen]   = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const catRef = useRef(null);

  // Pre-fill when editing
  useEffect(() => {
    if (initialData) {
      setForm({
        title:       initialData.title       || "",
        description: initialData.description || "",
        priority:    initialData.priority    || "medium",
        // category can be an ObjectId string or a populated object
        category: initialData.category?._id || initialData.category || "",
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split("T")[0]
          : "",
      });
      setExpanded(true);
    }
  }, [initialData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Filtered categories for dropdown ──────────────────────────────────────
  const filteredCats = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  const selectedCat = categories.find((c) => c._id === form.category);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.title.trim())              errs.title = "Title is required";
    if (form.title.trim().length > 200)  errs.title = "Max 200 characters";
    return errs;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onSubmit({
      title:       form.title.trim(),
      description: form.description.trim(),
      priority:    form.priority,
      category:    form.category || null,
      dueDate:     form.dueDate  || null,
    });

    if (!isEdit) {
      setForm(INITIAL);
      setExpanded(false);
      setErrors({});
    }
  };

  const handleCancel = () => {
    setForm(INITIAL); setErrors({}); setExpanded(false);
    if (onCancel) onCancel();
  };

  const change = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  return (
    <>
      <form className="task-form glass-card" onSubmit={handleSubmit} noValidate>
        {/* ── Title row ────────────────────────────────────────────── */}
        <div className="task-form__row">
          <div className={`form-group form-group--flex ${errors.title ? "form-group--error" : ""}`}>
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

        {/* ── Expandable extras ─────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              className="task-form__extras"
              initial={{ height: 0, opacity: 0, overflow: "hidden" }}
              // FIX: overflow must switch to visible after the height animation
              // finishes, otherwise the absolutely-positioned category dropdown
              // menu is clipped by this container and appears "empty".
              animate={{
                height: "auto",
                opacity: 1,
                transitionEnd: { overflow: "visible" },
              }}
              exit={{ height: 0, opacity: 0, overflow: "hidden" }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
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

                  {/* Category searchable dropdown */}
                  <div className="form-group" ref={catRef}>
                    <label className="form-label">Category</label>
                    <div className="cat-dropdown">
                      <button
                        type="button"
                        className="input cat-dropdown__trigger"
                        onClick={() => setCatOpen((p) => !p)}
                        aria-expanded={catOpen}
                        aria-label="Select category"
                        disabled={loading}
                      >
                        {selectedCat ? (
                          <span className="cat-dropdown__selected" style={{ color: selectedCat.color }}>
                            {(() => {
                              const SelIcon = getCategoryIcon(selectedCat.icon);
                              return <SelIcon />;
                            })()}
                            <span
                              className="cat-dropdown__dot"
                              style={{ background: selectedCat.color }}
                            />
                            {selectedCat.name}
                          </span>
                        ) : (
                          <span className="cat-dropdown__placeholder">
                            <FiTag /> No category
                          </span>
                        )}
                        <FiChevronDown className="cat-dropdown__chevron" />
                      </button>

                      <AnimatePresence>
                        {catOpen && (
                          <motion.div
                            className="cat-dropdown__menu"
                            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                            animate={{ opacity: 1, y: 0,  scaleY: 1    }}
                            exit={{    opacity: 0, y: -6, scaleY: 0.95 }}
                            transition={{ duration: 0.15 }}
                            style={{ transformOrigin: "top" }}
                          >
                            {/* Loading state while categories are fetched */}
                            {catsLoading ? (
                              <div className="cat-dropdown__option" style={{ color: "var(--text-muted)", cursor: "default" }}>
                                <span className="spinner spinner--sm" /> Loading categories…
                              </div>
                            ) : categories.length === 0 ? (
                              /* Empty state — no categories at all */
                              <>
                                <div className="cat-dropdown__option" style={{ color: "var(--text-muted)", cursor: "default" }}>
                                  You don&apos;t have any categories yet.
                                </div>
                                <button
                                  type="button"
                                  className="cat-dropdown__create"
                                  onClick={() => { setCatOpen(false); setCatModalOpen(true); }}
                                >
                                  <FiPlus /> Create Category
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Search within dropdown */}
                                <input
                                  className="input cat-dropdown__search"
                                  placeholder="Search categories…"
                                  value={catSearch}
                                  onChange={(e) => setCatSearch(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />

                                {/* None option */}
                                <button
                                  type="button"
                                  className={`cat-dropdown__option${!form.category ? " cat-dropdown__option--active" : ""}`}
                                  onClick={() => { setForm((p) => ({ ...p, category: "" })); setCatOpen(false); setCatSearch(""); }}
                                >
                                  <span className="cat-dropdown__dot" style={{ background: "var(--text-disabled)" }} />
                                  No category
                                </button>

                                {/* Filtered categories — icon + colour dot + name */}
                                {filteredCats.map((cat) => {
                                  const OptIcon = getCategoryIcon(cat.icon);
                                  return (
                                    <button
                                      key={cat._id}
                                      type="button"
                                      className={`cat-dropdown__option${form.category === cat._id ? " cat-dropdown__option--active" : ""}`}
                                      onClick={() => { setForm((p) => ({ ...p, category: cat._id })); setCatOpen(false); setCatSearch(""); }}
                                    >
                                      <OptIcon style={{ color: cat.color, flexShrink: 0 }} />
                                      <span className="cat-dropdown__dot" style={{ background: cat.color }} />
                                      {cat.name}
                                    </button>
                                  );
                                })}

                                {/* No search matches */}
                                {catSearch && filteredCats.length === 0 && (
                                  <div className="cat-dropdown__option" style={{ color: "var(--text-muted)", cursor: "default" }}>
                                    No categories match &quot;{catSearch}&quot;
                                  </div>
                                )}

                                {/* Quick create */}
                                <button
                                  type="button"
                                  className="cat-dropdown__create"
                                  onClick={() => { setCatOpen(false); setCatModalOpen(true); }}
                                >
                                  <FiPlus /> Create Category
                                </button>
                              </>
                            )}
                          </motion.div>
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
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Inline "create category" modal triggered from the dropdown */}
      <CategoryFormModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        onCreated={(newCat) => {
          // Auto-select the freshly created category in the form
          setForm((p) => ({ ...p, category: newCat._id }));
        }}
      />
    </>
  );
}
