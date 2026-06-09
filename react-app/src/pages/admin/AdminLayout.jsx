import '@/styles/admin.css';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { ADMIN_NAV_ITEMS } from './adminNav';
import { AdminHeader } from './AdminHeader';
import { AdminMenu } from './AdminMenu';
import { AdminNavIcon } from './AdminNavIcons';

const navClass = ({ isActive }) => cn('admin-nav-link', isActive && 'is-active');

export function AdminLayout() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const labelByKey = {
    pending: t('admin.menuPending'),
    ready: t('admin.menuReady'),
    stats: t('admin.menuStats'),
    products: t('admin.menuProducts'),
  };

  async function handleLogout() {
    await getSupabase().auth.signOut();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="admin-app admin-shell font-ui text-foreground">
      <aside className="admin-sidebar admin-sidebar--desktop">
        <div className="admin-sidebar-brand">
          <h1>{t('admin.title')}</h1>
          <p>{t('admin.brandSub')}</p>
        </div>
        <nav className="admin-nav" aria-label={t('admin.title')}>
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink key={item.key} to={item.path} className={navClass}>
              <AdminNavIcon type={item.icon} />
              {labelByKey[item.key]}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Button type="button" variant="outline" size="sm" className="admin-btn-ghost" asChild>
            <a href="/">{t('admin.backToStore')}</a>
          </Button>
          <Button type="button" variant="outline" size="sm" className="admin-btn-ghost" onClick={handleLogout}>
            {t('admin.logout')}
          </Button>
        </div>
      </aside>

      <div className="admin-content-column">
        <AdminHeader onMenuOpen={() => setMenuOpen(true)} />
        <AdminMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
