import { useEffect, useMemo, useState } from 'react';

export function useOrderListView(orders, { pageSize = 8 } = {}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = Array.isArray(orders) ? orders : [];
    if (q) {
      rows = rows.filter((order) => {
        const hay = [
          order.customer_name,
          order.customer_phone,
          order.shipping_address,
          order.notes,
          order.id,
          order.discount_code,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    rows = [...rows].sort((a, b) => {
      if (sort === 'oldest') {
        return String(a.created_at || '').localeCompare(String(b.created_at || ''));
      }
      if (sort === 'totalHigh') return (Number(b.total) || 0) - (Number(a.total) || 0);
      if (sort === 'totalLow') return (Number(a.total) || 0) - (Number(b.total) || 0);
      return String(b.created_at || '').localeCompare(String(a.created_at || ''));
    });
    return rows;
  }, [orders, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query, sort]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return {
    query,
    setQuery,
    sort,
    setSort,
    page,
    setPage,
    pageCount,
    pageItems,
    filteredCount: filtered.length,
    from: filtered.length ? start + 1 : 0,
    to: Math.min(start + pageSize, filtered.length),
  };
}
