// src/components/Stats.jsx
// Dashboard statistics cards.

import { FiList, FiCheckCircle, FiClock, FiTrendingUp } from "react-icons/fi";
import { SkeletonStatCard } from "./Skeleton";

function StatCard({ icon: Icon, label, value, color, loading }) {
  if (loading) return <SkeletonStatCard />;
  return (
    <div className={`stat-card card stat-card--${color}`}>
      <div className={`stat-card__icon stat-card__icon--${color}`}>
        <Icon />
      </div>
      <div className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">{value}</span>
      </div>
    </div>
  );
}

function Stats({ stats, loading }) {
  return (
    <div className="stats-grid">
      <StatCard icon={FiList}        label="Total Tasks"    value={stats?.total          ?? "—"} color="blue"   loading={loading} />
      <StatCard icon={FiCheckCircle} label="Completed"      value={stats?.completed      ?? "—"} color="green"  loading={loading} />
      <StatCard icon={FiClock}       label="Pending"        value={stats?.pending        ?? "—"} color="yellow" loading={loading} />
      <StatCard icon={FiTrendingUp}  label="Completion"     value={loading ? "—" : `${stats?.completionRate ?? 0}%`} color="purple" loading={loading} />
    </div>
  );
}

export default Stats;
