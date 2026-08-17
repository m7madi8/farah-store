import { useMemo, useState } from 'react';
import { useAdminLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { AdminSalesStats } from './AdminSalesStats';
import { AdminDateRangeControl } from './AdminDateRangeControl';
import { AdminKpiCard } from './AdminKpiCard';
import { AdminTrendChart } from './AdminTrendChart';
import { AdminStatusDistribution } from './AdminStatusDistribution';
import { AdminActivityFeed } from './AdminActivityFeed';
import { AdminQuickActions } from './AdminQuickActions';
import { AdminDashboardSkeleton } from './AdminDashboardSkeleton';
import { AdminEmptyState, AdminErrorBanner } from './AdminEmptyState';
import { printApprovedSalesReport } from './adminPrint';
import { useAdminOrders } from './useAdminOrders';
import { computeDashboardAnalytics, formatPercent, resolveDateRange } from './dashboardAnalytics';
import { formatMoney } from './salesStats';

function KpiIcon({ d }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function AdminStatsPage() {
  const { t, lang } = useAdminLanguage();
  const { data, isLoading, error, loadOrders } = useAdminOrders();
  const [printing, setPrinting] = useState(false);
  const [preset, setPreset] = useState('last30');
  const [custom, setCustom] = useState({ start: '', end: '' });

  const range = useMemo(() => resolveDateRange(preset, custom), [preset, custom]);
  const analytics = useMemo(() => computeDashboardAnalytics(data, range), [data, range]);

  async function handlePrint() {
    setPrinting(true);
    try {
      await printApprovedSalesReport({ t, lang });
    } catch {
      window.alert(t('admin.pdfExportFailed'));
    } finally {
      setPrinting(false);
    }
  }

  const changeHint = (change) =>
    change?.available ? t('admin.vsPrevious') : t('admin.noPriorData');

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header admin-page-header--with-actions">
        <div>
          <h2>{t('admin.overviewTitle')}</h2>
          <p>{t('admin.overviewSub')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="admin-btn-print-header"
          disabled={printing || isLoading}
          onClick={handlePrint}
        >
          {printing ? t('admin.exportingPdf') : t('admin.printSalesReport')}
        </Button>
      </header>

      <AdminDateRangeControl
        preset={preset}
        custom={custom}
        range={range}
        onPresetChange={setPreset}
        onCustomChange={setCustom}
        t={t}
      />

      {error ? (
        <AdminErrorBanner
          message={error.message}
          onRetry={() => loadOrders()}
          retryLabel={t('admin.retry')}
        />
      ) : null}

      {isLoading && !analytics.hasAnyOrders ? <AdminDashboardSkeleton /> : null}

      {!isLoading && !analytics.hasAnyOrders && !error ? (
        <AdminEmptyState
          title={t('admin.statsEmpty')}
          body={t('admin.emptyPeriodBody')}
        />
      ) : null}

      {analytics.hasAnyOrders ? (
        <>
          <div className="admin-kpi-grid">
            <AdminKpiCard
              label={t('admin.statRevenue')}
              value={formatMoney(analytics.totals.revenue)}
              hint={changeHint(analytics.totals.revenueChange)}
              change={analytics.totals.revenueChange}
              sparkline={analytics.sparkline}
              sparklineLabel={t('admin.kpiSparkline')}
              icon={<KpiIcon d="M3 17l6-6 4 4 8-8" />}
            />
            <AdminKpiCard
              label={t('admin.statApproved')}
              value={analytics.totals.approved}
              hint={changeHint(analytics.totals.approvedChange)}
              change={analytics.totals.approvedChange}
              icon={<KpiIcon d="M20 6L9 17l-5-5" />}
            />
            <AdminKpiCard
              label={t('admin.statPendingAll')}
              value={analytics.totals.pendingAll}
              hint={t('admin.statPendingHint')}
              tone={analytics.totals.pendingAll > 0 ? 'warn' : 'default'}
              icon={<KpiIcon d="M12 8v4l3 2" />}
            />
            <AdminKpiCard
              label={t('admin.statCustomers')}
              value={analytics.totals.customers}
              hint={`${t('admin.statNewCustomers')} ${analytics.totals.newCustomers} · ${t('admin.statReturningCustomers')} ${analytics.totals.returningCustomers}`}
              change={analytics.totals.customersChange}
              icon={<KpiIcon d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />}
            />
            <AdminKpiCard
              label={t('admin.statAov')}
              value={formatMoney(analytics.totals.aov)}
              hint={t('admin.statAovHint')}
              change={analytics.totals.aovChange}
              icon={<KpiIcon d="M12 3v18M5 8h14M5 16h14" />}
            />
            <AdminKpiCard
              label={t('admin.statApprovalRate')}
              value={formatPercent(analytics.totals.approvalRate * 100)}
              hint={t('admin.statApprovalHint')}
              change={analytics.totals.approvalRateChange}
              icon={<KpiIcon d="M3 12a9 9 0 1018 0 9 9 0 00-18 0" />}
            />
          </div>

          <div className="admin-kpi-grid admin-kpi-grid--secondary">
            <AdminKpiCard
              label={t('admin.statTotalProfit')}
              value={formatMoney(analytics.totals.profit)}
              hint={t('admin.statProfitHint')}
              change={analytics.totals.profitChange}
              tone="success"
            />
            <AdminKpiCard
              label={t('admin.statOrdersPeriod')}
              value={analytics.totals.orders}
              hint={changeHint(analytics.totals.ordersChange)}
              change={analytics.totals.ordersChange}
            />
          </div>

          <div className="admin-dashboard-split">
            <AdminTrendChart
              series={analytics.trend}
              granularity={analytics.granularity}
              t={t}
              lang={lang}
              emptyTitle={t('admin.chartTrendEmpty')}
              emptyBody={t('admin.emptyPeriodBody')}
            />
            <AdminStatusDistribution
              pending={analytics.status.pending}
              approved={analytics.status.approved}
              total={analytics.status.total}
              t={t}
              emptyTitle={t('admin.chartStatusEmpty')}
              emptyBody={t('admin.emptyPeriodBody')}
            />
          </div>

          <div className="admin-dashboard-split admin-dashboard-split--bottom">
            <AdminSalesStats
              products={analytics.products}
              topSeller={analytics.topSeller}
              leastSeller={analytics.leastSeller}
              showHeader={false}
            />
            <div className="admin-dashboard-side">
              <AdminQuickActions
                pendingCount={analytics.totals.pendingAll}
                onPrint={handlePrint}
                printing={printing}
                t={t}
              />
              <AdminActivityFeed items={analytics.activity} t={t} lang={lang} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
