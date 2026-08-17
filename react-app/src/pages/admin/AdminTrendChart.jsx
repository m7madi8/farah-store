import { formatMoney } from './salesStats';
import { formatCompactNumber } from './dashboardAnalytics';
import { AdminEmptyState } from './AdminEmptyState';

function formatTick(point, granularity, locale) {
  const loc = locale === 'ar' ? 'ar' : 'en-GB';
  const d = point.start;
  if (granularity === 'hour') {
    return d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
  }
  if (granularity === 'month') {
    return d.toLocaleDateString(loc, { month: 'short' });
  }
  if (granularity === 'week') {
    return d.toLocaleDateString(loc, { day: 'numeric', month: 'short' });
  }
  return d.toLocaleDateString(loc, { day: 'numeric', month: 'short' });
}

export function AdminTrendChart({ series, granularity, t, lang, emptyTitle, emptyBody }) {
  const data = series || [];
  const hasData = data.some((p) => p.revenue > 0 || p.orders > 0);
  const width = 640;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 28, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxRevenue = Math.max(...data.map((p) => p.revenue), 0);
  const yMax = maxRevenue > 0 ? maxRevenue * 1.08 : 1;

  const points = data.map((p, i) => {
    const x = pad.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = pad.top + innerH - (p.revenue / yMax) * innerH;
    return { ...p, x, y, index: i };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = points.length
    ? `${pad.left},${pad.top + innerH} ${line} ${pad.left + innerW},${pad.top + innerH}`
    : '';

  const tickEvery = Math.max(1, Math.ceil(points.length / 6));
  const summary = t('admin.chartTrendSummary')
    .replace('{revenue}', formatMoney(points.reduce((s, p) => s + p.revenue, 0)))
    .replace('{orders}', formatCompactNumber(points.reduce((s, p) => s + p.orders, 0), lang));

  return (
    <section className="admin-panel admin-chart-panel">
      <header className="admin-panel-head">
        <div>
          <h3>{t('admin.chartTrend')}</h3>
          <p>{t(`admin.chartGranularity.${granularity}`)}</p>
        </div>
      </header>
      <div className="admin-panel-body admin-panel-body--padded">
        {!hasData ? (
          <AdminEmptyState title={emptyTitle} body={emptyBody} />
        ) : (
          <figure className="admin-chart" dir="ltr">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={summary}
              className="admin-chart-svg"
            >
              {[0.25, 0.5, 0.75, 1].map((g) => {
                const y = pad.top + innerH - g * innerH;
                return (
                  <line
                    key={g}
                    x1={pad.left}
                    x2={width - pad.right}
                    y1={y}
                    y2={y}
                    className="admin-chart-grid"
                  />
                );
              })}
              <polygon points={area} className="admin-chart-area" />
              <polyline points={line} className="admin-chart-line" fill="none" />
              {points.map((p) => (
                <g key={p.key}>
                  <circle cx={p.x} cy={p.y} r="3.5" className="admin-chart-dot">
                    <title>
                      {formatTick(p, granularity, lang)} · {formatMoney(p.revenue)} · {p.orders}
                    </title>
                  </circle>
                </g>
              ))}
              {points.map((p, i) =>
                i % tickEvery === 0 || i === points.length - 1 ? (
                  <text key={`t-${p.key}`} x={p.x} y={height - 8} className="admin-chart-tick" textAnchor="middle">
                    {formatTick(p, granularity, lang)}
                  </text>
                ) : null
              )}
            </svg>
            <figcaption className="sr-only">{summary}</figcaption>
            <ul className="admin-chart-legend">
              <li>
                <span className="admin-chart-swatch admin-chart-swatch--revenue" />
                {t('admin.chartRevenue')}
              </li>
            </ul>
          </figure>
        )}
      </div>
    </section>
  );
}
