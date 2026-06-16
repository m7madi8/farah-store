import { useEffect, useMemo, useState } from 'react';
import { useAdminLanguage } from '@/context/LanguageContext';
import { groupShopProducts, SHOP_CATALOG_SECTIONS } from '@/lib/shopCatalog';
import { fetchProducts, getMockProducts } from '@/services/api';

function toAdminProductRow(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    name_ar: product.nameAr ?? product.name_ar ?? '',
    price: product.price,
    category: product.category,
    sort_order: product.order ?? product.sort_order,
    badge: product.badge,
    image_url: product.imageUrl ?? product.image_url,
    hero_image: product.heroImage ?? product.hero_image,
    variants: product.variants,
  };
}

function productImageSrc(row) {
  const url = row.image_url || row.hero_image || row.imageUrl || row.heroImage;
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith('http') || s.startsWith('/')) return s;
  return `/${s}`;
}

function formatVariants(product) {
  if (!Array.isArray(product.variants) || !product.variants.length) return null;
  return product.variants
    .map((variant) => `${variant.labelEn || variant.key} — ₪ ${Number(variant.price || 0).toFixed(2)}`)
    .join(' · ');
}

function AdminProductCard({ product, t }) {
  const src = productImageSrc(product);
  const variants = formatVariants(product);

  return (
    <article className="admin-product-card">
      <div className="admin-product-card-head">
        {src ? (
          <img src={src} alt="" className="admin-product-card-thumb" loading="lazy" />
        ) : (
          <div className="admin-product-card-thumb" aria-hidden />
        )}
        <div className="admin-product-card-title-wrap">
          <h4 className="admin-product-card-title">{product.name || '—'}</h4>
          {product.name_ar ? <p className="admin-product-card-subtitle">{product.name_ar}</p> : null}
        </div>
        <div className="admin-product-card-price">
          {product.price != null ? `₪ ${Number(product.price).toFixed(2)}` : '—'}
        </div>
      </div>
      <dl className="admin-product-card-meta">
        <div className="admin-product-card-meta-row">
          <dt>Slug</dt>
          <dd>
            <code>{product.slug || '—'}</code>
          </dd>
        </div>
        <div className="admin-product-card-meta-row">
          <dt>{t('admin.colSort')}</dt>
          <dd>{product.sort_order ?? '—'}</dd>
        </div>
        <div className="admin-product-card-meta-row">
          <dt>{t('admin.colCategory')}</dt>
          <dd>
            {product.category ? <span className="admin-category">{product.category}</span> : '—'}
          </dd>
        </div>
        {product.badge ? (
          <div className="admin-product-card-meta-row">
            <dt>{t('admin.colBadge')}</dt>
            <dd>{product.badge}</dd>
          </div>
        ) : null}
        {variants ? (
          <div className="admin-product-card-meta-row">
            <dt>{t('admin.colVariants')}</dt>
            <dd>{variants}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

function AdminProductsTable({ products, t }) {
  return (
    <table>
      <thead>
        <tr>
          <th aria-label="Image" />
          <th>{t('admin.colSort')}</th>
          <th>Slug</th>
          <th>{t('admin.colNameEn')}</th>
          <th>{t('admin.colNameAr')}</th>
          <th>{t('admin.colPrice')}</th>
          <th>{t('admin.colCategory')}</th>
          <th>{t('admin.colBadge')}</th>
          <th>{t('admin.colVariants')}</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => {
          const src = productImageSrc(product);
          const variants = formatVariants(product);
          return (
            <tr key={product.id}>
              <td>
                {src ? (
                  <img src={src} alt="" className="admin-product-thumb" loading="lazy" />
                ) : (
                  <div className="admin-product-thumb" aria-hidden />
                )}
              </td>
              <td>{product.sort_order ?? '—'}</td>
              <td>
                <code className="text-xs text-muted-foreground">{product.slug || '—'}</code>
              </td>
              <td>
                <span className="font-medium">{product.name || '—'}</span>
              </td>
              <td>{product.name_ar || '—'}</td>
              <td>
                {product.price != null ? (
                  <span className="font-semibold tabular-nums">₪ {Number(product.price).toFixed(2)}</span>
                ) : (
                  '—'
                )}
              </td>
              <td>
                {product.category ? <span className="admin-category">{product.category}</span> : '—'}
              </td>
              <td>{product.badge || '—'}</td>
              <td>{variants || '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function AdminProductsSection({ sectionId, products, t }) {
  if (!products.length) return null;

  return (
    <section className={`admin-product-section admin-product-section--${sectionId}`}>
      <header className="admin-product-section-head">
        <h4>{t(`admin.shopSection.${sectionId}`)}</h4>
        <p>{t(`admin.shopSectionSub.${sectionId}`)}</p>
      </header>
      <div className="admin-products-list-mobile">
        {products.map((product) => (
          <AdminProductCard key={product.id} product={product} t={t} />
        ))}
      </div>
      <div className="admin-table-wrap admin-products-table-desktop">
        <AdminProductsTable products={products} t={t} />
      </div>
    </section>
  );
}

export function AdminProductsPage() {
  const { t } = useAdminLanguage();
  const [data, setData] = useState(() => getMockProducts().map(toAdminProductRow));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const list = await fetchProducts();
        if (!cancelled) {
          setData((Array.isArray(list) ? list : []).map(toAdminProductRow));
        }
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

  const catalog = useMemo(() => groupShopProducts(data), [data]);

  const stats = useMemo(() => {
    const categories = new Set(data.map((p) => p.category).filter(Boolean));
    return { count: data.length, categories: categories.size };
  }, [data]);

  const hasProducts = data.length > 0;

  return (
    <>
      <header className="admin-page-header">
        <h2>{t('admin.productsTitle')}</h2>
        <p>{t('admin.productsSub')}</p>
      </header>

      <div className="admin-stats admin-stats--duo">
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
        <div className="admin-panel-body admin-panel-body--products">
          {isLoading ? <div className="admin-loading">{t('admin.loading')}</div> : null}
          {error ? <p className="admin-error">{error.message}</p> : null}
          {!isLoading && !error && hasProducts ? (
            <div className="admin-product-sections">
              {SHOP_CATALOG_SECTIONS.map((section) => (
                <AdminProductsSection
                  key={section.id}
                  sectionId={section.id}
                  products={section.getProducts(catalog)}
                  t={t}
                />
              ))}
            </div>
          ) : null}
          {!isLoading && !error && !hasProducts ? (
            <div className="admin-empty">
              <svg className="admin-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
              <p>{t('admin.emptyProducts')}</p>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
