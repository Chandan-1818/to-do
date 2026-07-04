// src/pages/TasksPage.jsx
// Full task management page with add form, search, filters, sort, and pagination.

import { useState, useEffect, useCallback } from "react";
import { useToast } from "../context/ToastContext";
import { tasksAPI } from "../api";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";

const DEFAULT_FILTERS = {
  search:   "",
  status:   "all",
  sort:     "newest",
  priority: "",
};

const LIMIT = 10; // tasks per page

function TasksPage() {
  const { showToast } = useToast();

  const [tasks,      setTasks]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS);

  // ── Fetch tasks whenever filters or page change ────────────────────────────
  const fetchTasks = useCallback(async (currentPage = 1, currentFilters = filters) => {
    setLoading(true);
    try {
      const res = await tasksAPI.getAll({
        ...currentFilters,
        page:  currentPage,
        limit: LIMIT,
      });
      const { data, total: t, totalPages: tp } = res.data;
      setTasks(t === 0 ? [] : data);
      setTotal(t);
      setTotalPages(tp);
      setPage(currentPage);
    } catch {
      showToast("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  // Initial load
  useEffect(() => { fetchTasks(1, filters); }, []);

  // Re-fetch when filters change (debounced for search)
  useEffect(() => {
    const timer = setTimeout(() => fetchTasks(1, filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // ── Filter change handler ──────────────────────────────────────────────────
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // ── Add task ───────────────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    setAddLoading(true);
    try {
      await tasksAPI.create(formData);
      showToast("Task added!", "success");
      fetchTasks(1, filters); // go back to page 1 to see the new task
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add task", "error");
    } finally {
      setAddLoading(false);
    }
  };

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    const task = tasks.find((t) => t._id === id);
    if (!task) return;
    try {
      const res = await tasksAPI.update(id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t._id === id ? res.data.data : t)));
    } catch {
      showToast("Failed to update task", "error");
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = async (id, data) => {
    try {
      const res = await tasksAPI.update(id, data);
      setTasks((prev) => prev.map((t) => (t._id === id ? res.data.data : t)));
      showToast("Task updated!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update task", "error");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await tasksAPI.delete(id);
      showToast("Task deleted", "info");
      // If we deleted the last item on this page, go back one
      const nextPage = tasks.length === 1 && page > 1 ? page - 1 : page;
      fetchTasks(nextPage, filters);
    } catch {
      showToast("Failed to delete task", "error");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page tasks-page">
      <div className="page-header">
        <h1 className="page-title">My Tasks</h1>
        <p className="page-subtitle">Manage, filter, and organise everything in one place.</p>
      </div>

      {/* Add task form */}
      <TaskForm onSubmit={handleAdd} loading={addLoading} />

      {/* Task list with toolbar */}
      <TaskList
        tasks={tasks}
        loading={loading}
        total={total}
        page={page}
        totalPages={totalPages}
        filters={filters}
        onFilterChange={handleFilterChange}
        onPageChange={(p) => fetchTasks(p, filters)}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    </div>
  );
}

export default TasksPage;
