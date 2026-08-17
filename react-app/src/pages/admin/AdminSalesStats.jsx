import { useMemo, useState } from 'react';
import { useAdminLanguage } from '@/context/LanguageContext';
import { formatMoney } from './salesStats';
import { formatPercent } from './dashboardAnalytics';
import { AdminEmptyState } from './AdminEmptyState';

function HighlightProduct({ label, product, qtyLabel, t }) {
  if (!product) {
    return (
      <div className="admin-sales-highlight admin-sales-highlight--empty">
        <span className="admin-sales-highlight-label">{label}</span>
        <p>{t('admin.statsNoData')}</p>
      </div>
    );
  }
  return (
    <div className="admin-sales-highlight">
      <span className="admin-sales-highlight-label">{label}</span>
      <strong className="admin-sales-highlight-name">{product.name}</strong>
      <span className="admin-sales-highlight-meta">
        {qtyLabel}: {product.quantity} · {formatMoney(product.revenue)}
      </span>
    </div>
  );
}

export function AdminSalesStats({ products = [], topSeller, leastSeller, showHeader = true }) {
  const { t } = useAdminLanguage();
  const [sortKey, setSortKey] = useState('quantity');

  const rows = useMemo(() => {
    const list = [...products];
    list.sort((a, b) => {
      if (sortKey === 'revenue') return b.revenue - a.revenue || b.quantity - a.quantity;
      if (sortKey === 'share') return b.share - a.share || b.revenue - a.revenue;
      return b.quantity - a.quantity || b.revenue - a.revenue;
    });
    return list;
  }, [products, sortKey]);

  return (
    <section className="admin-sales-section">
      {showHeader ? (
        <header className="admin-section-head">
          <h3>{t('admin.statByProduct')}</h3>
          <p>{t('admin.statByProductHint')}</p>
        </header>
      ) : null}

      {!products.length ? (
        <div className="admin-panel">
          <AdminEmptyState title={t('admin.statsEmpty')} body={t('admin.emptyPeriodBody')} />
        </div>
      ) : (
        <>
          <div className="admin-sales-highlights">
            <HighlightProduct
              label={t('admin.statTopSeller')}
              product={topSeller}
              qtyLabel={t('admin.statUnitsSold')}
              t={t}
            />
            <HighlightProduct
              label={t('admin.statLeastSeller')}
              product={leastSeller}
              qtyLabel={t('admin.statUnitsSold')}
              t={t}
            />
          </div>

          <div className="admin-panel admin-panel--flush">
            <div className="admin-panel-head admin-panel-head--toolbar">
              <h3>{t('admin.statByProduct')}</h3>
              <label className="admin-sort-field">
                <span>{t('admin.sortBy')}</span>
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                  <option value="quantity">{t('admin.statUnitsSold')}</option>
                  <option value="revenue">{t('admin.statSales')}</option>
                  <option value="share">{t('admin.shareOfSales')}</option>
                </select>
              </label>
            </div>
            <ul className="admin-sales-product-list">
              {rows.map((p) => (
                <li key={p.key} className="admin-sales-product-row">
                  <div className="admin-sales-product-main">
                    <span className="admin-sales-product-name">{p.name}</span>
                    <span className="admin-sales-product-qty">
                      {t('admin.statUnitsSold')}: <strong>{p.quantity}</strong>
                    </span>
                    <span className="admin-sales-share-track" aria-hidden>
                      <span className="admin-sales-share-fill" style={{ width: `${Math.min(100, p.share || 0)}%` }} />
                    </span>
                  </div>
                  <div className="admin-sales-product-figures">
                    <span>
                      <small>{t('admin.shareOfSales')}</small>
                      {formatPercent(p.share)}
                    </span>
                    <span>
                      <small>{t('admin.statSales')}</small>
                      {formatMoney(p.revenue)}
                    </span>
                    <span>
                      <small>{t('admin.statCost')}</small>
                      {formatMoney(p.cost)}
                    </span>
                    <span className="admin-sales-product-profit">
                      <small>{t('admin.statProfit')}</small>
                      {formatMoney(p.profit)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
