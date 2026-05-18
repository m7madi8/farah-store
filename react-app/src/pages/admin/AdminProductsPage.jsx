import { useEffect, useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useLanguage } from '@/context/LanguageContext';
import { getSupabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function productImageSrc(row) {
  const url = row.image_url || row.hero_image;
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith('http') || s.startsWith('/')) return s;
  return `/${s}`;
}

export function AdminProductsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const sb = getSupabase();
        const { data: rows, error: qErr } = await sb
          .from('products')
          .select('*')
          .order('sort_order', { ascending: true });
        if (qErr) throw qErr;
        if (!cancelled) setData(rows ?? []);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const categories = new Set(data.map((p) => p.category).filter(Boolean));
    return { count: data.length, categories: categories.size };
  }, [data]);

  const columns = useMemo(
    () => [
      {
        id: 'image',
        header: '',
        cell: ({ row }) => {
          const src = productImageSrc(row.original);
          return src ? (
            <img src={src} alt="" className="admin-product-thumb" loading="lazy" />
          ) : (
            <div className="admin-product-thumb" aria-hidden />
          );
        },
      },
      { accessorKey: 'sort_order', header: t('admin.colSort') },
      {
        accessorKey: 'slug',
        header: 'Slug',
        cell: ({ getValue }) => <code className="text-xs text-muted-foreground">{getValue()}</code>,
      },
      { accessorKey: 'name', header: t('admin.colNameEn'), cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
      { accessorKey: 'name_ar', header: t('admin.colNameAr') },
      {
        accessorKey: 'price',
        header: t('admin.colPrice'),
        cell: ({ getValue }) => {
          const v = getValue();
          return v != null ? <span className="font-semibold tabular-nums">₪ {Number(v).toFixed(2)}</span> : '—';
        },
      },
      {
        accessorKey: 'category',
        header: t('admin.colCategory'),
        cell: ({ getValue }) => <span className="admin-category">{getValue() || '—'}</span>,
      },
      { accessorKey: 'badge', header: t('admin.colBadge') },
    ],
    [t]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <header className="admin-page-header">
        <h2>{t('admin.productsTitle')}</h2>
        <p>{t('admin.productsSub')}</p>
      </header>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-label">{t('admin.statProducts')}</div>
          <div className="admin-stat-value">{stats.count}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">{t('admin.statCategories')}</div>
          <div className="admin-stat-value">{stats.categories}</div>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h3>{t('admin.productsTitle')}</h3>
          <p>{t('admin.productsSub')}</p>
        </div>
        <div className="admin-panel-body">
          {isLoading ? <div className="admin-loading">{t('admin.loading')}</div> : null}
          {error ? <p className="admin-error">{error.message}</p> : null}
          {!isLoading && !error ? (
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <div className="admin-empty">
                          <svg className="admin-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                          </svg>
                          <p>{t('admin.emptyProducts')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
