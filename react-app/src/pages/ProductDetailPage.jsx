/**
 * ProductDetailPage — single product view with hero image, details, and Add to cart / COD checkout.
 * Data from API by slug (route param). Deep link: /product/:slug.
 */

import '@/styles/product.css';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { NO_DETAIL_PAGE_SLUGS } from '../constants/products';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CartPanel } from '../components/CartPanel';
import { CartToast } from '../components/CartToast';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { fetchProductBySlug, getProductBySlug } from '../services/api';
import { scrollToPageHeaderAfterPaint } from '../lib/scrollToTop';
import { DESKTOP_HERO_MEDIA, getResponsiveHeroImages } from '../lib/productHeroImages';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { SiteIcon } from '../components/SiteIcon';

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

function resolveInitialProduct(slug, fromNav) {
  if (fromNav?.slug === slug) return fromNav;
  return getProductBySlug(slug);
}

export function ProductDetailPage({ cartOpen, onCartOpen, setCartOpen }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const navProduct = location.state?.product;
  const [product, setProduct] = useState(() => resolveInitialProduct(slug, navProduct));
  const [notFound, setNotFound] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (slug && NO_DETAIL_PAGE_SLUGS.includes(slug)) {
      navigate('/', { replace: true });
    }
  }, [slug, navigate]);

  useEffect(() => {
    scrollToPageHeaderAfterPaint();
    const prev = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => {
      history.scrollRestoration = prev;
    };
  }, [slug]);

  useEffect(() => {
    if (!product) return undefined;
    scrollToPageHeaderAfterPaint();
    return undefined;
  }, [product?.slug]);

  useEffect(() => {
    const initial = resolveInitialProduct(slug, navProduct);
    setProduct(initial);
    setNotFound(false);
    setSelectedVariantIndex(0);
    setGalleryIndex(0);

    let cancelled = false;
    fetchProductBySlug(slug)
      .then((p) => {
        if (cancelled) return;
        if (p) {
          setProduct(p);
          setNotFound(false);
        } else if (!initial) {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!cancelled && !initial) setNotFound(true);
      });

    return () => { cancelled = true; };
  }, [slug, navProduct]);

  const name = lang === 'ar' && product?.nameAr ? product.nameAr : (product?.name || '');
  const desc = lang === 'ar' && product?.descriptionAr ? product.descriptionAr : (product?.description || '');
  const hasVariants = product?.variants && product.variants.length > 0;
  const selectedVariant = hasVariants ? product.variants[selectedVariantIndex] : null;
  const displayPrice = selectedVariant ? selectedVariant.price : (product?.price ?? 0);
  const displayName = selectedVariant
    ? `${name} (${lang === 'ar' ? selectedVariant.labelAr : selectedVariant.labelEn})`
    : name;

  const galleryImages = useMemo(
    () => (product?.images && product.images.length > 0 ? product.images : [product?.imageUrl || DETAIL_IMAGE_FALLBACK]),
    [product]
  );
  const mainImageSrc = galleryImages[galleryIndex] || galleryImages[0] || DETAIL_IMAGE_FALLBACK;

  const responsiveHero = useMemo(() => getResponsiveHeroImages(product?.slug), [product?.slug]);
  const heroMobileSrc = responsiveHero?.mobile ?? mainImageSrc;
  const heroDesktopSrc = responsiveHero?.desktop ?? mainImageSrc;

  const isDateBalls = product?.slug === 'date-balls-chocolate';
  const isDumplingsHero = responsiveHero != null;

  useEffect(() => {
    const mobile = heroMobileSrc;
    const desktop = heroDesktopSrc;
    const href =
      desktop && desktop !== mobile && window.matchMedia(DESKTOP_HERO_MEDIA).matches
        ? desktop
        : mobile;
    if (!href || href.startsWith('data:')) return undefined;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [heroMobileSrc, heroDesktopSrc]);

  if (!product) {
    return (
      <>
        <Navbar backToShop alwaysShowBackground onCartClick={onCartOpen ? () => onCartOpen(true) : undefined} />
        <main className="product-main has-floating-back" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          {notFound ? (
            <>
              <p>{lang === 'ar' ? 'المنتج غير موجود' : 'Product not found'}</p>
            </>
          ) : null}
        </main>
        <FloatingBackButton />
      </>
    );
  }

  const handleAddToCart = () => {
    addItem({
      ...product,
      name: displayName,
      price: displayPrice,
      variantKey: selectedVariant?.key ?? null,
    });
    setToastShow(true);
  };

  const handleCashOnDelivery = () => {
    addItem({
      ...product,
      name: displayName,
      price: displayPrice,
      variantKey: selectedVariant?.key ?? null,
    });
    navigate('/checkout');
  };

  return (
    <>
      <Navbar backToShop={false} alwaysShowBackground onCartClick={onCartOpen ? () => onCartOpen(true) : undefined} />
      <CartPanel isOpen={cartOpen} onClose={() => setCartOpen?.(false)} />
      <CartToast show={toastShow} onHide={() => setToastShow(false)} />
      <main className={`product-main has-floating-back${isDateBalls ? ' product-main-date-balls' : ''}${isDumplingsHero ? ' product-main-dumplings' : ''}`}>
        <div className={`product-hero${isDateBalls ? ' product-hero-date-balls' : ''}${isDumplingsHero ? ' product-hero-dumplings' : ''}`}>
          <div className="product-hero-image product-hero-anim">
            <picture>
              {responsiveHero && (
                <source media={DESKTOP_HERO_MEDIA} srcSet={heroDesktopSrc} />
              )}
              <img
                src={heroMobileSrc}
                alt={name}
                width="1200"
                height="750"
                loading="eager"
                decoding="sync"
                fetchpriority="high"
                onLoad={() => scrollToPageHeaderAfterPaint()}
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
                  <SiteIcon name="cart-add" />
                  <span>{t('product.addToCart')}</span>
                </button>
                <button
                  type="button"
                  className="product-btn product-btn-cod"
                  onClick={handleCashOnDelivery}
                >
                  <SiteIcon name="cod" />
                  <span>{t('product.btnCod')}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
      <FloatingBackButton />
      <Footer />
    </>
  );
}
