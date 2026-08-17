import { isApprovedOrder, isPendingOrder } from './orderUtils';
import { PRODUCT_COST_RATIO, PRODUCT_PROFIT_RATIO, computeProductSalesStats } from './salesStats';

export const DATE_RANGE_PRESETS = [
  'today',
  'yesterday',
  'last7',
  'last30',
  'thisMonth',
  'lastMonth',
  'thisYear',
  'custom',
];

export function startOfLocalDay(date) {
  const d = parseLocalDate(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfLocalDay(date) {
  const d = parseLocalDate(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseLocalDate(value) {
  if (value instanceof Date) return new Date(value.getTime());
  const s = String(value || '');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function ymd(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function hourKey(date) {
  return `${ymd(date)}T${pad2(date.getHours())}`;
}

function monthKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function startOfWeek(date) {
  const d = startOfLocalDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

/**
 * @param {string} preset
 * @param {{ start?: string | Date, end?: string | Date } | null} custom
 * @param {Date} [now]
 */
export function resolveDateRange(preset, custom = null, now = new Date()) {
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);

  switch (preset) {
    case 'today':
      return { start: todayStart, end: todayEnd, preset };
    case 'yesterday': {
      const y = new Date(todayStart);
      y.setDate(y.getDate() - 1);
      return { start: startOfLocalDay(y), end: endOfLocalDay(y), preset };
    }
    case 'last7': {
      const s = new Date(todayStart);
      s.setDate(s.getDate() - 6);
      return { start: s, end: todayEnd, preset };
    }
    case 'last30': {
      const s = new Date(todayStart);
      s.setDate(s.getDate() - 29);
      return { start: s, end: todayEnd, preset };
    }
    case 'thisMonth':
      return { start: new Date(todayStart.getFullYear(), todayStart.getMonth(), 1), end: todayEnd, preset };
    case 'lastMonth': {
      const s = new Date(todayStart.getFullYear(), todayStart.getMonth() - 1, 1);
      const e = new Date(todayStart.getFullYear(), todayStart.getMonth(), 0, 23, 59, 59, 999);
      return { start: s, end: e, preset };
    }
    case 'thisYear':
      return { start: new Date(todayStart.getFullYear(), 0, 1), end: todayEnd, preset };
    case 'custom': {
      const rawStart = custom?.start ? startOfLocalDay(custom.start) : todayStart;
      const rawEnd = custom?.end ? endOfLocalDay(custom.end) : todayEnd;
      if (rawStart.getTime() > rawEnd.getTime()) {
        return { start: startOfLocalDay(rawEnd), end: endOfLocalDay(rawStart), preset };
      }
      return { start: rawStart, end: rawEnd, preset };
    }
    default:
      return resolveDateRange('last30', custom, now);
  }
}

export function getPreviousRange(range) {
  const duration = Math.max(0, range.end.getTime() - range.start.getTime());
  return {
    start: new Date(range.start.getTime() - duration - 1),
    end: new Date(range.start.getTime() - 1),
    preset: 'previous',
  };
}

export function pickGranularity(range) {
  const ms = Math.max(0, range.end.getTime() - range.start.getTime());
  const hours = ms / 36e5;
  if (hours <= 36) return 'hour';
  const days = ms / 864e5;
  if (days <= 92) return 'day';
  if (days <= 210) return 'week';
  return 'month';
}

function addHours(date, n) {
  const d = new Date(date);
  d.setHours(d.getHours() + n);
  return d;
}

/**
 * @param {{ start: Date, end: Date }} range
 * @param {'hour' | 'day' | 'week' | 'month'} granularity
 */
export function buildBuckets(range, granularity) {
  const buckets = [];
  const end = range.end.getTime();
  const max = 400;

  if (granularity === 'hour') {
    let cursor = new Date(range.start);
    cursor.setMinutes(0, 0, 0);
    while (cursor.getTime() <= end && buckets.length < max) {
      buckets.push({ key: hourKey(cursor), start: new Date(cursor) });
      cursor = addHours(cursor, 1);
    }
    return buckets;
  }

  if (granularity === 'week') {
    let cursor = startOfWeek(range.start);
    while (cursor.getTime() <= end && buckets.length < max) {
      buckets.push({ key: ymd(cursor), start: new Date(cursor) });
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() + 7);
    }
    return buckets;
  }

  if (granularity === 'month') {
    let cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
    while (cursor.getTime() <= end && buckets.length < max) {
      buckets.push({ key: monthKey(cursor), start: new Date(cursor) });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return buckets;
  }

  let cursor = startOfLocalDay(range.start);
  while (cursor.getTime() <= end && buckets.length < max) {
    buckets.push({ key: ymd(cursor), start: new Date(cursor) });
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

export function bucketKeyForDate(date, granularity) {
  if (granularity === 'hour') return hourKey(date);
  if (granularity === 'week') return ymd(startOfWeek(date));
  if (granularity === 'month') return monthKey(date);
  return ymd(date);
}

export function orderTimestamp(order) {
  if (!order?.created_at) return null;
  const t = Date.parse(order.created_at);
  return Number.isFinite(t) ? t : null;
}

export function isInRange(order, range) {
  const t = orderTimestamp(order);
  if (t == null) return false;
  return t >= range.start.getTime() && t <= range.end.getTime();
}

export function customerKey(order) {
  const phone = String(order?.customer_phone || '').replace(/\s+/g, '');
  if (phone) return `p:${phone}`;
  const name = String(order?.customer_name || '').trim().toLowerCase();
  if (name) return `n:${name}`;
  return `id:${order?.id ?? 'unknown'}`;
}

function sumTotals(orders) {
  return orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
}

/**
 * @param {number} current
 * @param {number} previous
 * @returns {{ value: number | null, available: boolean, direction: 'up' | 'down' | 'flat' }}
 */
export function percentChange(current, previous) {
  if (!Number.isFinite(previous) || previous === 0) {
    if (!Number.isFinite(current) || current === 0) {
      return { value: 0, available: true, direction: 'flat' };
    }
    return { value: null, available: false, direction: 'up' };
  }
  const value = ((current - previous) / previous) * 100;
  const direction = value > 0.005 ? 'up' : value < -0.005 ? 'down' : 'flat';
  return { value, available: true, direction };
}

function firstOrderTimeByCustomer(orders) {
  const map = new Map();
  for (const order of orders) {
    const t = orderTimestamp(order);
    if (t == null) continue;
    const key = customerKey(order);
    const prev = map.get(key);
    if (prev == null || t < prev) map.set(key, t);
  }
  return map;
}

function customerStats(periodOrders, allOrders, range) {
  const keys = new Set();
  for (const order of periodOrders) keys.add(customerKey(order));
  const firstTimes = firstOrderTimeByCustomer(allOrders);
  let newCustomers = 0;
  let returningCustomers = 0;
  for (const key of keys) {
    const first = firstTimes.get(key);
    if (first != null && first >= range.start.getTime() && first <= range.end.getTime()) {
      newCustomers += 1;
    } else {
      returningCustomers += 1;
    }
  }
  return { unique: keys.size, newCustomers, returningCustomers };
}

function buildTrend(approvedOrders, range, granularity) {
  const buckets = buildBuckets(range, granularity);
  const byKey = new Map(buckets.map((b) => [b.key, { ...b, revenue: 0, orders: 0 }]));

  for (const order of approvedOrders) {
    const t = orderTimestamp(order);
    if (t == null) continue;
    const key = bucketKeyForDate(new Date(t), granularity);
    const row = byKey.get(key);
    if (!row) continue;
    row.revenue += Number(order.total) || 0;
    row.orders += 1;
  }

  return buckets.map((b) => byKey.get(b.key));
}

function recentActivity(allOrders, limit = 10) {
  return [...allOrders]
    .filter((order) => orderTimestamp(order) != null)
    .sort((a, b) => (orderTimestamp(b) || 0) - (orderTimestamp(a) || 0))
    .slice(0, limit)
    .map((order) => ({
      id: order.id,
      type: isApprovedOrder(order) ? 'approved' : 'pending',
      customer: order.customer_name || order.customer_phone || '—',
      total: Number(order.total) || 0,
      createdAt: order.created_at,
      status: order.status,
    }));
}

/**
 * All displayed metrics are derived from Firestore `orders` (and embedded items).
 * Revenue uses approved `order.total` (after discount). Product mix uses line items.
 *
 * @param {Array<object>} allOrders
 * @param {{ start: Date, end: Date, preset?: string }} range
 */
export function computeDashboardAnalytics(allOrders, range) {
  const orders = Array.isArray(allOrders) ? allOrders : [];
  const previousRange = getPreviousRange(range);
  const granularity = pickGranularity(range);

  const currentOrders = orders.filter((order) => isInRange(order, range));
  const previousOrders = orders.filter((order) => isInRange(order, previousRange));

  const currentApproved = currentOrders.filter(isApprovedOrder);
  const previousApproved = previousOrders.filter(isApprovedOrder);
  const currentPending = currentOrders.filter(isPendingOrder);
  const allPending = orders.filter(isPendingOrder);

  const revenue = sumTotals(currentApproved);
  const previousRevenue = sumTotals(previousApproved);
  const profit = revenue * PRODUCT_PROFIT_RATIO;
  const previousProfit = previousRevenue * PRODUCT_PROFIT_RATIO;
  const cost = revenue * PRODUCT_COST_RATIO;

  const aov = currentApproved.length ? revenue / currentApproved.length : 0;
  const previousAov = previousApproved.length ? previousRevenue / previousApproved.length : 0;

  const approvalRate = currentOrders.length ? currentApproved.length / currentOrders.length : 0;
  const previousApprovalRate = previousOrders.length
    ? previousApproved.length / previousOrders.length
    : 0;

  const customers = customerStats(currentOrders, orders, range);
  const previousCustomers = customerStats(previousOrders, orders, previousRange);

  const rangeDays = Math.max(1, (range.end.getTime() - range.start.getTime() + 1) / 864e5);
  const ordersPerDay = currentOrders.length / rangeDays;
  const revenuePerDay = revenue / rangeDays;

  const productSales = computeProductSalesStats(currentApproved);
  const products = productSales.products.map((p) => ({
    ...p,
    share: productSales.totalRevenue > 0 ? (p.revenue / productSales.totalRevenue) * 100 : 0,
  }));

  const trend = buildTrend(currentApproved, range, granularity);

  return {
    range,
    previousRange,
    granularity,
    totals: {
      revenue,
      previousRevenue,
      revenueChange: percentChange(revenue, previousRevenue),
      profit,
      previousProfit,
      profitChange: percentChange(profit, previousProfit),
      cost,
      aov,
      previousAov,
      aovChange: percentChange(aov, previousAov),
      orders: currentOrders.length,
      previousOrders: previousOrders.length,
      ordersChange: percentChange(currentOrders.length, previousOrders.length),
      approved: currentApproved.length,
      previousApproved: previousApproved.length,
      approvedChange: percentChange(currentApproved.length, previousApproved.length),
      pendingPeriod: currentPending.length,
      pendingAll: allPending.length,
      approvalRate,
      previousApprovalRate,
      approvalRateChange: percentChange(approvalRate, previousApprovalRate),
      customers: customers.unique,
      previousCustomers: previousCustomers.unique,
      customersChange: percentChange(customers.unique, previousCustomers.unique),
      newCustomers: customers.newCustomers,
      returningCustomers: customers.returningCustomers,
      ordersPerDay,
      revenuePerDay,
    },
    status: {
      pending: currentPending.length,
      approved: currentApproved.length,
      total: currentOrders.length,
    },
    products,
    topSeller: products[0] ?? null,
    leastSeller: products.length > 1 ? products[products.length - 1] : null,
    trend,
    sparkline: trend.map((point) => point.revenue),
    activity: recentActivity(orders),
    hasAnyOrders: orders.length > 0,
    hasPeriodOrders: currentOrders.length > 0,
    hasPeriodSales: currentApproved.length > 0,
  };
}

export function formatPercent(value, digits = 1) {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const formatted = abs.toFixed(abs >= 100 ? 0 : digits);
  return `${formatted}%`;
}

export function formatCompactNumber(value, locale = 'en') {
  const n = Number(value) || 0;
  return n.toLocaleString(locale === 'ar' ? 'ar' : 'en-GB', { maximumFractionDigits: 1 });
}
