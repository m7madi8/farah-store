/**
 * ProductCard — single product preview card for the shop grid.
 * For products with variants (e.g. date balls), size selection is required before add to cart.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { NO_DETAIL_PAGE_SLUGS } from '../constants/products';

const PRODUCT_PLACEHOLDER_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f2e3e1"/>
          <stop offset="100%" stop-color="#7A5C8E"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg)"/>
      <g opacity="0.88" fill="#4B2A63">
        <circle cx="310" cy="250" r="78"/>
        <rect x="220" y="350" width="360" height="18" rx="9"/>
        <rect x="270" y="386" width="260" height="14" rx="7"/>
      </g>
    </svg>`
  );
const STATIC_PRODUCT_FALLBACK = '/img/2.webp';

export function ProductCard({ product, onShowToast }) {
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const hasDetailPage = !NO_DETAIL_PAGE_SLUGS.includes(product.slug);

  const name = lang === 'ar' && product.nameAr ? product.nameAr : product.name;
  const desc = lang === 'ar' && product.descriptionAr ? product.descriptionAr : product.description;
  const hasVariants = product.variants && product.variants.length > 0;
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(null);

  const selectedVariant = hasVariants && selectedVariantIndex != null ? product.variants[selectedVariantIndex] : null;
  const canAddToCart = !hasVariants || selectedVariant != null;
  const displayNameForCart = selectedVariant
    ? `${name} (${lang === 'ar' ? selectedVariant.labelAr : selectedVariant.labelEn})`
    : name;
  const priceForCart = selectedVariant ? selectedVariant.price : product.price;

  const badgeKey = product.badge === 'Sauce' ? 'product.badgeSauce' : product.badge === 'Accessory' ? 'product.badgeAccessory' : 'product.badge';
  const badge = t(badgeKey);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canAddToCart) return;
    addItem({ ...product, name: displayNameForCart, price: priceForCart });
    onShowToast?.();
  };

  const handleVariantClick = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariantIndex(index);
  };

  const cardContent = (
    <>
      <div className="product-preview-image">
        <img
          src={product.imageUrl}
          alt={name}
          width="400"
          height="300"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            if (e.currentTarget.src.endsWith(STATIC_PRODUCT_FALLBACK)) {
              e.currentTarget.src = PRODUCT_PLACEHOLDER_SVG;
              return;
            }
            if (e.currentTarget.src !== PRODUCT_PLACEHOLDER_SVG) {
              e.currentTarget.src = STATIC_PRODUCT_FALLBACK;
            }
          }}
        />
        <span className="product-preview-badge">{badge}</span>
      </div>
      <div className="product-preview-body">
        <h3 className="product-preview-title">{name}</h3>
        {hasVariants ? (
          <div className="product-preview-variants" onClick={(e) => e.stopPropagation()}>
            {product.variants.map((v, i) => (
              <button
                key={v.key}
                type="button"
                className={`product-preview-variant ${i === selectedVariantIndex ? 'selected' : ''}`}
                onClick={(e) => handleVariantClick(e, i)}
                aria-pressed={i === selectedVariantIndex}
                aria-label={`${lang === 'ar' ? v.labelAr : v.labelEn} — ${v.price} ₪`}
              >
                <span className="product-preview-variant-label">{lang === 'ar' ? v.labelAr : v.labelEn}</span>
                <span className="product-preview-variant-sep" aria-hidden="true">·</span>
                <strong className="product-preview-variant-price">{v.price} ₪</strong>
              </button>
            ))}
          </div>
        ) : (
          <div className="product-preview-price-wrap">
            <span className="product-preview-price">{product.price}</span>
            <span className="product-preview-currency">₪</span>
          </div>
        )}
        <p className={`product-preview-desc ${product.slug === 'chop-sticks' ? 'product-preview-chop-note' : ''}`}>
          {desc}
        </p>
        {hasDetailPage && (
          <span className="product-preview-cta">
            {t('product.viewProduct')}
            <i className="bi bi-arrow-right" aria-hidden="true" />
          </span>
        )}
      </div>
    </>
  );

  return (
    <div
      className="product-preview product-preview-card anim-on-scroll"
      data-category={product.category}
      data-price={product.price}
      data-order={product.order}
    >
      {hasDetailPage ? (
        <Link to={`/product/${product.slug}`} className="product-preview-link">
          {cardContent}
        </Link>
      ) : (
        <div className="product-preview-link product-preview-link--no-page">
          {cardContent}
        </div>
      )}
      <button
        type="button"
        className={`product-preview-add-cart ${!canAddToCart ? 'product-preview-add-cart--disabled' : ''}`}
        onClick={handleAddToCart}
        disabled={!canAddToCart}
        title={!canAddToCart ? (lang === 'ar' ? 'اختر الحجم أولاً' : 'Choose size first') : undefined}
      >
        <i className="bi bi-cart-plus" />
        <span>{canAddToCart ? t('product.addToCart') : t('product.chooseSize')}</span>
      </button>
    </div>
  );
}
