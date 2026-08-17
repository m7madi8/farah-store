import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AdminOrderToolbar({ view, t }) {
  const { query, setQuery, sort, setSort, page, setPage, pageCount, filteredCount, from, to } = view;
  const rangeLabel = t('admin.pageOf')
    .replace('{from}', String(from))
    .replace('{to}', String(to))
    .replace('{total}', String(filteredCount));

  return (
    <div className="admin-list-toolbar">
      <label className="admin-list-search">
        <span className="sr-only">{t('admin.searchOrders')}</span>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('admin.searchOrders')}
          autoComplete="off"
        />
      </label>
      <label className="admin-sort-field">
        <span>{t('admin.sortBy')}</span>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">{t('admin.sortNewest')}</option>
          <option value="oldest">{t('admin.sortOldest')}</option>
          <option value="totalHigh">{t('admin.sortTotalHigh')}</option>
          <option value="totalLow">{t('admin.sortTotalLow')}</option>
        </select>
      </label>
      <div className="admin-list-pager">
        {filteredCount > 0 ? <span className="admin-list-page-label">{rangeLabel}</span> : null}
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          {t('admin.prevPage')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= pageCount || filteredCount === 0}
          onClick={() => setPage((p) => p + 1)}
        >
          {t('admin.nextPage')}
        </Button>
      </div>
    </div>
  );
}
