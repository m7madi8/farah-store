import { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { AdminOrderDeleteDialog } from './AdminOrderDeleteDialog';
import { AdminOrderList } from './AdminOrderList';
import { isPendingOrder } from './orderUtils';
import { useAdminOrderActions } from './useAdminOrderActions';
import { AdminOrdersCount } from './AdminOrdersCount';
import { useAdminOrders } from './useAdminOrders';

export function AdminPendingPage() {
  const { t, lang } = useLanguage();
  const { data, setData, isLoading, error, setError } = useAdminOrders();
  const actions = useAdminOrderActions({ setData, setError, t });
  const pendingOrders = useMemo(() => data.filter(isPendingOrder), [data]);

  return (
    <>
      <header className="admin-page-header admin-page-header--with-count">
        <div>
          <h2>{t('admin.menuPending')}</h2>
          <p>{t('admin.sectionPendingSub')}</p>
        </div>
        <AdminOrdersCount count={pendingOrders.length} label={t('admin.ordersCountTotal')} loading={isLoading} />
      </header>

      {isLoading ? <div className="admin-loading">{t('admin.loading')}</div> : null}
      {error ? <p className="admin-error">{error.message}</p> : null}

      {!isLoading ? (
        <div className="admin-panel admin-panel--flush">
          <div className="admin-panel-body admin-panel-body--padded">
            <AdminOrderList
              orders={pendingOrders}
              emptyText={t('admin.emptyPending')}
              expandedId={actions.expandedId}
              setExpandedId={actions.setExpandedId}
              deletingId={actions.deletingId}
              approvingId={actions.approvingId}
              onDelete={actions.setOrderToDelete}
              onApprove={actions.handleApprove}
              t={t}
              lang={lang}
            />
          </div>
        </div>
      ) : null}

      <AdminOrderDeleteDialog
        orderToDelete={actions.orderToDelete}
        deletingId={actions.deletingId}
        onCancel={() => !actions.deletingId && actions.setOrderToDelete(null)}
        onConfirm={actions.confirmDelete}
        t={t}
      />
    </>
  );
}
