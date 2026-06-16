import { useMemo } from 'react';
import { useAdminLanguage } from '@/context/LanguageContext';
import { computeProductSalesStats, formatMoney } from './salesStats';

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

export function AdminSalesStats({ approvedOrders, showHeader = true }) {
  const { t } = useAdminLanguage();

  const sales = useMemo(() => computeProductSalesStats(approvedOrders), [approvedOrders]);

  if (!sales.products.length) {
    return (
      <section className="admin-sales-section">
        {showHeader ? (
          <header className="admin-section-head">
            <h3>{t('admin.menuStats')}</h3>
            <p>{t('admin.statsSub')}</p>
          </header>
        ) : null}
        <div className="admin-panel admin-panel-body--padded">
          <p className="admin-section-empty">{t('admin.statsEmpty')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-sales-section">
      {showHeader ? (
        <header className="admin-section-head">
          <h3>{t('admin.menuStats')}</h3>
          <p>{t('admin.statsSub')}</p>
        </header>
      ) : null}

      <div className="admin-sales-summary">
        <div className="admin-stat-card admin-stat-card--profit">
          <div className="admin-stat-label">{t('admin.statTotalProfit')}</div>
          <div className="admin-stat-value">{formatMoney(sales.totalProfit)}</div>
          <p className="admin-stat-hint">{t('admin.statProfitHint')}</p>
        </div>
      </div>

      <div className="admin-sales-highlights">
        <HighlightProduct
          label={t('admin.statTopSeller')}
          product={sales.topSeller}
          qtyLabel={t('admin.statUnitsSold')}
          t={t}
        />
        <HighlightProduct
          label={t('admin.statLeastSeller')}
          product={sales.leastSeller}
          qtyLabel={t('admin.statUnitsSold')}
          t={t}
        />
      </div>

      <div className="admin-panel admin-panel--flush">
        <div className="admin-panel-head">
          <h3>{t('admin.statByProduct')}</h3>
        </div>
        <ul className="admin-sales-product-list">
          {sales.products.map((p) => (
            <li key={p.key} className="admin-sales-product-row">
              <div className="admin-sales-product-main">
                <span className="admin-sales-product-name">{p.name}</span>
                <span className="admin-sales-product-qty">
                  {t('admin.statUnitsSold')}: <strong>{p.quantity}</strong>
                </span>
              </div>
              <div className="admin-sales-product-figures">
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
    </section>
  );
}
