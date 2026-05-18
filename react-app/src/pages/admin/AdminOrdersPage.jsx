import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { AdminStatusBadge } from './AdminStatusBadge';
import { AdminConfirmDialog } from './AdminConfirmDialog';
import { isApprovedOrder, isPendingOrder, normalizeOrderStatus } from './orderUtils';

function formatWhen(iso, locale) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar' : 'en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return String(iso);
  }
}

function statusLabel(status, t) {
  const key = normalizeOrderStatus(status);
  return t(`admin.status.${key}`);
}

function OrderDetailRow({ label, value, href }) {
  if (value == null || value === '') return null;
  return (
    <div className="admin-order-detail-row">
      <dt>{label}</dt>
      <dd>
        {href ? (
          <a href={href} className="admin-order-link">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function OrderCard({
  order,
  expanded,
  onToggle,
  onDelete,
  onApprove,
  deleting,
  approving,
  t,
  lang,
}) {
  const items = order.order_items || [];
  const itemsSummary = items.map((it) => `${it.product_name || '—'} ×${it.quantity}`).join(' · ');
  const pending = isPendingOrder(order);

  return (
    <article className={`admin-order-card${expanded ? ' is-expanded' : ''}${pending ? ' admin-order-card--pending' : ' admin-order-card--approved'}`}>
      <div className="admin-order-card-head">
        <div className="admin-order-card-meta">
          <h3 className="admin-order-name">{order.customer_name || '—'}</h3>
          <p className="admin-order-when">{formatWhen(order.created_at, lang)}</p>
        </div>
        <div className="admin-order-card-side">
          <span className="admin-order-total">₪ {Number(order.total || 0).toFixed(2)}</span>
          <AdminStatusBadge status={order.status} label={statusLabel(order.status, t)} />
        </div>
      </div>

      {!expanded && itemsSummary ? <p className="admin-order-preview">{itemsSummary}</p> : null}

      {expanded ? (
        <dl className="admin-order-details">
          <OrderDetailRow label={t('admin.colPhone')} value={order.customer_phone} href={`tel:${order.customer_phone}`} />
          <OrderDetailRow label={t('admin.colAddress')} value={order.shipping_address} />
          <OrderDetailRow label={t('admin.colDate')} value={formatWhen(order.created_at, lang)} />
          <OrderDetailRow label={t('admin.colTotal')} value={`₪ ${Number(order.total || 0).toFixed(2)}`} />
          <OrderDetailRow label={t('admin.colStatus')} value={statusLabel(order.status, t)} />
          {order.notes ? <OrderDetailRow label={t('admin.colNotes')} value={order.notes} /> : null}
          <OrderDetailRow label={t('admin.paymentMethod')} value={order.payment_method === 'cod' ? t('admin.paymentCod') : order.payment_method} />
          {items.length > 0 ? (
            <div className="admin-order-detail-row admin-order-detail-row--block">
              <dt>{t('admin.colItems')}</dt>
              <dd>
                <ul className="admin-order-items-list">
                  {items.map((it) => (
                    <li key={it.id}>
                      <span>{it.product_name || '—'}</span>
                      <span className="admin-order-item-qty">
                        ×{it.quantity} · ₪ {Number(it.unit_price || 0).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="admin-order-actions">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onToggle}>
          {expanded ? t('admin.hideOrder') : t('admin.viewOrder')}
        </Button>
        {pending && onApprove ? (
          <Button type="button" size="sm" className="flex-1" disabled={approving} onClick={onApprove}>
            {approving ? t('admin.approving') : t('admin.approveOrder')}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="flex-1"
          disabled={deleting}
          onClick={onDelete}
        >
          {deleting ? t('admin.deleting') : t('admin.deleteOrder')}
        </Button>
      </div>
    </article>
  );
}

function OrderList({ orders, emptyText, expandedId, setExpandedId, deletingId, approvingId, onDelete, onApprove, t, lang }) {
  if (!orders.length) {
    return <p className="admin-section-empty">{emptyText}</p>;
  }
  return (
    <ul className="admin-order-list">
      {orders.map((order) => (
        <li key={order.id}>
          <OrderCard
            order={order}
            expanded={expandedId === order.id}
            onToggle={() => setExpandedId((id) => (id === order.id ? null : order.id))}
            onDelete={() => onDelete(order)}
            onApprove={isPendingOrder(order) ? () => onApprove(order) : undefined}
            deleting={deletingId === order.id}
            approving={approvingId === order.id}
            t={t}
            lang={lang}
          />
        </li>
      ))}
    </ul>
  );
}

export function AdminOrdersPage() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sb = getSupabase();
      const { data: rows, error: qErr } = await sb
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      setData(rows ?? []);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const pendingOrders = useMemo(() => data.filter(isPendingOrder), [data]);
  const approvedOrders = useMemo(() => data.filter(isApprovedOrder), [data]);

  const stats = useMemo(() => {
    const pendingCount = pendingOrders.length;
    const approvedCount = approvedOrders.length;
    const approvedRevenue = approvedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return { pendingCount, approvedCount, approvedRevenue };
  }, [pendingOrders, approvedOrders]);

  async function confirmDelete() {
    if (!orderToDelete) return;
    const orderId = orderToDelete.id;
    setDeletingId(orderId);
    setError(null);
    try {
      const { data: deleted, error: delErr } = await getSupabase()
        .from('orders')
        .delete()
        .eq('id', orderId)
        .select('id');
      if (delErr) throw delErr;
      if (!deleted?.length) {
        throw new Error(t('admin.deleteFailed'));
      }
      setData((prev) => prev.filter((o) => o.id !== orderId));
      if (expandedId === orderId) setExpandedId(null);
      setOrderToDelete(null);
    } catch (e) {
      setError(e);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleApprove(order) {
    setApprovingId(order.id);
    setError(null);
    try {
      const { data: updated, error: upErr } = await getSupabase()
        .from('orders')
        .update({ status: 'approved' })
        .eq('id', order.id)
        .select('*, order_items(*)')
        .single();
      if (upErr) throw upErr;
      if (!updated) throw new Error(t('admin.approveFailed'));
      setData((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      setExpandedId(null);
    } catch (e) {
      setError(e);
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <>
      <header className="admin-page-header">
        <h2>{t('admin.ordersTitle')}</h2>
        <p>{t('admin.ordersSub')}</p>
      </header>

      <div className="admin-stats admin-stats--compact">
        <div className="admin-stat-card">
          <div className="admin-stat-label">{t('admin.statPending')}</div>
          <div className="admin-stat-value">{stats.pendingCount}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">{t('admin.statApproved')}</div>
          <div className="admin-stat-value">{stats.approvedCount}</div>
        </div>
        <div className="admin-stat-card admin-stat-card--highlight">
          <div className="admin-stat-label">{t('admin.statApprovedRevenue')}</div>
          <div className="admin-stat-value">₪ {stats.approvedRevenue.toFixed(2)}</div>
        </div>
      </div>

      {isLoading ? <div className="admin-loading">{t('admin.loading')}</div> : null}
      {error ? <p className="admin-error">{error.message}</p> : null}

      {!isLoading ? (
        <>
          <section className="admin-section">
            <header className="admin-section-head">
              <h3>{t('admin.sectionPending')}</h3>
              <p>{t('admin.sectionPendingSub')}</p>
            </header>
            <div className="admin-panel admin-panel--flush">
              <div className="admin-panel-body admin-panel-body--padded">
                <OrderList
                  orders={pendingOrders}
                  emptyText={t('admin.emptyPending')}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  deletingId={deletingId}
                  approvingId={approvingId}
                  onDelete={setOrderToDelete}
                  onApprove={handleApprove}
                  t={t}
                  lang={lang}
                />
              </div>
            </div>
          </section>

          <section className="admin-section admin-section--approved">
            <header className="admin-section-head">
              <h3>{t('admin.sectionApproved')}</h3>
              <p>{t('admin.sectionApprovedSub')}</p>
            </header>
            <div className="admin-panel admin-panel--flush admin-panel--approved">
              <div className="admin-panel-body admin-panel-body--padded">
                <OrderList
                  orders={approvedOrders}
                  emptyText={t('admin.emptyApproved')}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  deletingId={deletingId}
                  approvingId={approvingId}
                  onDelete={setOrderToDelete}
                  onApprove={handleApprove}
                  t={t}
                  lang={lang}
                />
              </div>
            </div>
          </section>
        </>
      ) : null}

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
        onCancel={() => !deletingId && setOrderToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
