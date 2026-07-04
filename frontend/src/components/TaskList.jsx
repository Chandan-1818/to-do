// src/components/TaskList.jsx
// Renders the toolbar (search, filter, sort) and the paginated task list.

import { FiSearch, FiFilter, FiChevronLeft, FiChevronRight, FiInbox } from "react-icons/fi";
import TaskItem    from "./TaskItem";
import { SkeletonList } from "./Skeleton";

/**
 * TaskList
 * Props:
 *  tasks         - array of task objects for current page
 *  loading       - show skeleton while true
 *  total         - total tasks matching the current filter (for pagination)
 *  page          - current page number
 *  totalPages    - total number of pages
 *  filters       - { search, status, sort, priority }
 *  onFilterChange(name, value) - called when any filter changes
 *  onPageChange(n)             - called when page changes
 *  onToggle(id)
 *  onDelete(id)
 *  onEdit(id, data)
 */
function TaskList({
  tasks,
  loading,
  total,
  page,
  totalPages,
  filters,
  onFilterChange,
  onPageChange,
  onToggle,
  onDelete,
  onEdit,
}) {
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="task-list-wrapper">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="toolbar card">
        {/* Search */}
        <div className="toolbar__search">
          <FiSearch className="toolbar__search-icon" />
          <input
            type="search"
            className="input toolbar__search-input"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            aria-label="Search tasks"
          />
        </div>

        {/* Filter controls */}
        <div className="toolbar__filters">
          {/* Status filter */}
          <div className="filter-group">
            <FiFilter className="filter-group__icon" />
            <select
              className="input select select--sm"
              value={filters.status}
              onChange={(e) => onFilterChange("status", e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority filter */}
          <select
            className="input select select--sm"
            value={filters.priority}
            onChange={(e) => onFilterChange("priority", e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="">All Priorities</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          {/* Sort */}
          <select
            className="input select select--sm"
            value={filters.sort}
            onChange={(e) => onFilterChange("sort", e.target.value)}
            aria-label="Sort tasks"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alpha">A → Z</option>
            <option value="priority">By Priority</option>
            <option value="dueDate">By Due Date</option>
          </select>
        </div>
      </div>

      {/* ── Results count ───────────────────────────────────────────────── */}
      {!loading && (
        <p className="results-count">
          {total === 0
            ? "No tasks found"
            : `${total} task${total !== 1 ? "s" : ""} found`}
          {page > 1 && ` — page ${page} of ${totalPages}`}
        </p>
      )}

      {/* ── Task cards / skeleton / empty state ─────────────────────────── */}
      {loading ? (
        <SkeletonList count={5} />
      ) : tasks.length === 0 ? (
        <div className="empty-state card">
          <FiInbox className="empty-state__icon" />
          <h3 className="empty-state__title">No tasks here</h3>
          <p className="empty-state__text">
            {filters.search || filters.status !== "all" || filters.priority
              ? "Try adjusting your filters."
              : "Add your first task above to get started!"}
          </p>
        </div>
      ) : (
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
                className={`btn btn--sm ${p === page ? "btn--primary" : "btn--ghost"}`}
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

export default TaskList;
