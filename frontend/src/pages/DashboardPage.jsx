// src/pages/DashboardPage.jsx
// Premium animated dashboard with Recharts: weekly completion bar chart,
// monthly trend area chart, priority bars, completion ring, and stat cards.

import { useState, useEffect } from "react";
import { Link }                        from "react-router-dom";
import { motion }                      from "framer-motion";
import {
  FiArrowRight, FiCheckCircle, FiClock,
  FiList, FiTrendingUp, FiTag, FiAlertTriangle, FiCalendar,
} from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area,
} from "recharts";
import { useAuth }       from "../context/AuthContext";
import { useToast }      from "../context/ToastContext";
import { tasksAPI }      from "../api";
import TaskItem          from "../components/TaskItem";
import TaskForm          from "../components/TaskForm";
import { SkeletonList, SkeletonStatCard } from "../components/Skeleton";

// ── Animated counter ─────────────────────────────────────────────────────────
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

// ── SVG progress ring ────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 120, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <motion.circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke="var(--brand)"
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

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, loading, delay = 0 }) {
  if (loading) return <SkeletonStatCard />;
  return (
    <motion.div
      className={`stat-card glass-card stat-card--${color}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 26 }}
      whileHover={{ y: -3, boxShadow: "var(--shadow-lg)" }}
    >
      <div className={`stat-card__icon stat-card__icon--${color}`}><Icon /></div>
      <div className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value"><AnimatedNumber value={value ?? 0} /></span>
      </div>
    </motion.div>
  );
}

// ── Custom chart tooltips ─────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill || p.stroke }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

export default function DashboardPage() {
  const { user }      = useAuth();
  const { showToast } = useToast();

  const [stats,        setStats]        = useState(null);
  const [recentTasks,  setRecentTasks]  = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [addLoading,   setAddLoading]   = useState(false);

  const fetchDashboard = async () => {
    try {
      setStatsLoading(true); setTasksLoading(true);
      const res = await tasksAPI.getStats();
      setStats(res.data.data);
      setRecentTasks(res.data.data.recentTasks || []);
    } catch {
      showToast("Failed to load dashboard", "error");
    } finally {
      setStatsLoading(false); setTasksLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleAddTask = async (formData) => {
    setAddLoading(true);
    try {
      await tasksAPI.create(formData);
      showToast("Task added!", "success");
      fetchDashboard();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add task", "error");
    } finally { setAddLoading(false); }
  };

  const handleToggle = async (id) => {
    const t = recentTasks.find((t) => t._id === id);
    if (!t) return;
    try { await tasksAPI.update(id, { completed: !t.completed }); fetchDashboard(); }
    catch { showToast("Update failed", "error"); }
  };

  const handleDelete = async (id) => {
    try { await tasksAPI.delete(id); showToast("Task deleted", "info"); fetchDashboard(); }
    catch { showToast("Delete failed", "error"); }
  };

  const handleEdit = async (id, data) => {
    try { await tasksAPI.update(id, data); showToast("Task updated", "success"); fetchDashboard(); }
    catch { showToast("Update failed", "error"); }
  };

  const pct = stats?.completionRate ?? 0;
  const weeklyData  = stats?.weeklyData  || [];
  const monthlyData = stats?.monthlyData || [];

  return (
    <div className="page dashboard-page">

      {/* ── Welcome banner ──────────────────────────────────────────── */}
      <motion.div className="dash-banner glass-card"
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
      >
        <div className="dash-banner__text">
          <h1 className="dash-banner__greeting">
            Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="dash-banner__sub">Here's your productivity snapshot.</p>
        </div>
        <div className="dash-banner__actions">
          <Link to="/tasks" className="btn btn--ghost btn--sm">
            All tasks <FiArrowRight />
          </Link>
          <Link to="/categories" className="btn btn--primary btn--sm">
            <FiTag /> Categories
          </Link>
        </div>
      </motion.div>

      {/* ── Stat cards — 6 cards with overdue + dueToday ─────────────── */}
      <div className="stats-grid stats-grid--6">
        <StatCard icon={FiList}          label="Total"     value={stats?.total}          color="blue"   loading={statsLoading} delay={0.05} />
        <StatCard icon={FiCheckCircle}   label="Completed" value={stats?.completed}       color="green"  loading={statsLoading} delay={0.09} />
        <StatCard icon={FiClock}         label="Pending"   value={stats?.pending}         color="yellow" loading={statsLoading} delay={0.13} />
        <StatCard icon={FiAlertTriangle} label="Overdue"   value={stats?.overdue}         color="red"    loading={statsLoading} delay={0.17} />
        <StatCard icon={FiCalendar}      label="Due Today" value={stats?.dueToday}        color="purple" loading={statsLoading} delay={0.21} />
        <StatCard icon={FiTrendingUp}    label="Progress"  value={pct}                    color="blue"   loading={statsLoading} delay={0.25} />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────── */}
      {!statsLoading && stats?.total > 0 && (
        <div className="dash-charts-row">

          {/* Weekly Completion Bar Chart */}
          {weeklyData.length > 0 && (
            <motion.div className="glass-card dash-chart-card"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              <p className="chart-section-label">Completed This Week</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--brand-subtle)" }} />
                  <Bar dataKey="completed" name="Completed" radius={[5, 5, 0, 0]} maxBarSize={36}>
                    {weeklyData.map((_, i) => (
                      <Cell key={i} fill="var(--brand)" fillOpacity={0.82} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Monthly Trend Area Chart */}
          {monthlyData.length > 0 && (
            <motion.div className="glass-card dash-chart-card"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 }}
            >
              <p className="chart-section-label">12-Month Trend</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="areaDone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BarTooltip />} />
                  <Area type="monotone" dataKey="created"   name="Created"   stroke="#6366f1" strokeWidth={2} fill="url(#areaCreated)" dot={false} />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#22c55e" strokeWidth={2} fill="url(#areaDone)"    dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

        </div>
      )}

      {/* ── Progress ring + priority + categories ────────────────────── */}
      {!statsLoading && stats?.total > 0 && (
        <div className="dash-mid">
          <motion.div className="dash-ring glass-card"
            initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.30 }}
          >
            <h2 className="dash-ring__title">Overall</h2>
            <ProgressRing pct={pct} />
            <p className="dash-ring__sub">{stats.completed} / {stats.total} done</p>
          </motion.div>

          <motion.div className="dash-priority glass-card"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.34 }}
          >
            <h2 className="dash-priority__title">By Priority</h2>
            {[
              { key: "high",   label: "High",   color: "#ef4444" },
              { key: "medium", label: "Medium", color: "#f59e0b" },
              { key: "low",    label: "Low",    color: "#22c55e" },
            ].map(({ key, label, color }) => {
              const count  = stats.priorityCounts?.[key] ?? 0;
              const barPct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={key} className="dash-priority__row">
                  <span className="dash-priority__label">{label}</span>
                  <div className="dash-priority__track">
                    <motion.div className="dash-priority__fill"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.75, ease: "easeOut", delay: 0.38 }}
                    />
                  </div>
                  <span className="dash-priority__count">{count}</span>
                </div>
              );
            })}
          </motion.div>

          {stats.categoryStats?.length > 0 && (
            <motion.div className="dash-cats glass-card"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.38 }}
            >
              <h2 className="dash-cats__title">Top Categories</h2>
              {stats.categoryStats.map(({ _id, name, color, count }) => (
                <div key={_id} className="dash-cats__row">
                  <span className="dash-cats__dot" style={{ background: color || "var(--brand)" }} />
                  <span className="dash-cats__name">{name || "—"}</span>
                  <span className="dash-cats__count">{count}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* ── Quick add ────────────────────────────────────────────────── */}
      <section>
        <h2 className="section-title">Quick Add</h2>
        <TaskForm onSubmit={handleAddTask} loading={addLoading} />
      </section>

      {/* ── Recent tasks ─────────────────────────────────────────────── */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Recent Tasks</h2>
          <Link to="/tasks" className="link link--sm">All tasks <FiArrowRight /></Link>
        </div>
        {tasksLoading ? (
          <SkeletonList count={4} />
        ) : recentTasks.length === 0 ? (
          <div className="empty-state glass-card">
            <FiList className="empty-state__icon" />
            <p className="empty-state__text">No tasks yet. Add one above!</p>
          </div>
        ) : (
          <ul className="task-list">
            {recentTasks.map((task) => (
              <TaskItem key={task._id} task={task}
                onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
