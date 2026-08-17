export function AdminDashboardSkeleton() {
  return (
    <div className="admin-dashboard-skeleton" aria-hidden>
      <div className="admin-kpi-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="admin-kpi-card admin-kpi-card--skeleton">
            <span className="admin-skeleton-line admin-skeleton-line--sm" />
            <span className="admin-skeleton-line admin-skeleton-line--lg" />
            <span className="admin-skeleton-line admin-skeleton-line--md" />
          </div>
        ))}
      </div>
      <div className="admin-dashboard-split">
        <div className="admin-panel admin-skeleton-panel">
          <span className="admin-skeleton-line admin-skeleton-line--md" />
          <span className="admin-skeleton-chart" />
        </div>
        <div className="admin-panel admin-skeleton-panel">
          <span className="admin-skeleton-line admin-skeleton-line--md" />
          <span className="admin-skeleton-chart admin-skeleton-chart--short" />
        </div>
      </div>
    </div>
  );
}
