import { Link } from 'react-router-dom';
import { AdminNavIcon } from './AdminNavIcons';

export function AdminQuickActions({ pendingCount, onPrint, printing, t }) {
  return (
    <section className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h3>{t('admin.quickActions')}</h3>
        </div>
      </header>
      <div className="admin-panel-body admin-panel-body--padded">
        <div className="admin-quick-grid">
          <Link to="/admin/pending" className="admin-quick-action">
            <AdminNavIcon type="pending" />
            <span>
              {t('admin.quickPending')}
              {pendingCount > 0 ? <em>{pendingCount}</em> : null}
            </span>
          </Link>
          <Link to="/admin/approved" className="admin-quick-action">
            <AdminNavIcon type="ready" />
            <span>{t('admin.quickApproved')}</span>
          </Link>
          <Link to="/admin/products" className="admin-quick-action">
            <AdminNavIcon type="products" />
            <span>{t('admin.quickProducts')}</span>
          </Link>
          <button type="button" className="admin-quick-action" disabled={printing} onClick={onPrint}>
            <AdminNavIcon type="print" />
            <span>{printing ? t('admin.exportingPdf') : t('admin.quickReport')}</span>
          </button>
          <a href="/" className="admin-quick-action">
            <AdminNavIcon type="store" />
            <span>{t('admin.quickStore')}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
