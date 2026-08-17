import { describe, expect, it } from 'vitest';
import {
  computeDashboardAnalytics,
  customerKey,
  getPreviousRange,
  percentChange,
  pickGranularity,
  resolveDateRange,
} from './dashboardAnalytics';

const NOW = new Date(2026, 7, 17, 15, 0, 0);

function order(partial) {
  return {
    id: 'o1',
    customer_name: 'A',
    customer_phone: '0500000001',
    total: 100,
    status: 'approved',
    created_at: new Date(2026, 7, 17, 10, 0, 0).toISOString(),
    order_items: [],
    ...partial,
  };
}

describe('resolveDateRange', () => {
  it('last 30 days is inclusive of today and 29 days earlier', () => {
    const range = resolveDateRange('last30', null, NOW);
    expect(range.start.getDate()).toBe(19);
    expect(range.start.getMonth()).toBe(6);
    expect(range.end.getDate()).toBe(17);
    expect(range.end.getMonth()).toBe(7);
  });

  it('today stays within the local day', () => {
    const range = resolveDateRange('today', null, NOW);
    expect(range.start.getHours()).toBe(0);
    expect(range.end.getHours()).toBe(23);
  });

  it('custom range swaps inverted dates', () => {
    const range = resolveDateRange('custom', { start: '2026-08-10', end: '2026-08-01' }, NOW);
    expect(range.start.getDate()).toBe(1);
    expect(range.end.getDate()).toBe(10);
    expect(range.start.getMonth()).toBe(7);
  });
});

describe('percentChange', () => {
  it('computes growth from a real baseline', () => {
    expect(percentChange(120, 100)).toEqual({ value: 20, available: true, direction: 'up' });
  });

  it('does not invent a percentage when previous is zero and current is not', () => {
    expect(percentChange(50, 0).available).toBe(false);
    expect(percentChange(50, 0).value).toBeNull();
  });

  it('treats 0 vs 0 as flat', () => {
    expect(percentChange(0, 0)).toEqual({ value: 0, available: true, direction: 'flat' });
  });
});

describe('computeDashboardAnalytics', () => {
  const range = resolveDateRange('last7', null, NOW);

  it('uses approved order totals for revenue, not pending orders', () => {
    const analytics = computeDashboardAnalytics(
      [
        order({ id: 'a', status: 'approved', total: 80, created_at: new Date(2026, 7, 16).toISOString() }),
        order({ id: 'p', status: 'pending', total: 999, created_at: new Date(2026, 7, 16).toISOString() }),
      ],
      range
    );
    expect(analytics.totals.revenue).toBe(80);
    expect(analytics.totals.profit).toBeCloseTo(24);
    expect(analytics.totals.approved).toBe(1);
    expect(analytics.totals.pendingPeriod).toBe(1);
  });

  it('compares against an equal-length previous period', () => {
    const prev = getPreviousRange(range);
    const analytics = computeDashboardAnalytics(
      [
        order({
          id: 'now',
          total: 200,
          created_at: new Date(2026, 7, 16, 12).toISOString(),
        }),
        order({
          id: 'then',
          total: 100,
          created_at: new Date(prev.start.getTime() + 36e5).toISOString(),
        }),
      ],
      range
    );
    expect(analytics.totals.previousRevenue).toBe(100);
    expect(analytics.totals.revenueChange.value).toBe(100);
  });

  it('classifies new vs returning customers from first order time', () => {
    const analytics = computeDashboardAnalytics(
      [
        order({
          id: 'old',
          customer_phone: '050111',
          created_at: new Date(2026, 0, 2).toISOString(),
        }),
        order({
          id: 'back',
          customer_phone: '050111',
          created_at: new Date(2026, 7, 16).toISOString(),
        }),
        order({
          id: 'fresh',
          customer_phone: '050222',
          created_at: new Date(2026, 7, 16).toISOString(),
        }),
      ],
      range
    );
    expect(analytics.totals.customers).toBe(2);
    expect(analytics.totals.newCustomers).toBe(1);
    expect(analytics.totals.returningCustomers).toBe(1);
  });

  it('excludes orders outside the selected range', () => {
    const analytics = computeDashboardAnalytics(
      [
        order({ id: 'in', created_at: new Date(2026, 7, 16).toISOString(), total: 40 }),
        order({ id: 'out', created_at: new Date(2026, 0, 1).toISOString(), total: 400 }),
      ],
      range
    );
    expect(analytics.totals.revenue).toBe(40);
    expect(analytics.totals.orders).toBe(1);
  });

  it('does not count orders missing created_at', () => {
    const analytics = computeDashboardAnalytics(
      [order({ id: 'no-date', created_at: null, total: 50 })],
      range
    );
    expect(analytics.totals.orders).toBe(0);
    expect(analytics.totals.revenue).toBe(0);
  });
});

describe('helpers', () => {
  it('prefers phone as the customer identity', () => {
    expect(customerKey({ customer_phone: ' 0501  ', customer_name: 'A' })).toBe('p:0501');
  });

  it('uses hour granularity for short ranges', () => {
    expect(pickGranularity(resolveDateRange('today', null, NOW))).toBe('hour');
    expect(pickGranularity(resolveDateRange('thisYear', null, NOW))).toBe('month');
  });
});
