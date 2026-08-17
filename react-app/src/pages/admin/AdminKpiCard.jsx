import { formatPercent } from './dashboardAnalytics';

function Sparkline({ values, label }) {
  if (!values?.length || values.every((v) => !v)) return null;
  const w = 72;
  const h = 28;
  const max = Math.max(...values, 0.0001);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = values.length === 1 ? w / 2 : (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg className="admin-kpi-spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden={!label} role={label ? 'img' : undefined}>
      {label ? <title>{label}</title> : null}
      <polyline fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  );
}

export function AdminKpiCard({
  label,
  value,
  hint,
  change,
  sparkline,
  icon,
  tone = 'default',
  sparklineLabel,
}) {
  const showChange = change?.available && change.value != null;
  const changeClass =
    change?.direction === 'up' ? 'is-up' : change?.direction === 'down' ? 'is-down' : 'is-flat';

  return (
    <article className={`admin-kpi-card admin-kpi-card--${tone}`}>
      <div className="admin-kpi-card-top">
        <div className="admin-kpi-copy">
          <h3 className="admin-kpi-label">{label}</h3>
          {icon ? (
            <span className="admin-kpi-icon" aria-hidden>
              {icon}
            </span>
          ) : null}
        </div>
        <Sparkline values={sparkline} label={sparklineLabel} />
      </div>
      <p className="admin-kpi-value">{value}</p>
      <div className="admin-kpi-meta">
        {showChange ? (
          <span className={`admin-kpi-change ${changeClass}`}>
            <span aria-hidden>{change.direction === 'down' ? '↓' : change.direction === 'up' ? '↑' : '→'}</span>
            {formatPercent(change.value)}
          </span>
        ) : change && !change.available ? (
          <span className="admin-kpi-change is-na">—</span>
        ) : null}
        {hint ? <span className="admin-kpi-hint">{hint}</span> : null}
      </div>
    </article>
  );
}
