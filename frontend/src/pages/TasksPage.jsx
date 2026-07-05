// src/pages/TasksPage.jsx
// Full task management page.
// Reads ?category= from the URL so links from CategoryDetailPage pre-filter
// the list without any extra clicks.

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams }  from "react-router-dom";
import { useToast }         from "../context/ToastContext";
import { tasksAPI }         from "../api";
import TaskForm             from "../components/TaskForm";
import TaskList             from "../components/TaskList";

const LIMIT = 10;

export default function TasksPage() {
  const { showToast }      = useToast();
  const [searchParams]     = useSearchParams();

  // Seed the category filter from the URL query param (?category=<id>)
  const urlCategory = searchParams.get("category") || "";

  const [tasks,      setTasks]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [addLoading, setAddLoading] = useState(false);

  const [filters, setFilters] = useState({
    search:   "",
    status:   "all",
    sort:     "newest",
    priority: "",
    category: urlCategory,   // pre-fill from URL if present
  });

  // ── Keep a stable ref to the latest filters so fetchTasks never goes stale ──
  const filtersRef = useRef(filters);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  // ── Core fetch function ───────────────────────────────────────────────────
  const fetchTasks = useCallback(async (currentPage = 1, overrideFilters = null) => {
    const f = overrideFilters ?? filtersRef.current;
    setLoading(true);
    try {
      const res = await tasksAPI.getAll({ ...f, page: currentPage, limit: LIMIT });
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
  }, [showToast]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchTasks(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once — URL param already seeded into filters state

  // ── Re-fetch with debounce whenever filters change ────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => fetchTasks(1, filters), 300);
    return () => clearTimeout(timer);
  }, [filters, fetchTasks]);

  // ── Filter change handler ─────────────────────────────────────────────────
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // ── Add task ──────────────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    setAddLoading(true);
    try {
      await tasksAPI.create(formData);
      showToast("Task added!", "success");
      fetchTasks(1, filters);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add task", "error");
    } finally {
      setAddLoading(false);
    }
  };

  // ── Toggle completed ──────────────────────────────────────────────────────
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

  // ── Edit task ─────────────────────────────────────────────────────────────
  const handleEdit = async (id, data) => {
    try {
      const res = await tasksAPI.update(id, data);
      setTasks((prev) => prev.map((t) => (t._id === id ? res.data.data : t)));
      showToast("Task updated!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update task", "error");
    }
  };

  // ── Delete task ───────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await tasksAPI.delete(id);
      showToast("Task deleted", "info");
      // If we deleted the only item on this page go back one page
      const nextPage = tasks.length === 1 && page > 1 ? page - 1 : page;
      fetchTasks(nextPage, filters);
    } catch {
      showToast("Failed to delete task", "error");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page tasks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">
            Manage, filter, and organise everything in one place.
          </p>
        </div>
      </div>

      <TaskForm onSubmit={handleAdd} loading={addLoading} />

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
