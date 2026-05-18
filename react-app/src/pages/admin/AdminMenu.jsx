import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getSupabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import { ADMIN_NAV_ITEMS } from './adminNav';
import { AdminNavIcon } from './AdminNavIcons';

export function AdminMenu({ open, onClose }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

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

  return (
    <div className="admin-menu-root" role="presentation">
      <button type="button" className="admin-menu-backdrop" aria-label={t('admin.menuClose')} onClick={onClose} />
      <nav className="admin-menu-drawer" aria-label={t('admin.menu')}>
        <div className="admin-menu-drawer-head">
          <h2>{t('admin.menu')}</h2>
          <button type="button" className="admin-menu-close" onClick={onClose} aria-label={t('admin.menuClose')}>
            ×
          </button>
        </div>
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
        <div className="admin-menu-footer">
          <a href="/" className="admin-menu-footer-link" onClick={onClose}>
            {t('admin.backToStore')}
          </a>
          <button
            type="button"
            className="admin-menu-footer-link admin-menu-footer-link--btn"
            onClick={async () => {
              onClose();
              await getSupabase().auth.signOut();
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
