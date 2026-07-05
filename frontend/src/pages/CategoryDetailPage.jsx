// src/pages/CategoryDetailPage.jsx
// Per-category analytics dashboard.
// Shows: header with icon+colour, 6 stat cards, animated completion ring,
// priority breakdown, weekly bar chart, and the tasks belonging to this category.

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link }              from "react-router-dom";
import { motion, AnimatePresence }                   from "framer-motion";
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiList,
  FiCheckCircle, FiClock, FiAlertCircle,
  FiCalendar, FiTrendingUp, FiAlertTriangle,
  FiFolder, FiBriefcase, FiHome, FiBook, FiHeart,
  FiShoppingCart, FiMusic, FiCamera, FiCode, FiStar,
  FiZap, FiGlobe, FiAward, FiTool, FiCoffee,
  FiTrello, FiFeather, FiSun,
} from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";

import { categoriesAPI, tasksAPI } from "../api";
import { useToast }                from "../context/ToastContext";
import { useCategories }           from "../context/CategoryContext";
import { SkeletonStatCard, SkeletonList } from "../components/Skeleton";
import CategoryFormModal           from "../components/CategoryFormModal";
import ConfirmDialog               from "../components/ConfirmDialog";
import TaskItem                    from "../components/TaskItem";

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_MAP = {
  FiFolder, FiBriefcase, FiHome, FiBook, FiHeart,
  FiShoppingCart, FiMusic, FiCamera, FiCode, FiStar,
  FiZap, FiGlobe, FiAward, FiTool, FiCoffee,
  FiTrello, FiFeather, FiSun,
};

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 700 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) { setDisplay(0); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(t * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span>{display}</span>;
}

// ── Circular progress ring ────────────────────────────────────────────────────
function ProgressRing({ pct, color = "#6366f1", size = 120, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <motion.circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c}
        animate={{ strokeDashoffset: c - (pct / 100) * c }}
        transition={{ duration: 1.0, ease: "easeOut" }}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        fill="var(--text)" fontSize="1.15rem" fontWeight="800">{pct}%</text>
    </svg>
  );
}

