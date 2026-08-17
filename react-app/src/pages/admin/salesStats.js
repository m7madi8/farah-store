/** Cost = 70% of selling price → profit margin = 30% */
export const PRODUCT_COST_RATIO = 0.7;
export const PRODUCT_PROFIT_RATIO = 0.3;

/**
 * @param {Array<{ order_items?: Array<{ product_slug?: string, product_id?: string, product_name?: string, quantity?: number, unit_price?: number }> }>} approvedOrders
 */
export function computeProductSalesStats(approvedOrders) {
  /** @type {Map<string, { key: string, name: string, quantity: number, revenue: number }>} */
  const byProduct = new Map();

  for (const order of approvedOrders) {
    for (const item of order.order_items || []) {
      const key = String(item.product_slug || item.product_id || item.product_name || 'unknown').trim();
      const name = String(item.product_name || key).trim() || '—';
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const lineRevenue = qty * unitPrice;

      const row = byProduct.get(key) || { key, name, quantity: 0, revenue: 0 };
      row.quantity += qty;
      row.revenue += lineRevenue;
      byProduct.set(key, row);
    }
  }

  const products = Array.from(byProduct.values())
    .map((p) => ({
      ...p,
      cost: p.revenue * PRODUCT_COST_RATIO,
      profit: p.revenue * PRODUCT_PROFIT_RATIO,
    }))
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const productsWithShare = products.map((p) => ({
    ...p,
    share: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
  }));
  const totalCost = totalRevenue * PRODUCT_COST_RATIO;
  const totalProfit = totalRevenue * PRODUCT_PROFIT_RATIO;

  const topSeller = productsWithShare[0] ?? null;
  const leastSeller = productsWithShare.length > 1 ? productsWithShare[productsWithShare.length - 1] : null;

  return {
    products: productsWithShare,
    totalRevenue,
    totalCost,
    totalProfit,
    topSeller,
    leastSeller,
  };
}

export function formatMoney(amount) {
  return `₪ ${Number(amount || 0).toFixed(2)}`;
}
