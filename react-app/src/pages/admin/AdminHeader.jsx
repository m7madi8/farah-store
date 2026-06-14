import { useLanguage } from '@/context/LanguageContext';

export function AdminHeader({ onMenuOpen }) {
  const { t } = useLanguage();

  return (
    <header className="admin-topbar">
      <button
        type="button"
        className="admin-menu-toggle"
        onClick={onMenuOpen}
        aria-label={t('admin.menuOpen')}
        aria-expanded="false"
      >
        <span className="admin-menu-toggle-icon" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </button>
      <div className="admin-topbar-brand">
        <img src="/img/logo.webp" alt="" className="admin-topbar-logo" width={32} height={32} />
        <div>
          <h1>{t('admin.title')}</h1>
          <p>{t('admin.brandSub')}</p>
        </div>
      </div>
    </header>
  );
}
