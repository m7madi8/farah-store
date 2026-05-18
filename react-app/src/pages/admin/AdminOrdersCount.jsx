export function AdminOrdersCount({ count, label, loading }) {
  return (
    <div className="admin-orders-count" aria-live="polite" aria-atomic="true">
      <span className="admin-orders-count-value" aria-busy={loading}>
        {loading ? '…' : count}
      </span>
      <span className="admin-orders-count-label">{label}</span>
    </div>
  );
}
