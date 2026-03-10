/**
 * ProductDetailPage — single product view with hero image, details, and Add to cart / Pay buttons.
 * Data from API by slug (route param). Deep link: /product/:slug.
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { NO_DETAIL_PAGE_SLUGS } from '../constants/products';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CartPanel } from '../components/CartPanel';
import { CartToast } from '../components/CartToast';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { fetchProductBySlug } from '../services/api';

const DETAIL_IMAGE_FALLBACK = '/img/2.webp';
const DETAIL_IMAGE_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f2e3e1"/>
          <stop offset="100%" stop-color="#7A5C8E"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="750" fill="url(#bg)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="44" fill="#4B2A63" font-family="Arial, sans-serif">
        Product image
      </text>
    </svg>`
  );

export function ProductDetailPage({ cartOpen, onCartOpen, setCartOpen }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastShow, setToastShow] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Products with no detail page: redirect to home
  useEffect(() => {
    if (slug && NO_DETAIL_PAGE_SLUGS.includes(slug)) {
      navigate('/', { replace: true });
      return;
    }
  }, [slug, navigate]);

  useEffect(() => {
    let cancelled = false;
    fetchProductBySlug(slug).then((p) => {
      if (!cancelled) {
        setProduct(p);
        setSelectedVariantIndex(0);
        setGalleryIndex(0);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [slug]);

  const name = lang === 'ar' && product?.nameAr ? product.nameAr : (product?.name || '');
  const desc = lang === 'ar' && product?.descriptionAr ? product.descriptionAr : (product?.description || '');
  const hasVariants = product?.variants && product.variants.length > 0;
  const selectedVariant = hasVariants ? product.variants[selectedVariantIndex] : null;
  const displayPrice = selectedVariant ? selectedVariant.price : (product?.price ?? 0);
  const displayName = selectedVariant
    ? `${name} (${lang === 'ar' ? selectedVariant.labelAr : selectedVariant.labelEn})`
    : name;

  const galleryImages = product?.images && product.images.length > 0 ? product.images : [product?.imageUrl || DETAIL_IMAGE_FALLBACK];
  const mainImageSrc = galleryImages[galleryIndex] || galleryImages[0] || DETAIL_IMAGE_FALLBACK;

  const isDateBalls = product?.slug === 'date-balls-chocolate';

  if (loading || !product) {
    return (
      <>
        <Navbar backToShop alwaysShowBackground onCartClick={onCartOpen ? () => onCartOpen(true) : undefined} />
        <main className="product-main" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          {loading ? <p>{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p> : (
            <>
              <p>{lang === 'ar' ? 'المنتج غير موجود' : 'Product not found'}</p>
              <Link to="/">{(lang === 'ar' ? 'الرئيسية' : 'Home')}</Link>
            </>
          )}
        </main>
      </>
    );
  }

  const handleAddToCart = () => {
    addItem({
      ...product,
      name: displayName,
      price: displayPrice,
    });
    setToastShow(true);
  };

  const handleCashOnDelivery = () => {
    addItem({ ...product, name: displayName, price: displayPrice });
    navigate('/checkout');
  };

  const handlePayVisa = () => {
    addItem({ ...product, name: displayName, price: displayPrice });
    navigate('/checkout');
  };

  return (
    <>
      <Navbar backToShop={false} alwaysShowBackground onCartClick={onCartOpen ? () => onCartOpen(true) : undefined} />
      <CartPanel isOpen={cartOpen} onClose={() => setCartOpen?.(false)} />
      <CartToast show={toastShow} onHide={() => setToastShow(false)} />
      <main className={`product-main ${isDateBalls ? 'product-main-date-balls' : ''}`}>
        <div className={`product-hero ${isDateBalls ? 'product-hero-date-balls' : ''}`}>
          <div className="product-hero-image product-hero-anim">
            <picture>
              <img
                src={mainImageSrc}
                alt={name}
                width="1200"
                height="750"
                decoding="async"
                fetchpriority="high"
                onError={(e) => {
                  if (e.currentTarget.src.endsWith(DETAIL_IMAGE_FALLBACK)) {
                    e.currentTarget.src = DETAIL_IMAGE_PLACEHOLDER;
                    return;
                  }
                  if (e.currentTarget.src !== DETAIL_IMAGE_PLACEHOLDER) {
                    e.currentTarget.src = DETAIL_IMAGE_FALLBACK;
                  }
                }}
              />
            </picture>
            {galleryImages.length > 1 && (
              <div className="product-gallery-dots" aria-label={lang === 'ar' ? 'اختر الصورة' : 'Select image'}>
                {galleryImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`product-gallery-dot ${i === galleryIndex ? 'active' : ''}`}
                    onClick={() => setGalleryIndex(i)}
                    aria-current={i === galleryIndex ? 'true' : undefined}
                    aria-label={`${i + 1} / ${galleryImages.length}`}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="product-hero-overlay product-hero-anim" />
        </div>
        <div className="product-content product-content-anim">
          <div className="product-content-inner product-content-anim">
            <button
              type="button"
              className="product-back"
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  const el = document.getElementById('product');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 80);
              }}
            >
              <i className="bi bi-arrow-left" aria-hidden="true" />
              <span>{t('product.backHome')}</span>
            </button>
            <header className="product-header">
              <h1 className="product-name">{name}</h1>
              {hasVariants && (
                <div className="product-variants" role="group" aria-label={lang === 'ar' ? 'اختر الحجم' : 'Choose size'}>
                  {product.variants.map((v, i) => (
                    <button
                      key={v.key}
                      type="button"
                      className={`product-variant-btn ${i === selectedVariantIndex ? 'active' : ''}`}
                      onClick={() => setSelectedVariantIndex(i)}
                    >
                      {lang === 'ar' ? v.labelAr : v.labelEn} — {v.price} ₪
                    </button>
                  ))}
                </div>
              )}
              <div className="product-preview-price-wrap">
                <span className="product-preview-price">{displayPrice}</span>
                <span className="product-preview-currency">₪</span>
              </div>
              <p className="product-lead">{desc}</p>
            </header>
            {product.details && product.details.length > 0 && (
              <section className="product-details">
                <h2 className="product-details-title">{t('product.inside')}</h2>
                <ul className="product-details-list">
                  {product.details.map((key) => (
                    <li key={key}>{t(`product.${key}`)}</li>
                  ))}
                </ul>
              </section>
            )}
            <section className="product-buy" id="buy">
              <h2 className="product-buy-title">{t('product.buyTitle')}</h2>
              <p className="product-buy-desc">{t('product.buyDesc')}</p>
              <div className="product-buy-btns">
                <button
                  type="button"
                  className="product-btn product-btn-cart"
                  onClick={handleAddToCart}
                >
                  <i className="bi bi-bag-plus" aria-hidden="true" />
                  <span>{t('product.addToCart')}</span>
                </button>
                <button
                  type="button"
                  className="product-btn product-btn-pay"
                  onClick={handlePayVisa}
                >
                  <i className="bi bi-credit-card-2-front" aria-hidden="true" />
                  <span>{t('product.btnPay')}</span>
                </button>
                <button
                  type="button"
                  className="product-btn product-btn-cod"
                  onClick={handleCashOnDelivery}
                >
                  <i className="bi bi-cash-stack" aria-hidden="true" />
                  <span>{t('product.btnCod')}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