// ── Stat mini-card ────────────────────────────────────────────────────────────
function MiniStat({ icon: Icon, label, value, color, loading, delay = 0 }) {
  if (loading) return <SkeletonStatCard />;
  return (
    <motion.div
      className={`stat-card glass-card stat-card--${color}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 26 }}
      whileHover={{ y: -2, boxShadow: "var(--shadow-lg)" }}
    >
      <div className={`stat-card__icon stat-card__icon--${color}`}><Icon /></div>
      <div className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value"><AnimatedNumber value={value ?? 0} /></span>
      </div>
    </motion.div>
  );
}

// ── Custom bar tooltip ────────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Priority Doughnut tooltip ──────────────────────────────────────────────────
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p>{payload[0].name}: <strong>{payload[0].value}</strong></p>
    </div>
  );
}

export default function CategoryDetailPage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { showToast } = useToast();
  const { removeCategory, updateCategory } = useCategories();

  const [catData,     setCatData]     = useState(null);
  const [catLoading,  setCatLoading]  = useState(true);
  const [tasks,       setTasks]       = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [editOpen,    setEditOpen]    = useState(false);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  // ── Fetch category analytics ──────────────────────────────────────────────
  const fetchCategory = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await categoriesAPI.getById(id);
      setCatData(res.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || "Category not found", "error");
      navigate("/categories");
    } finally {
      setCatLoading(false);
    }
  }, [id, navigate, showToast]);

  // ── Fetch tasks in this category ──────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const res = await tasksAPI.getAll({ category: id, limit: 50 });
      setTasks(res.data.data || []);
    } catch {
      showToast("Failed to load tasks", "error");
    } finally {
      setTasksLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchCategory();
    fetchTasks();
  }, [fetchCategory, fetchTasks]);

  // ── Task CRUD handlers ────────────────────────────────────────────────────
  const handleToggle = async (taskId) => {
    const t = tasks.find((x) => x._id === taskId);
    if (!t) return;
    try {
      const res = await tasksAPI.update(taskId, { completed: !t.completed });
      setTasks((prev) => prev.map((x) => x._id === taskId ? res.data.data : x));
      fetchCategory(); // refresh counts
    } catch { showToast("Update failed", "error"); }
  };

  const handleEdit = async (taskId, data) => {
    try {
      const res = await tasksAPI.update(taskId, data);
      setTasks((prev) => prev.map((x) => x._id === taskId ? res.data.data : x));
      showToast("Task updated!", "success");
      fetchCategory();
    } catch { showToast("Update failed", "error"); }
  };

  const handleDelete = async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      setTasks((prev) => prev.filter((x) => x._id !== taskId));
      showToast("Task deleted", "info");
      fetchCategory();
    } catch { showToast("Delete failed", "error"); }
  };

  // ── Delete category ────────────────────────────────────────────────────────
  const handleDeleteCategory = async () => {
    setDeleting(true);
    try {
      await categoriesAPI.delete(id);
      removeCategory(id);
      showToast("Category deleted", "info");
      navigate("/categories");
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  // ── Derived chart data ────────────────────────────────────────────────────
  const priorityPieData = catData
    ? [
        { name: "High",   value: catData.priorityCounts?.high   || 0, fill: "#ef4444" },
        { name: "Medium", value: catData.priorityCounts?.medium || 0, fill: "#f59e0b" },
        { name: "Low",    value: catData.priorityCounts?.low    || 0, fill: "#22c55e" },
      ].filter((d) => d.value > 0)
    : [];

  const CatIcon   = catData ? (ICON_MAP[catData.icon] || FiFolder) : FiFolder;
  const catColor  = catData?.color || "#6366f1";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page catdetail-page">
      {/* ── Back + header ─────────────────────────────────────────────── */}
      <div className="catdetail-header">
        <Link to="/categories" className="btn btn--ghost btn--sm catdetail-back">
          <FiArrowLeft /> Categories
        </Link>

        {catLoading ? (
          <div className="catdetail-title-skeleton">
            <div className="skeleton" style={{ width: "2.5rem", height: "2.5rem", borderRadius: "var(--radius)" }} />
            <div className="skeleton" style={{ width: "12rem", height: "1.5rem", borderRadius: "var(--radius-sm)" }} />
          </div>
        ) : catData && (
          <motion.div
            className="catdetail-title-row"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="catdetail-icon"
              style={{ background: catColor + "22", color: catColor }}
            >
              <CatIcon />
            </div>
            <div>
              <h1 className="catdetail-name" style={{ color: catColor }}>{catData.name}</h1>
              {catData.description && (
                <p className="catdetail-desc">{catData.description}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="catdetail-actions">
          <motion.button
            className="btn btn--ghost btn--sm"
            onClick={() => setEditOpen(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            disabled={catLoading}
          >
            <FiEdit2 /> Edit
          </motion.button>
          <motion.button
            className="btn btn--danger btn--sm"
            onClick={() => setDeleteOpen(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            disabled={catLoading}
          >
            <FiTrash2 /> Delete
          </motion.button>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="stats-grid stats-grid--6">
        <MiniStat icon={FiList}          label="Total"     value={catData?.taskCount}      color="blue"   loading={catLoading} delay={0.05} />
        <MiniStat icon={FiCheckCircle}   label="Done"      value={catData?.completedCount} color="green"  loading={catLoading} delay={0.09} />
        <MiniStat icon={FiClock}         label="Pending"   value={catData?.pendingCount}   color="yellow" loading={catLoading} delay={0.13} />
        <MiniStat icon={FiAlertTriangle} label="Overdue"   value={catData?.overdueCount}   color="red"    loading={catLoading} delay={0.17} />
        <MiniStat icon={FiCalendar}      label="Due Today" value={catData?.dueTodayCount}  color="purple" loading={catLoading} delay={0.21} />
        <MiniStat icon={FiTrendingUp}    label="Rate"      value={catData?.completionRate} color="blue"   loading={catLoading} delay={0.25} />
      </div>

      {/* ── Middle row: ring + priority pie + weekly bar ──────────────── */}
      {!catLoading && catData?.taskCount > 0 && (
        <div className="catdetail-mid">
          {/* Completion ring */}
          <motion.div
            className="glass-card catdetail-ring-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.28 }}
          >
            <p className="chart-section-label">Completion</p>
            <ProgressRing pct={catData.completionRate} color={catColor} />
            <p className="catdetail-ring-sub">
              {catData.completedCount} of {catData.taskCount} done
            </p>
          </motion.div>

          {/* Priority doughnut */}
          {priorityPieData.length > 0 && (
            <motion.div
              className="glass-card catdetail-pie-card"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.33 }}
            >
              <p className="chart-section-label">Priority Split</p>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={priorityPieData}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={900}
                  >
                    {priorityPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {priorityPieData.map((d) => (
                  <span key={d.name} className="pie-legend__item">
                    <span className="pie-legend__dot" style={{ background: d.fill }} />
                    {d.name}: {d.value}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Weekly bar chart */}
          {catData.weeklyData?.length > 0 && (
            <motion.div
              className="glass-card catdetail-bar-card"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.38 }}
            >
              <p className="chart-section-label">Completed This Week</p>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={catData.weeklyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--brand-subtle)" }} />
                  <Bar dataKey="completed" name="Completed" radius={[4,4,0,0]} maxBarSize={32}>
                    {catData.weeklyData.map((_, i) => (
                      <Cell key={i} fill={catColor} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Tasks list ────────────────────────────────────────────────── */}
      <section className="catdetail-tasks">
        <div className="section-header">
          <h2 className="section-title">
            Tasks in this category
            {!tasksLoading && (
              <span className="catdetail-tasks__count"> · {tasks.length}</span>
            )}
          </h2>
          <Link to={`/tasks?category=${id}`} className="link link--sm">
            Manage all <FiList />
          </Link>
        </div>

        {tasksLoading ? (
          <SkeletonList count={4} />
        ) : tasks.length === 0 ? (
          <motion.div
            className="empty-state glass-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiList className="empty-state__icon" />
            <h3 className="empty-state__title">No tasks yet</h3>
            <p className="empty-state__text">
              Add tasks and assign this category to see them here.
            </p>
            <Link to="/tasks" className="btn btn--primary btn--sm">
              Go to Tasks
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <ul className="task-list">
              {tasks.map((task) => (
                <TaskItem
                  key={task._id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </ul>
          </AnimatePresence>
        )}
      </section>

      {/* Edit modal */}
      <CategoryFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editData={catData}
        onUpdated={(updated) => {
          updateCategory(updated);
          setCatData((prev) => ({ ...prev, ...updated }));
        }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        title={`Delete "${catData?.name}"?`}
        message="All tasks in this category will be unassigned. This cannot be undone."
        confirmLabel={deleting ? "Deleting…" : "Delete Category"}
        danger
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
