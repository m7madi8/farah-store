import { AdminEmptyState } from './AdminEmptyState';

export function AdminStatusDistribution({ pending, approved, total, t, emptyTitle, emptyBody }) {
  const pendingPct = total ? (pending / total) * 100 : 0;
  const approvedPct = total ? (approved / total) * 100 : 0;

  return (
    <section className="admin-panel admin-chart-panel">
      <header className="admin-panel-head">
        <div>
          <h3>{t('admin.chartStatus')}</h3>
          <p>{t('admin.chartStatusHint')}</p>
        </div>
      </header>
      <div className="admin-panel-body admin-panel-body--padded">
        {!total ? (
          <AdminEmptyState title={emptyTitle} body={emptyBody} />
        ) : (
          <div className="admin-status-dist">
            <div
              className="admin-status-bar"
              role="img"
              aria-label={`${t('admin.statPending')}: ${pending}. ${t('admin.statApproved')}: ${approved}.`}
            >
              {approved > 0 ? (
                <span className="admin-status-bar-seg is-approved" style={{ width: `${approvedPct}%` }} />
              ) : null}
              {pending > 0 ? (
                <span className="admin-status-bar-seg is-pending" style={{ width: `${pendingPct}%` }} />
              ) : null}
            </div>
            <ul className="admin-status-legend">
              <li>
                <span className="admin-status-dot is-approved" />
                <span>
                  {t('admin.statApproved')}
                  <strong>{approved}</strong>
                </span>
                <em>{Math.round(approvedPct)}%</em>
              </li>
              <li>
                <span className="admin-status-dot is-pending" />
                <span>
                  {t('admin.statPending')}
                  <strong>{pending}</strong>
                </span>
                <em>{Math.round(pendingPct)}%</em>
              </li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
