import { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { AdminSalesStats } from './AdminSalesStats';
import { isApprovedOrder } from './orderUtils';
import { useAdminOrders } from './useAdminOrders';

export function AdminStatsPage() {
  const { t } = useLanguage();
  const { data, isLoading, error } = useAdminOrders();
  const approvedOrders = useMemo(() => data.filter(isApprovedOrder), [data]);

  return (
    <>
      <header className="admin-page-header">
        <h2>{t('admin.menuStats')}</h2>
        <p>{t('admin.statsSub')}</p>
      </header>

      {isLoading ? <div className="admin-loading">{t('admin.loading')}</div> : null}
      {error ? <p className="admin-error">{error.message}</p> : null}

      {!isLoading ? <AdminSalesStats approvedOrders={approvedOrders} showHeader={false} /> : null}
    </>
  );
}
