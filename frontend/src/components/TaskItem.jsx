// src/components/TaskItem.jsx
// Single task card with: toggle, inline edit form, delete (with confirmation),
// priority badge, category tag, and due-date display.

import { useState } from "react";
import { FiEdit2, FiTrash2, FiCalendar, FiTag, FiFlag } from "react-icons/fi";
import TaskForm     from "./TaskForm";
import ConfirmDialog from "./ConfirmDialog";

// ── Helper: priority badge ────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  low:    { label: "Low",    cls: "badge--low",    icon: "🟢" },
  medium: { label: "Medium", cls: "badge--medium", icon: "🟡" },
  high:   { label: "High",   cls: "badge--high",   icon: "🔴" },
};

// ── Helper: due date display ──────────────────────────────────────────────────
function DueDateBadge({ dueDate }) {
  if (!dueDate) return null;
  const date     = new Date(dueDate);
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = date < today;
  const formatted = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <span className={`task-meta__badge ${isOverdue ? "task-meta__badge--overdue" : ""}`}>
      <FiCalendar />
      {formatted}
      {isOverdue && " · Overdue"}
    </span>
  );
}

/**
 * TaskItem
 * Props:
 *  task               - { _id, title, description, completed, priority, category, dueDate, createdAt }
 *  onToggle(id)       - toggle completed status
 *  onDelete(id)       - delete task
 *  onEdit(id, data)   - update task fields
 */
function TaskItem({ task, onToggle, onDelete, onEdit }) {
  const [isEditing,    setIsEditing]    = useState(false);
  const [confirmOpen,  setConfirmOpen]  = useState(false);

  const { label: priorityLabel, cls: priorityCls, icon: priorityIcon } =
    PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleEditSubmit = (formData) => {
    onEdit(task._id, formData);
    setIsEditing(false);
  };

  const handleDeleteConfirm = () => {
    onDelete(task._id);
    setConfirmOpen(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <li className="task-item task-item--editing">
        <TaskForm
          initialData={task}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditing(false)}
          isEdit
        />
      </li>
    );
  }

  return (
    <>
      <li className={`task-item card ${task.completed ? "task-item--completed" : ""}`}>
        {/* Left: checkbox + content */}
        <div className="task-item__main">
          <input
            type="checkbox"
            className="task-checkbox"
            checked={task.completed}
            onChange={() => onToggle(task._id)}
            aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
          />
          <div className="task-item__content">
            <span className="task-item__title">{task.title}</span>
            {task.description && (
              <p className="task-item__description">{task.description}</p>
            )}
            {/* Meta row: priority, category, due date */}
            <div className="task-meta">
              <span className={`badge ${priorityCls}`} title={`Priority: ${priorityLabel}`}>
                <FiFlag /> {priorityIcon} {priorityLabel}
              </span>
              {task.category && task.category !== "General" && (
                <span className="badge badge--category">
                  <FiTag /> {task.category}
                </span>
              )}
              <DueDateBadge dueDate={task.dueDate} />
              <span className="task-meta__date">
                {new Date(task.createdAt).toLocaleDateString(undefined, {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="task-item__actions">
          <button
            className="icon-btn icon-btn--edit"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit task: ${task.title}`}
            title="Edit"
          >
            <FiEdit2 />
          </button>
          <button
            className="icon-btn icon-btn--delete"
            onClick={() => setConfirmOpen(true)}
            aria-label={`Delete task: ${task.title}`}
            title="Delete"
          >
            <FiTrash2 />
          </button>
        </div>
      </li>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete task?"
        message={`"${task.title}" will be permanently removed.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

export default TaskItem;
