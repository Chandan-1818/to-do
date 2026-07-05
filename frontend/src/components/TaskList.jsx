// src/components/TaskList.jsx
// Animated filter chips, search bar, sort select, and paginated task list.

import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiInbox, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import TaskItem       from "./TaskItem";
import { SkeletonList } from "./Skeleton";
import { useCategories } from "../context/CategoryContext";

const STATUS_CHIPS = [
  { value: "all",       label: "All"       },
  { value: "pending",   label: "Pending"   },
  { value: "completed", label: "Completed" },
];
const PRIORITY_CHIPS = [
  { value: "",       label: "Any Priority" },
  { value: "high",   label: "🔴 High"      },
  { value: "medium", label: "🟡 Medium"    },
  { value: "low",    label: "🟢 Low"       },
];
const SORT_OPTIONS = [
  { value: "newest",   label: "Newest"   },
  { value: "oldest",   label: "Oldest"   },
  { value: "alpha",    label: "A → Z"    },
  { value: "priority", label: "Priority" },
  { value: "dueDate",  label: "Due Date" },
];

export default function TaskList({
  tasks, loading, total, page, totalPages,
  filters, onFilterChange, onPageChange,
  onToggle, onDelete, onEdit,
}) {
  const { categories } = useCategories();

  return (
    <div className="task-list-wrapper">
      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <div className="tl-search glass-card">
        <FiSearch className="tl-search__icon" />
        <input
          type="search"
          className="tl-search__input"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          aria-label="Search tasks"
        />
        {filters.search && (
          <button
            className="icon-btn tl-search__clear"
            onClick={() => onFilterChange("search", "")}
            aria-label="Clear search"
          >
            <FiX />
          </button>
        )}
      </div>

      {/* ── Filter + sort row ──────────────────────────────────────────── */}
      <div className="tl-filters">
        {/* Status chips */}
        <div className="tl-chips" role="group" aria-label="Filter by status">
          {STATUS_CHIPS.map(({ value, label }) => (
            <motion.button
              key={value}
              type="button"
              className={`chip${filters.status === value ? " chip--active" : ""}`}
              onClick={() => onFilterChange("status", value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {label}
              {filters.status === value && (
                <motion.span
                  layoutId="status-chip-bg"
                  className="chip__bg"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Priority chips */}
        <div className="tl-chips" role="group" aria-label="Filter by priority">
          {PRIORITY_CHIPS.map(({ value, label }) => (
            <motion.button
              key={value}
              type="button"
              className={`chip chip--sm${filters.priority === value ? " chip--active" : ""}`}
              onClick={() => onFilterChange("priority", value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {label}
            </motion.button>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <select
            className="input select select--sm"
            value={filters.category || ""}
            onChange={(e) => onFilterChange("category", e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            <option value="none">Uncategorised</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        )}

        {/* Sort */}
        <select
          className="input select select--sm tl-sort"
          value={filters.sort}
          onChange={(e) => onFilterChange("sort", e.target.value)}
          aria-label="Sort tasks"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* ── Results count ──────────────────────────────────────────────── */}
      {!loading && (
        <p className="tl-count">
          {total === 0
            ? "No tasks found"
            : `${total} task${total !== 1 ? "s" : ""}`}
          {page > 1 && ` · page ${page} of ${totalPages}`}
        </p>
      )}

      {/* ── List / skeleton / empty ─────────────────────────────────────── */}
      {loading ? (
        <SkeletonList count={5} />
      ) : tasks.length === 0 ? (
        <motion.div
          className="empty-state glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FiInbox className="empty-state__icon" />
          <h3 className="empty-state__title">No tasks here</h3>
          <p className="empty-state__text">
            {filters.search || filters.status !== "all" || filters.priority || filters.category
              ? "Try clearing some filters."
              : "Add your first task above!"}
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <ul className="task-list">
            {tasks.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </ul>
        </AnimatePresence>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn--ghost btn--sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <FiChevronLeft /> Prev
          </button>
          <div className="pagination__pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`btn btn--sm${p === page ? " btn--primary" : " btn--ghost"}`}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            className="btn btn--ghost btn--sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
