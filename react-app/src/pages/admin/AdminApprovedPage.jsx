import { useMemo } from 'react';
import { useAdminLanguage } from '@/context/LanguageContext';
import { AdminOrderDeleteDialog } from './AdminOrderDeleteDialog';
import { AdminOrderList } from './AdminOrderList';
import { AdminOrderToolbar } from './AdminOrderToolbar';
import { AdminErrorBanner } from './AdminEmptyState';
import { isApprovedOrder } from './orderUtils';
import { useAdminOrderActions } from './useAdminOrderActions';
import { AdminOrdersCount } from './AdminOrdersCount';
import { useAdminOrders } from './useAdminOrders';
import { useOrderListView } from './useOrderListView';

export function AdminApprovedPage() {
  const { t, lang } = useAdminLanguage();
  const { data, setData, isLoading, error, setError, loadOrders } = useAdminOrders();
  const actions = useAdminOrderActions({ setData, setError, t });
  const approvedOrders = useMemo(() => data.filter(isApprovedOrder), [data]);
  const view = useOrderListView(approvedOrders);

  return (
    <>
      <header className="admin-page-header admin-page-header--with-count">
        <div>
          <h2>{t('admin.menuReady')}</h2>
          <p>{t('admin.sectionApprovedSub')}</p>
        </div>
        <AdminOrdersCount count={approvedOrders.length} label={t('admin.ordersCountTotal')} loading={isLoading} />
      </header>

      {error ? (
        <AdminErrorBanner message={error.message} onRetry={() => loadOrders()} retryLabel={t('admin.retry')} />
      ) : null}

      {isLoading && !approvedOrders.length ? <div className="admin-loading">{t('admin.loading')}</div> : null}

      {!isLoading || approvedOrders.length ? (
        <div className="admin-panel admin-panel--flush admin-panel--approved">
          <div className="admin-panel-body admin-panel-body--padded">
            <AdminOrderToolbar view={view} t={t} />
            <AdminOrderList
              orders={view.pageItems}
              emptyText={view.query ? t('admin.noSearchResults') : t('admin.emptyApproved')}
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
