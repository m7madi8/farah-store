import { Link } from 'react-router-dom';
import { formatMoney } from './salesStats';
import { AdminStatusBadge } from './AdminStatusBadge';
import { AdminEmptyState } from './AdminEmptyState';
import { normalizeOrderStatus } from './orderUtils';

function formatWhen(iso, locale) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(iso);
  }
}

export function AdminActivityFeed({ items, t, lang }) {
  return (
    <section className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h3>{t('admin.activityTitle')}</h3>
          <p>{t('admin.activitySub')}</p>
        </div>
      </header>
      <div className="admin-panel-body">
        {!items?.length ? (
          <AdminEmptyState title={t('admin.activityEmpty')} />
        ) : (
          <ul className="admin-activity-list">
            {items.map((item) => {
              const status = normalizeOrderStatus(item.status);
              const href = status === 'pending' ? '/admin/pending' : '/admin/approved';
              return (
                <li key={item.id}>
                  <Link to={href} className="admin-activity-item">
                    <span className={`admin-activity-mark is-${item.type}`} aria-hidden />
                    <span className="admin-activity-copy">
                      <strong>{item.type === 'approved' ? t('admin.activityApproved') : t('admin.activityPending')}</strong>
                      <span>{item.customer}</span>
                      <span className="admin-activity-side">
                        <span className="admin-activity-total">{formatMoney(item.total)}</span>
                        <time dateTime={item.createdAt}>{formatWhen(item.createdAt, lang)}</time>
                        <AdminStatusBadge status={item.status} label={t(`admin.status.${status}`)} />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
