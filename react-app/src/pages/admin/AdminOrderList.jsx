import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AdminStatusBadge } from './AdminStatusBadge';
import { printOrderInvoice } from './adminPrint';
import { isPendingOrder, normalizeOrderStatus } from './orderUtils';
import {
  formatCoordinates,
  googleMapsDirectionsUrl,
  googleMapsViewUrl,
  hasValidLocation,
} from '@/lib/googleMaps';

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

function formatPrice(amount) {
  return `₪ ${Number(amount || 0).toFixed(2)}`;
}

function OrderDiscountPricing({ order, t, compact = false }) {
  if (!order.discount_code) return null;

  const subtotal = Number(order.subtotal ?? order.total ?? 0);
  const total = Number(order.total || 0);
  const discountAmount = Number(order.discount_amount || 0);

  return (
    <div className={`admin-order-pricing${compact ? ' admin-order-pricing--compact' : ''}`}>
      <div className="admin-order-pricing-code">
        <span className="admin-order-pricing-label">{t('admin.orderDiscountUsed')}</span>
        <span className="admin-order-discount-badge">
          {order.discount_code} −{order.discount_percent}%
        </span>
      </div>
      <div className="admin-order-pricing-rows">
        <div className="admin-order-pricing-row">
          <span>{t('admin.colPriceBeforeDiscount')}</span>
          <span className="admin-order-price-before">{formatPrice(subtotal)}</span>
        </div>
        {discountAmount > 0 ? (
          <div className="admin-order-pricing-row admin-order-pricing-row--discount">
            <span>{t('admin.colDiscount')}</span>
            <span>−{formatPrice(discountAmount)}</span>
          </div>
        ) : null}
        <div className="admin-order-pricing-row admin-order-pricing-row--final">
          <span>{t('admin.colPriceAfterDiscount')}</span>
          <span className="admin-order-price-after">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
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
  exportingImage,
  onExportImage,
  t,
  lang,
}) {
  const items = order.order_items || [];
  const pending = isPendingOrder(order);
  const hasLocation = hasValidLocation(order);
  const mapsViewUrl = hasLocation
    ? googleMapsViewUrl(order.location_lat, order.location_lng)
    : null;
  const mapsDirectionsUrl = hasLocation
    ? googleMapsDirectionsUrl(order.location_lat, order.location_lng)
    : null;
  const hasDiscount = Boolean(order.discount_code);
  const orderTotal = Number(order.total || 0);

  return (
    <article className={`admin-order-card${expanded ? ' is-expanded' : ''}${pending ? ' admin-order-card--pending' : ' admin-order-card--approved'}`}>
      <div className={`admin-order-card-head${expanded ? '' : ' admin-order-card-head--compact'}`}>
        <div className="admin-order-card-meta">
          <div className="admin-order-card-title-row">
            <h3 className="admin-order-name">{order.customer_name || '—'}</h3>
            <time className="admin-order-when" dateTime={order.created_at || undefined}>
              {formatWhen(order.created_at, lang)}
            </time>
          </div>
          {!expanded && hasDiscount ? <OrderDiscountPricing order={order} t={t} compact /> : null}
        </div>
        {expanded ? (
          <div className="admin-order-card-side">
            {hasDiscount ? (
              <div className="admin-order-side-pricing">
                <span className="admin-order-price-before">{formatPrice(order.subtotal ?? orderTotal)}</span>
                <span className="admin-order-total">{formatPrice(orderTotal)}</span>
              </div>
            ) : (
              <span className="admin-order-total">{formatPrice(orderTotal)}</span>
            )}
            <AdminStatusBadge status={order.status} label={statusLabel(order.status, t)} />
          </div>
        ) : !hasDiscount ? (
          <div className="admin-order-card-side admin-order-card-side--compact">
            <span className="admin-order-total">{formatPrice(orderTotal)}</span>
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
          {hasLocation ? (
            <OrderDetailRow
              label={t('admin.colLocation')}
              value={formatCoordinates(order.location_lat, order.location_lng, lang)}
              href={mapsViewUrl}
            />
          ) : null}
          {hasDiscount ? (
            <div className="admin-order-detail-row admin-order-detail-row--block">
              <dt>{t('admin.colDiscountCode')}</dt>
              <dd>
                <OrderDiscountPricing order={order} t={t} />
              </dd>
            </div>
          ) : (
            <OrderDetailRow label={t('admin.colTotal')} value={formatPrice(orderTotal)} />
          )}
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
        {hasLocation ? (
          <Button
            type="button"
            size="sm"
            className="admin-btn-directions flex-1"
            asChild
          >
            <a
              href={mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-order-action-link"
            >
              {t('admin.getDirections')}
            </a>
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" className="admin-btn-toggle flex-1" onClick={onToggle}>
          {expanded ? t('admin.hideOrder') : t('admin.viewOrder')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="admin-btn-print flex-1"
          disabled={exportingImage}
          onClick={onExportImage}
        >
          {exportingImage ? t('admin.exportingImage') : t('admin.printInvoice')}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="admin-btn-delete flex-1"
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
  const [exportingImageId, setExportingImageId] = useState(null);

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
            exportingImage={exportingImageId === order.id}
            onExportImage={async () => {
              setExportingImageId(order.id);
              try {
                await printOrderInvoice(order);
              } catch {
                window.alert(t('admin.imageExportFailed'));
              } finally {
                setExportingImageId(null);
              }
            }}
            t={t}
            lang={lang}
          />
        </li>
      ))}
    </ul>
  );
}
