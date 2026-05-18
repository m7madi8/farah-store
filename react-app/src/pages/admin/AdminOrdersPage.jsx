import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { AdminStatusBadge } from './AdminStatusBadge';
import { AdminConfirmDialog } from './AdminConfirmDialog';

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

function OrderCard({ order, expanded, onToggle, onDelete, deleting, t, lang }) {
  const items = order.order_items || [];
  const itemsSummary = items.map((it) => `${it.product_name || '—'} ×${it.quantity}`).join(' · ');

  return (
    <article className={`admin-order-card${expanded ? ' is-expanded' : ''}`}>
      <div className="admin-order-card-head">
        <div className="admin-order-card-meta">
          <h3 className="admin-order-name">{order.customer_name || '—'}</h3>
          <p className="admin-order-when">{formatWhen(order.created_at, lang)}</p>
        </div>
        <div className="admin-order-card-side">
          <span className="admin-order-total">₪ {Number(order.total || 0).toFixed(2)}</span>
          <AdminStatusBadge status={order.status} />
        </div>
      </div>

      {!expanded && itemsSummary ? <p className="admin-order-preview">{itemsSummary}</p> : null}

      {expanded ? (
        <dl className="admin-order-details">
          <OrderDetailRow label={t('admin.colPhone')} value={order.customer_phone} href={`tel:${order.customer_phone}`} />
          <OrderDetailRow label={t('admin.colAddress')} value={order.shipping_address} />
          <OrderDetailRow label={t('admin.colDate')} value={formatWhen(order.created_at, lang)} />
          <OrderDetailRow label={t('admin.colTotal')} value={`₪ ${Number(order.total || 0).toFixed(2)}`} />
          <OrderDetailRow label={t('admin.colStatus')} value={order.status} />
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

export function AdminOrdersPage() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
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

  const stats = useMemo(() => {
    const totalOrders = data.length;
    const newOrders = data.filter((o) => String(o.status || 'new').toLowerCase() === 'new').length;
    const revenue = data.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return { totalOrders, newOrders, revenue };
  }, [data]);

  async function confirmDelete() {
    if (!orderToDelete) return;
    const orderId = orderToDelete.id;
    setDeletingId(orderId);
    setError(null);
    try {
      const { error: delErr } = await getSupabase().from('orders').delete().eq('id', orderId);
      if (delErr) throw delErr;
      setData((prev) => prev.filter((o) => o.id !== orderId));
      if (expandedId === orderId) setExpandedId(null);
      setOrderToDelete(null);
    } catch (e) {
      setError(e);
    } finally {
      setDeletingId(null);
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
          <div className="admin-stat-label">{t('admin.statTotalOrders')}</div>
          <div className="admin-stat-value">{stats.totalOrders}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">{t('admin.statNewOrders')}</div>
          <div className="admin-stat-value">{stats.newOrders}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">{t('admin.statRevenue')}</div>
          <div className="admin-stat-value">₪ {stats.revenue.toFixed(2)}</div>
        </div>
      </div>

      <section className="admin-panel admin-panel--flush">
        <div className="admin-panel-body admin-panel-body--padded">
          {isLoading ? <div className="admin-loading">{t('admin.loading')}</div> : null}
          {error ? <p className="admin-error">{error.message}</p> : null}
          {!isLoading && !error && data.length === 0 ? (
            <div className="admin-empty">
              <svg className="admin-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
              </svg>
              <p>{t('admin.emptyOrders')}</p>
            </div>
          ) : null}
          {!isLoading && !error && data.length > 0 ? (
            <ul className="admin-order-list">
              {data.map((order) => (
                <li key={order.id}>
                  <OrderCard
                    order={order}
                    expanded={expandedId === order.id}
                    onToggle={() => setExpandedId((id) => (id === order.id ? null : order.id))}
                    onDelete={() => setOrderToDelete(order)}
                    deleting={deletingId === order.id}
                    t={t}
                    lang={lang}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

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
