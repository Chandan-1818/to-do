// src/components/Skeleton.jsx
// Skeleton loaders for the task list — shown while data is being fetched.

// A single animated skeleton bar
function SkeletonBar({ width = "100%", height = "1rem", style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: "var(--radius-sm)", ...style }}
    />
  );
}

// One fake task card
function SkeletonTaskItem() {
  return (
    <div className="skeleton-card">
      <SkeletonBar width="1.25rem" height="1.25rem" style={{ borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <SkeletonBar width="65%" height="1rem" />
        <SkeletonBar width="40%" height="0.75rem" />
      </div>
      <SkeletonBar width="4rem" height="1.5rem" style={{ borderRadius: "var(--radius-pill)" }} />
    </div>
  );
}

// A stack of N skeleton task cards
function SkeletonList({ count = 5 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTaskItem key={i} />
      ))}
    </div>
  );
}

// Skeleton for the stats cards on the dashboard
function SkeletonStatCard() {
  return (
    <div className="skeleton-stat-card">
      <SkeletonBar width="2.5rem" height="2.5rem" style={{ borderRadius: "var(--radius)" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <SkeletonBar width="50%" height="0.75rem" />
        <SkeletonBar width="30%" height="1.25rem" />
      </div>
    </div>
  );
}

export { SkeletonBar, SkeletonTaskItem, SkeletonList, SkeletonStatCard };
