// src/components/TaskItem.jsx
// Premium animated task card with glass morphism, priority badge,
// category badge, due-date overdue indicator, and Framer Motion lift.

import { useState }             from "react";
import { motion }               from "framer-motion";
import { FiEdit2, FiTrash2, FiCalendar, FiFlag, FiCheckCircle, FiCircle } from "react-icons/fi";
import { getCategoryIcon }      from "../utils/categoryIcons";
import TaskForm                 from "./TaskForm";
import ConfirmDialog            from "./ConfirmDialog";

const PRIORITY = {
  high:   { label: "High",   cls: "badge--high",   dot: "#ef4444" },
  medium: { label: "Medium", cls: "badge--medium", dot: "#f59e0b" },
  low:    { label: "Low",    cls: "badge--low",     dot: "#22c55e" },
};

function DueBadge({ dueDate }) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  const t = new Date(); t.setHours(0,0,0,0);
  const overdue = d < t;
  return (
    <span className={`task-badge task-badge--due${overdue ? " task-badge--overdue" : ""}`}>
      <FiCalendar />
      {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      {overdue && " · Overdue"}
    </span>
  );
}

export default function TaskItem({ task, onToggle, onDelete, onEdit }) {
  const [isEditing,   setIsEditing]   = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const p = PRIORITY[task.priority] || PRIORITY.medium;

  // category can be either populated object or raw id
  const cat = task.category;

  if (isEditing) {
    return (
      <motion.li layout className="task-item--editing">
        <TaskForm
          initialData={task}
          onSubmit={(data) => { onEdit(task._id, data); setIsEditing(false); }}
          onCancel={() => setIsEditing(false)}
          isEdit
        />
      </motion.li>
    );
  }

  return (
    <>
      <motion.li
        layout
        className={`task-card glass-card${task.completed ? " task-card--done" : ""}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        whileHover={{ y: -2, boxShadow: "var(--shadow-lg)" }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        {/* Left: animated checkbox */}
        <motion.button
          className="task-card__check"
          onClick={() => onToggle(task._id)}
          whileTap={{ scale: 0.85 }}
          aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
        >
          <motion.div
            animate={{ scale: task.completed ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.25 }}
          >
            {task.completed
              ? <FiCheckCircle className="task-card__check-icon task-card__check-icon--done" />
              : <FiCircle      className="task-card__check-icon" />
            }
          </motion.div>
        </motion.button>

        {/* Centre: content */}
        <div className="task-card__body">
          <span className={`task-card__title${task.completed ? " task-card__title--done" : ""}`}>
            {task.title}
          </span>

          {task.description && (
            <p className="task-card__desc">{task.description}</p>
          )}

          {/* Badges row */}
          <div className="task-card__meta">
            {/* Priority */}
            <span className={`task-badge ${p.cls}`}>
              <span className="task-badge__dot" style={{ background: p.dot }} />
              {p.label}
            </span>

            {/* Category — icon + name + colour badge */}
            {cat && cat.name && (() => {
              const CatIcon = getCategoryIcon(cat.icon);
              return (
                <span
                  className="task-badge task-badge--cat"
                  style={{
                    background: (cat.color || "#6366f1") + "20",
                    color:      cat.color || "#6366f1",
                    borderColor: (cat.color || "#6366f1") + "40",
                  }}
                >
                  <CatIcon />
                  {cat.name}
                </span>
              );
            })()}

            {/* Due date */}
            <DueBadge dueDate={task.dueDate} />

            {/* Created */}
            <span className="task-card__date">
              {new Date(task.createdAt).toLocaleDateString(undefined, {
                month: "short", day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="task-card__actions">
          <motion.button
            className="icon-btn icon-btn--edit"
            onClick={() => setIsEditing(true)}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Edit task"
            title="Edit"
          >
            <FiEdit2 />
          </motion.button>
          <motion.button
            className="icon-btn icon-btn--delete"
            onClick={() => setConfirmOpen(true)}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Delete task"
            title="Delete"
          >
            <FiTrash2 />
          </motion.button>
        </div>
      </motion.li>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete task?"
        message={`"${task.title}" will be permanently removed.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => { onDelete(task._id); setConfirmOpen(false); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
