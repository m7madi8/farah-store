import '@/styles/admin.css';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getFirebaseAuth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { ADMIN_NAV_ITEMS } from './adminNav';
import { AdminHeader } from './AdminHeader';
import { AdminMenu } from './AdminMenu';
import { AdminBrandMark } from './AdminBrandMark';
import { AdminNavIcon } from './AdminNavIcons';
import { printApprovedSalesReport } from './adminPrint';
import { formatAdminFirestoreError } from './adminFirestoreError';

const navClass = ({ isActive }) => cn('admin-nav-link', isActive && 'is-active');

export function AdminLayout() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [printingSales, setPrintingSales] = useState(false);

  const labelByKey = {
    pending: t('admin.menuPending'),
    ready: t('admin.menuReady'),
    stats: t('admin.menuStats'),
    products: t('admin.menuProducts'),
  };

  async function handleLogout() {
    const auth = await getFirebaseAuth();
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    navigate('/admin/login', { replace: true });
  }

  async function handlePrintSales() {
    setPrintingSales(true);
    try {
      await printApprovedSalesReport({ t, lang });
    } catch (err) {
      window.alert(formatAdminFirestoreError(err, t));
    } finally {
      setPrintingSales(false);
    }
  }

  return (
    <div className="admin-app admin-shell font-ui text-foreground">
      <aside className="admin-sidebar admin-sidebar--desktop">
        <div className="admin-sidebar-brand">
          <AdminBrandMark />
        </div>
        <p className="admin-nav-section-label">{t('admin.menuNav')}</p>
        <nav className="admin-nav" aria-label={t('admin.title')}>
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink key={item.key} to={item.path} className={navClass}>
              <AdminNavIcon type={item.icon} />
              {labelByKey[item.key]}
            </NavLink>
          ))}
        </nav>
        <p className="admin-nav-section-label admin-nav-section-label--footer">{t('admin.menuTools')}</p>
        <div className="admin-sidebar-footer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="admin-btn-ghost admin-btn-print-sidebar w-full"
            disabled={printingSales}
            onClick={handlePrintSales}
          >
            <AdminNavIcon type="print" />
            {printingSales ? t('admin.loading') : t('admin.printSalesReport')}
          </Button>
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
