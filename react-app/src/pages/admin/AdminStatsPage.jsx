import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { AdminSalesStats } from './AdminSalesStats';
import { printApprovedSalesReport } from './adminPrint';
import { formatAdminFirestoreError } from './adminFirestoreError';
import { isApprovedOrder } from './orderUtils';
import { useAdminOrders } from './useAdminOrders';

export function AdminStatsPage() {
  const { t, lang } = useLanguage();
  const { data, isLoading, error } = useAdminOrders();
  const [printing, setPrinting] = useState(false);
  const approvedOrders = useMemo(() => data.filter(isApprovedOrder), [data]);

  async function handlePrint() {
    setPrinting(true);
    try {
      await printApprovedSalesReport({ t, lang });
    } catch (err) {
      window.alert(formatAdminFirestoreError(err, t));
    } finally {
      setPrinting(false);
    }
  }

  return (
    <>
      <header className="admin-page-header admin-page-header--with-actions">
        <div>
          <h2>{t('admin.menuStats')}</h2>
          <p>{t('admin.statsSub')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="admin-btn-print-header"
          disabled={printing || isLoading}
          onClick={handlePrint}
        >
          {printing ? t('admin.loading') : t('admin.printSalesReport')}
        </Button>
      </header>

      {isLoading ? <div className="admin-loading">{t('admin.loading')}</div> : null}
      {error ? <p className="admin-error">{error.message}</p> : null}

      {!isLoading ? <AdminSalesStats approvedOrders={approvedOrders} showHeader={false} /> : null}
    </>
  );
}
