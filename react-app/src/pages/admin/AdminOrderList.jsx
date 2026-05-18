import { Button } from '@/components/ui/button';
import { AdminStatusBadge } from './AdminStatusBadge';
import { isPendingOrder, normalizeOrderStatus } from './orderUtils';

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
  const pending = isPendingOrder(order);

  return (
    <article className={`admin-order-card${expanded ? ' is-expanded' : ''}${pending ? ' admin-order-card--pending' : ' admin-order-card--approved'}`}>
      <div className={`admin-order-card-head${expanded ? '' : ' admin-order-card-head--compact'}`}>
        <div className="admin-order-card-meta">
          <h3 className="admin-order-name">{order.customer_name || '—'}</h3>
          {expanded ? <p className="admin-order-when">{formatWhen(order.created_at, lang)}</p> : null}
        </div>
        {expanded ? (
          <div className="admin-order-card-side">
            <span className="admin-order-total">₪ {Number(order.total || 0).toFixed(2)}</span>
            <AdminStatusBadge status={order.status} label={statusLabel(order.status, t)} />
          </div>
        ) : null}
      </div>

      {pending && onApprove ? (
        <Button
          type="button"
          size="sm"
          className="admin-btn-accept w-full"
          disabled={approving}
          onClick={onApprove}
        >
          {approving ? t('admin.accepting') : t('admin.acceptOrder')}
        </Button>
      ) : null}

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

export function AdminOrderList({
  orders,
  emptyText,
  expandedId,
  setExpandedId,
  deletingId,
  approvingId,
  onDelete,
  onApprove,
  t,
  lang,
}) {
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
