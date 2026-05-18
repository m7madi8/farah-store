import { AdminConfirmDialog } from './AdminConfirmDialog';

export function AdminOrderDeleteDialog({ orderToDelete, deletingId, onCancel, onConfirm, t }) {
  return (
    <AdminConfirmDialog
      open={!!orderToDelete}
      title={t('admin.deleteOrderTitle')}
      description={t('admin.deleteOrderConfirm')}
      detail={
        orderToDelete
          ? `${orderToDelete.customer_name} · ₪ ${Number(orderToDelete.total || 0).toFixed(2)}`
          : ''
      }
      confirmLabel={t('admin.confirmDelete')}
      cancelLabel={t('admin.cancel')}
      loading={!!orderToDelete && deletingId === orderToDelete.id}
      loadingLabel={t('admin.deleting')}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
