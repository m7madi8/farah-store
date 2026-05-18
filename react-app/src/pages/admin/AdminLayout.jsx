import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

const navClass = ({ isActive }) => cn('admin-nav-link', isActive && 'is-active');

function IconOrders() {
  return (
    <svg className="admin-nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function IconProducts() {
  return (
    <svg className="admin-nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

export function AdminLayout() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  async function handleLogout() {
    await getSupabase().auth.signOut();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="admin-app admin-shell font-ui text-foreground">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h1>{t('admin.title')}</h1>
          <p>{t('admin.brandSub')}</p>
        </div>
        <nav className="admin-nav" aria-label={t('admin.title')}>
          <NavLink to="/admin/orders" className={navClass}>
            <IconOrders />
            {t('admin.orders')}
          </NavLink>
          <NavLink to="/admin/products" className={navClass}>
            <IconProducts />
            {t('admin.products')}
          </NavLink>
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
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
