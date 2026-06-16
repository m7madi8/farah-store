import { useAdminLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/cn';

export function AdminBrandMark({ compact = false, as = 'div' }) {
  const { t } = useAdminLanguage();
  const Tag = as;

  return (
    <Tag className={cn('admin-brand-mark', compact && 'admin-brand-mark--compact')}>
      <img src="/img/logo.webp" alt="" className="admin-brand-logo" width={compact ? 36 : 44} height={compact ? 36 : 44} />
      <div className="admin-brand-text">
        <span className="admin-brand-title">{t('admin.title')}</span>
        {!compact ? <span className="admin-brand-sub">{t('admin.brandSub')}</span> : null}
      </div>
    </Tag>
  );
}
