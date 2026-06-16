import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminLanguage } from '@/context/LanguageContext';
import { getFirebaseAuth } from '@/lib/firebase';
import { cn } from '@/lib/cn';
import { ADMIN_NAV_ITEMS } from './adminNav';
import { AdminBrandMark } from './AdminBrandMark';
import { AdminNavIcon } from './AdminNavIcons';
import { printApprovedSalesReport } from './adminPrint';

export function AdminMenu({ open, onClose }) {
  const { t, lang } = useAdminLanguage();
  const navigate = useNavigate();
  const [printingSales, setPrintingSales] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const labelByKey = {
    pending: t('admin.menuPending'),
    ready: t('admin.menuReady'),
    stats: t('admin.menuStats'),
    products: t('admin.menuProducts'),
  };

  if (!open) return null;

  async function handlePrintSales() {
    setPrintingSales(true);
    try {
      await printApprovedSalesReport({ t, lang });
      onClose();
    } catch {
      window.alert(t('admin.pdfExportFailed'));
    } finally {
      setPrintingSales(false);
    }
  }

  return (
    <div className="admin-menu-root" role="presentation">
      <button type="button" className="admin-menu-backdrop" aria-label={t('admin.menuClose')} onClick={onClose} />
      <nav className="admin-menu-drawer" aria-label={t('admin.menu')}>
        <div className="admin-menu-drawer-head">
          <AdminBrandMark compact />
          <button type="button" className="admin-menu-close" onClick={onClose} aria-label={t('admin.menuClose')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="admin-nav-section-label admin-nav-section-label--drawer">{t('admin.menuNav')}</p>
        <ul className="admin-menu-list">
          {ADMIN_NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <NavLink
                to={item.path}
                className={({ isActive }) => cn('admin-menu-item', isActive && 'is-active')}
                onClick={onClose}
              >
                <span className="admin-menu-item-icon">
                  <AdminNavIcon type={item.icon} />
                </span>
                {labelByKey[item.key]}
              </NavLink>
            </li>
          ))}
        </ul>
        <p className="admin-nav-section-label admin-nav-section-label--drawer">{t('admin.menuTools')}</p>
        <ul className="admin-menu-list admin-menu-list--actions">
          <li>
            <button
              type="button"
              className="admin-menu-item admin-menu-item--action"
              disabled={printingSales}
              onClick={handlePrintSales}
            >
              <span className="admin-menu-item-icon">
                <AdminNavIcon type="print" />
              </span>
              {printingSales ? t('admin.exportingPdf') : t('admin.printSalesReport')}
            </button>
          </li>
        </ul>
        <div className="admin-menu-footer">
          <a href="/" className="admin-menu-footer-link" onClick={onClose}>
            {t('admin.backToStore')}
          </a>
          <button
            type="button"
            className="admin-menu-footer-link admin-menu-footer-link--btn"
            onClick={async () => {
              onClose();
              const auth = await getFirebaseAuth();
              const { signOut } = await import('firebase/auth');
              await signOut(auth);
              navigate('/admin/login', { replace: true });
            }}
          >
            {t('admin.logout')}
          </button>
        </div>
      </nav>
    </div>
  );
}
