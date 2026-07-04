// src/components/TaskForm.jsx
// Add / edit task form with title, description, priority, category, and due date.
// Used both for creating a new task and for editing an existing one.

import { useState, useEffect } from "react";
import { FiPlus, FiSave, FiX } from "react-icons/fi";

// Default shape of the form fields
const INITIAL_STATE = {
  title:       "",
  description: "",
  priority:    "medium",
  category:    "General",
  dueDate:     "",
};

/**
 * TaskForm
 * Props:
 *  onSubmit(formData)  - called with the form values on submit
 *  initialData         - pre-fills fields when editing an existing task
 *  onCancel            - called when the user cancels an edit
 *  loading             - disables the form while an API call is in flight
 *  isEdit              - changes button label and behaviour
 */
function TaskForm({ onSubmit, initialData = null, onCancel, loading = false, isEdit = false }) {
  const [form,   setForm]   = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [expanded, setExpanded] = useState(isEdit); // show extra fields by default in edit mode

  // When editing, pre-fill the form with existing task data
  useEffect(() => {
    if (initialData) {
      setForm({
        title:       initialData.title       || "",
        description: initialData.description || "",
        priority:    initialData.priority    || "medium",
        category:    initialData.category    || "General",
        // Convert ISO date to YYYY-MM-DD for the date input
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split("T")[0]
          : "",
      });
      setExpanded(true);
    }
  }, [initialData]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.title.trim())              errs.title = "Title is required";
    if (form.title.trim().length > 200)  errs.title = "Title must be 200 characters or fewer";
    if (form.category.trim().length > 50) errs.category = "Category must be 50 characters or fewer";
    return errs;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the error for this field as the user types
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // Build clean payload — send null for empty dueDate
    const payload = {
      title:       form.title.trim(),
      description: form.description.trim(),
      priority:    form.priority,
      category:    form.category.trim() || "General",
      dueDate:     form.dueDate || null,
    };

    onSubmit(payload);

    if (!isEdit) {
      setForm(INITIAL_STATE);
      setExpanded(false);
      setErrors({});
    }
  };

  const handleCancel = () => {
    setForm(INITIAL_STATE);
    setErrors({});
    setExpanded(false);
    if (onCancel) onCancel();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form className="task-form card" onSubmit={handleSubmit} noValidate>
      {/* ── Title row ──────────────────────────────────────────────────── */}
      <div className="task-form__row">
        <div className={`form-group form-group--flex ${errors.title ? "form-group--error" : ""}`}>
          <input
            type="text"
            name="title"
            className="input"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={handleChange}
            disabled={loading}
            maxLength={200}
            aria-label="Task title"
            aria-invalid={!!errors.title}
            autoFocus={!isEdit}
          />
          {errors.title && <span className="form-error">{errors.title}</span>}
        </div>

        {/* Toggle the extra fields panel */}
        {!isEdit && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setExpanded((p) => !p)}
            aria-expanded={expanded}
            title={expanded ? "Hide options" : "Show more options"}
          >
            {expanded ? "Less" : "More"}
          </button>
        )}

        <button
          type="submit"
          className="btn btn--primary"
          disabled={loading || !form.title.trim()}
        >
          {loading ? (
            <span className="spinner spinner--sm" />
          ) : isEdit ? (
            <><FiSave /> Save</>
          ) : (
            <><FiPlus /> Add Task</>
          )}
        </button>

        {isEdit && (
          <button type="button" className="btn btn--ghost" onClick={handleCancel}>
            <FiX /> Cancel
          </button>
        )}
      </div>

      {/* ── Expandable extra fields ────────────────────────────────────── */}
      {expanded && (
        <div className="task-form__extras">
          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              name="description"
              className="input textarea"
              placeholder="Add notes..."
              value={form.description}
              onChange={handleChange}
              disabled={loading}
              maxLength={1000}
              rows={2}
            />
          </div>

          <div className="task-form__grid">
            {/* Priority */}
            <div className="form-group">
              <label className="form-label" htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                className="input select"
                value={form.priority}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            {/* Category */}
            <div className={`form-group ${errors.category ? "form-group--error" : ""}`}>
              <label className="form-label" htmlFor="category">Category</label>
              <input
                id="category"
                type="text"
                name="category"
                className="input"
                placeholder="e.g. Work, Personal"
                value={form.category}
                onChange={handleChange}
                disabled={loading}
                maxLength={50}
              />
              {errors.category && <span className="form-error">{errors.category}</span>}
            </div>

            {/* Due Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="dueDate">Due Date (optional)</label>
              <input
                id="dueDate"
                type="date"
                name="dueDate"
                className="input"
                value={form.dueDate}
                onChange={handleChange}
                disabled={loading}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default TaskForm;
