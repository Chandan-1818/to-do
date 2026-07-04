// src/pages/HomePage.jsx
// The main (and only) page of the app.
// Owns all state and orchestrates API calls via src/api.js.

import { useState, useEffect } from "react";
import { fetchTasks, createTask, updateTask, deleteTask } from "../api";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import Stats from "../components/Stats";

function HomePage() {
  // ── State ──────────────────────────────────────────────────────────────────────
  const [tasks, setTasks]       = useState([]);      // the list of task objects from the DB
  const [loading, setLoading]   = useState(true);    // true while the initial fetch is running
  const [submitting, setSubmitting] = useState(false); // true while add/edit/delete is in flight
  const [error, setError]       = useState(null);    // error message string, or null
  const [success, setSuccess]   = useState(null);    // success message string, or null

  // ── Helpers ────────────────────────────────────────────────────────────────────

  // Show a success toast that auto-dismisses after 3 seconds
  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Show an error toast that auto-dismisses after 4 seconds
  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  // ── Fetch all tasks on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const res = await fetchTasks();
        setTasks(res.data.data); // { success, count, data: [...] }
      } catch (err) {
        showError("Could not load tasks. Is the backend running?");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []); // empty dependency array = runs once after the first render

  // ── Add a new task ─────────────────────────────────────────────────────────────
  const handleAdd = async (title) => {
    try {
      setSubmitting(true);
      const res = await createTask(title);
      // Prepend the new task so it appears at the top (matches server sort order)
      setTasks((prev) => [res.data.data, ...prev]);
      showSuccess("Task added!");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to add task.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle completed / incomplete ─────────────────────────────────────────────
  const handleToggle = async (id) => {
    // Find the current task so we can flip its completed value
    const task = tasks.find((t) => t._id === id);
    if (!task) return;

    try {
      const res = await updateTask(id, { completed: !task.completed });
      // Replace only the updated task in the array (immutable update)
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? res.data.data : t))
      );
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update task.");
    }
  };

  // ── Edit task title ────────────────────────────────────────────────────────────
  const handleEdit = async (id, newTitle) => {
    try {
      const res = await updateTask(id, { title: newTitle });
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? res.data.data : t))
      );
      showSuccess("Task updated!");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update task.");
    }
  };

  // ── Delete a task ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    // Simple confirmation so the user doesn't accidentally delete tasks
    if (!window.confirm("Delete this task?")) return;

    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      showSuccess("Task deleted.");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete task.");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div className="container">
      <header className="app-header">
        <h1 className="app-title">✅ To-Do List</h1>
        <p className="app-subtitle">Stay organised, one task at a time.</p>
      </header>

      {/* Add task form */}
      <TaskForm onAdd={handleAdd} loading={submitting} />

      {/* Stats summary bar */}
      <Stats tasks={tasks} />

      {/* Feedback toasts */}
      {error   && <div className="alert alert-error"   role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}

      {/* Task list — or a loading spinner while fetching */}
      {loading ? (
        <div className="loading-wrapper" aria-busy="true" aria-label="Loading tasks">
          <div className="spinner"></div>
          <p>Loading tasks…</p>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}

export default HomePage;
