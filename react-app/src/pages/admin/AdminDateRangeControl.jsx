import { DATE_RANGE_PRESETS } from './dashboardAnalytics';

const PRESET_KEYS = {
  today: 'admin.rangeToday',
  yesterday: 'admin.rangeYesterday',
  last7: 'admin.rangeLast7',
  last30: 'admin.rangeLast30',
  thisMonth: 'admin.rangeThisMonth',
  lastMonth: 'admin.rangeLastMonth',
  thisYear: 'admin.rangeThisYear',
  custom: 'admin.rangeCustom',
};

function toInputValue(date) {
  if (!date) return '';
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function AdminDateRangeControl({
  preset,
  custom,
  onPresetChange,
  onCustomChange,
  t,
  range,
}) {
  return (
    <div className="admin-range">
      <div className="admin-range-presets" role="group" aria-label={t('admin.rangeLabel')}>
        {DATE_RANGE_PRESETS.map((key) => (
          <button
            key={key}
            type="button"
            className={`admin-range-chip${preset === key ? ' is-active' : ''}`}
            aria-pressed={preset === key}
            onClick={() => onPresetChange(key)}
          >
            {t(PRESET_KEYS[key])}
          </button>
        ))}
      </div>
      {preset === 'custom' ? (
        <div className="admin-range-custom">
          <label className="admin-range-field">
            <span>{t('admin.rangeFrom')}</span>
            <input
              type="date"
              value={toInputValue(custom?.start || range?.start)}
              onChange={(e) => onCustomChange({ ...custom, start: e.target.value })}
            />
          </label>
          <label className="admin-range-field">
            <span>{t('admin.rangeTo')}</span>
            <input
              type="date"
              value={toInputValue(custom?.end || range?.end)}
              onChange={(e) => onCustomChange({ ...custom, end: e.target.value })}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
