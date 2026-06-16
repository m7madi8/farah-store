import { useMemo } from 'react';
import { useAdminLanguage } from '@/context/LanguageContext';
import { AdminOrderDeleteDialog } from './AdminOrderDeleteDialog';
import { AdminOrderList } from './AdminOrderList';
import { isApprovedOrder } from './orderUtils';
import { useAdminOrderActions } from './useAdminOrderActions';
import { AdminOrdersCount } from './AdminOrdersCount';
import { useAdminOrders } from './useAdminOrders';

export function AdminApprovedPage() {
  const { t, lang } = useAdminLanguage();
  const { data, setData, isLoading, error, setError } = useAdminOrders();
  const actions = useAdminOrderActions({ setData, setError, t });
  const approvedOrders = useMemo(() => data.filter(isApprovedOrder), [data]);

  return (
    <>
      <header className="admin-page-header admin-page-header--with-count">
        <div>
          <h2>{t('admin.menuReady')}</h2>
          <p>{t('admin.sectionApprovedSub')}</p>
        </div>
        <AdminOrdersCount count={approvedOrders.length} label={t('admin.ordersCountTotal')} loading={isLoading} />
      </header>

      {isLoading ? <div className="admin-loading">{t('admin.loading')}</div> : null}
      {error ? <p className="admin-error">{error.message}</p> : null}

      {!isLoading ? (
        <div className="admin-panel admin-panel--flush admin-panel--approved">
          <div className="admin-panel-body admin-panel-body--padded">
            <AdminOrderList
              orders={approvedOrders}
              emptyText={t('admin.emptyApproved')}
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
