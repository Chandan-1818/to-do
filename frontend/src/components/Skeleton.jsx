// src/components/Skeleton.jsx — shimmer skeletons for loading states

function SkeletonBar({ width = "100%", height = "1rem", style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: "var(--radius-sm)", ...style }}
    />
  );
}

function SkeletonTaskItem() {
  return (
    <div className="skeleton-card">
      <SkeletonBar width="1.1rem" height="1.1rem" style={{ borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <SkeletonBar width="62%" height="0.9rem" />
        <SkeletonBar width="38%" height="0.7rem" />
      </div>
      <SkeletonBar width="3.5rem" height="1.4rem" style={{ borderRadius: "var(--radius-pill)" }} />
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => <SkeletonTaskItem key={i} />)}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="skeleton-stat-card">
      <SkeletonBar width="2.25rem" height="2.25rem" style={{ borderRadius: "var(--radius)" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <SkeletonBar width="48%" height="0.7rem" />
        <SkeletonBar width="28%" height="1.1rem" />
      </div>
    </div>
  );
}

export function SkeletonCategoryCard() {
  return (
    <div className="skeleton-stat-card" style={{ height: "9rem" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.6rem", width: "100%" }}>
        <SkeletonBar width="2.5rem" height="2.5rem" style={{ borderRadius: "var(--radius)" }} />
        <SkeletonBar width="60%" height="1rem" />
        <SkeletonBar width="40%" height="0.7rem" />
      </div>
    </div>
  );
}

export { SkeletonBar, SkeletonTaskItem };
