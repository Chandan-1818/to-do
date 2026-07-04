// src/pages/DashboardPage.jsx
// Main dashboard: welcome banner, stat cards, recent tasks, and quick-add form.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiPlus } from "react-icons/fi";
import { useAuth }  from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { tasksAPI } from "../api";
import Stats    from "../components/Stats";
import TaskItem from "../components/TaskItem";
import TaskForm from "../components/TaskForm";
import { SkeletonList } from "../components/Skeleton";

function DashboardPage() {
  const { user }      = useAuth();
  const { showToast } = useToast();

  const [stats,         setStats]         = useState(null);
  const [recentTasks,   setRecentTasks]   = useState([]);
  const [statsLoading,  setStatsLoading]  = useState(true);
  const [tasksLoading,  setTasksLoading]  = useState(true);
  const [addLoading,    setAddLoading]    = useState(false);

  // ── Fetch dashboard data ───────────────────────────────────────────────────
  const fetchDashboard = async () => {
    try {
      setStatsLoading(true);
      setTasksLoading(true);
      const res = await tasksAPI.getStats();
      setStats(res.data.data);
      setRecentTasks(res.data.data.recentTasks || []);
    } catch {
      showToast("Failed to load dashboard data", "error");
    } finally {
      setStatsLoading(false);
      setTasksLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  // ── Quick-add task ─────────────────────────────────────────────────────────
  const handleAddTask = async (formData) => {
    setAddLoading(true);
    try {
      await tasksAPI.create(formData);
      showToast("Task added!", "success");
      fetchDashboard(); // refresh stats and recent list
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add task", "error");
    } finally {
      setAddLoading(false);
    }
  };

  // ── Toggle / delete / edit for recent tasks ────────────────────────────────
  const handleToggle = async (id) => {
    const task = recentTasks.find((t) => t._id === id);
    if (!task) return;
    try {
      await tasksAPI.update(id, { completed: !task.completed });
      fetchDashboard();
    } catch { showToast("Update failed", "error"); }
  };

  const handleDelete = async (id) => {
    try {
      await tasksAPI.delete(id);
      showToast("Task deleted", "info");
      fetchDashboard();
    } catch { showToast("Delete failed", "error"); }
  };

  const handleEdit = async (id, data) => {
    try {
      await tasksAPI.update(id, data);
      showToast("Task updated", "success");
      fetchDashboard();
    } catch { showToast("Update failed", "error"); }
  };

  // ── Progress bar ───────────────────────────────────────────────────────────
  const pct = stats?.completionRate ?? 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page dashboard-page">
      {/* Welcome banner */}
      <div className="dashboard-banner">
        <div>
          <h1 className="page-title">
            Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="page-subtitle">Here's what's on your plate today.</p>
        </div>
        <Link to="/tasks" className="btn btn--primary">
          <FiPlus /> All Tasks
        </Link>
      </div>

      {/* Stats cards */}
      <Stats stats={stats} loading={statsLoading} />

      {/* Completion progress bar */}
      {!statsLoading && stats?.total > 0 && (
        <div className="progress-bar-wrapper card">
          <div className="progress-bar__header">
            <span>Overall Progress</span>
            <strong>{pct}%</strong>
          </div>
          <div className="progress-bar__track">
            <div
              className="progress-bar__fill"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Quick-add form */}
      <section>
        <h2 className="section-title">Quick Add</h2>
        <TaskForm onSubmit={handleAddTask} loading={addLoading} />
      </section>

      {/* Recent tasks */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Recent Tasks</h2>
          <Link to="/tasks" className="link link--sm">
            View all <FiArrowRight />
          </Link>
        </div>

        {tasksLoading ? (
          <SkeletonList count={3} />
        ) : recentTasks.length === 0 ? (
          <div className="empty-state card">
            <p className="empty-state__text">No recent tasks. Add one above!</p>
          </div>
        ) : (
          <ul className="task-list">
            {recentTasks.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// Helper: returns "morning", "afternoon", or "evening"
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

export default DashboardPage;
