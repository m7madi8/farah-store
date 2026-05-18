import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

export function AdminHeader({ onMenuOpen }) {
  const { t } = useLanguage();

  return (
    <header className="admin-topbar">
      <Button type="button" variant="outline" size="sm" className="admin-menu-toggle" onClick={onMenuOpen} aria-label={t('admin.menuOpen')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </Button>
      <div className="admin-topbar-brand">
        <h1>{t('admin.title')}</h1>
        <p>{t('admin.brandSub')}</p>
      </div>
    </header>
  );
}
