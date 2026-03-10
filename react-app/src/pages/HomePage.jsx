/**
 * HomePage — Hero, Shop (product grid), Order block, Footer.
 * Shop: products loaded once, displayed by order (no filter/sort UI).
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Hero } from '../components/Hero';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { CartPanel } from '../components/CartPanel';
import { CartToast } from '../components/CartToast';
import { CookieConsent } from '../components/CookieConsent';
import { useLanguage } from '../context/LanguageContext';
import { fetchProducts } from '../services/api';

export function HomePage({ onCartOpen, cartOpen, setCartOpen }) {
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastShow, setToastShow] = useState(false);
  const [activeBoxIndex, setActiveBoxIndex] = useState(0);
  const [activeSauceIndex, setActiveSauceIndex] = useState(0);
  const boxesGridRef = useRef(null);
  const saucesGridRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((list) => {
        if (!cancelled && Array.isArray(list)) setProducts(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('.anim-on-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [products]);

  const shopList = useMemo(() => {
    const list = [...products];
    const aOrd = (a) => Number(a.order) || 0;
    list.sort((a, b) => aOrd(a) - aOrd(b));
    return list;
  }, [products]);

  const dateBallsProduct = useMemo(
    () => shopList.find((p) => p.slug === 'date-balls-chocolate'),
    [shopList]
  );

  const groupedByCategory = useMemo(() => {
    const groups = { boxes: [], sauces: [], chopsticks: [] };
    shopList.forEach((p) => {
      if (p.slug === 'date-balls-chocolate') return;
      const key = p.category || 'boxes';
      if (groups[key]) groups[key].push(p);
    });
    return groups;
  }, [shopList]);

  // Track which card is centered in horizontal carousels (mobile) to highlight its step.
  useEffect(() => {
    const attachScrollHandler = (ref, itemCount, setActive) => {
      const container = ref.current;
      if (!container || itemCount <= 1) return undefined;

      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          const rect = container.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const children = Array.from(container.children);
          if (!children.length) {
            ticking = false;
            return;
          }
          let closestIdx = 0;
          let closestDist = Number.POSITIVE_INFINITY;
          children.forEach((child, idx) => {
            const cRect = child.getBoundingClientRect();
            const cCenter = cRect.left + cRect.width / 2;
            const dist = Math.abs(cCenter - centerX);
            if (dist < closestDist) {
              closestDist = dist;
              closestIdx = idx;
            }
          });
          setActive(closestIdx);
          ticking = false;
        });
      };

      container.addEventListener('scroll', onScroll, { passive: true });
      // Run once initially to set correct active index.
      onScroll();
      return () => container.removeEventListener('scroll', onScroll);
    };

    const detachBoxes = attachScrollHandler(boxesGridRef, groupedByCategory.boxes.length, setActiveBoxIndex);
    const detachSauces = attachScrollHandler(saucesGridRef, groupedByCategory.sauces.length, setActiveSauceIndex);
    return () => {
      detachBoxes && detachBoxes();
      detachSauces && detachSauces();
    };
  }, [groupedByCategory.boxes.length, groupedByCategory.sauces.length]);

  const categoryMeta = {
    boxes: {
      title: lang === 'ar' ? 'بوكسات الدامبلنغ' : 'Dumpling boxes',
      sub: lang === 'ar' ? 'العلب الأساسية التي تضم الدامبلنغ' : 'Main dumpling boxes',
    },
    dateBalls: {
      title: lang === 'ar' ? 'كرات التمر' : 'Date balls',
      sub: lang === 'ar' ? 'حلو فاخر من التمر بالشوكولاتة' : 'Signature date balls with chocolate',
    },
    sauces: {
      title: lang === 'ar' ? 'الصلصات' : 'Sauces',
      sub: lang === 'ar' ? 'اختَر الصلصات التي تناسب ذوقك' : 'Pick your perfect dips',
    },
    chopsticks: {
      title: lang === 'ar' ? 'إضافات' : 'Add-ons',
      sub: lang === 'ar' ? 'تفاصيل صغيرة تكمل التجربة' : 'Little touches to complete the box',
    },
  };

  const emptyLabel = t('empty.title');

  return (
    <>
      <PageLoader visible={loading && !products.length} />
      <Navbar onCartClick={onCartOpen} />
      <CartPanel isOpen={cartOpen} onClose={() => setCartOpen?.(false)} />
      <CartToast show={toastShow} onHide={() => setToastShow(false)} />

      <main>
        <Hero />
        <section className="block-product" id="product">
          <div className="shop-wrap mx-auto">
            <header className="shop-header anim-on-scroll">
              <h2 className="shop-title">{t('shop.title')}</h2>
              <p className="shop-sub">{t('shop.sub')}</p>
            </header>
            <div className="shop-grid-group">
              {groupedByCategory.boxes.length > 0 && (
                <section
                  className={`shop-category-section shop-category-boxes${
                    groupedByCategory.boxes.length === 1 ? ' shop-category-section--single' : ''
                  }`}
                >
                  <header className="shop-category-header">
                    <h3 className="shop-category-title">{categoryMeta.boxes.title}</h3>
                    <p className="shop-category-sub">{categoryMeta.boxes.sub}</p>
                  </header>
                  {groupedByCategory.boxes.length > 1 && (
                    <div className="shop-section-steps shop-section-steps-mobile">
                      {groupedByCategory.boxes.map((_, idx) => (
                        <div
                          key={idx}
                          className={`shop-step ${idx === activeBoxIndex ? 'shop-step--active' : ''}`}
                        >
                          <span className="shop-step-dot">{idx + 1}</span>
                          {idx < groupedByCategory.boxes.length - 1 && (
                            <span className="shop-step-line" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="shop-grid" ref={boxesGridRef}>
                    {groupedByCategory.boxes.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onShowToast={() => setToastShow(true)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {dateBallsProduct && (
                <section className="shop-category-section shop-category-date-balls shop-category-section--single">
                  <header className="shop-category-header">
                    <h3 className="shop-category-title">{categoryMeta.dateBalls.title}</h3>
                    <p className="shop-category-sub">{categoryMeta.dateBalls.sub}</p>
                  </header>
                  <div className="shop-grid">
                    <ProductCard
                      key={dateBallsProduct.id}
                      product={dateBallsProduct}
                      onShowToast={() => setToastShow(true)}
                    />
                  </div>
                </section>
              )}

              {groupedByCategory.sauces.length > 0 && (
                <section
                  className={`shop-category-section shop-category-sauces${
                    groupedByCategory.sauces.length === 1 ? ' shop-category-section--single' : ''
                  }`}
                >
                  <header className="shop-category-header">
                    <h3 className="shop-category-title">{categoryMeta.sauces.title}</h3>
                    <p className="shop-category-sub">{categoryMeta.sauces.sub}</p>
                  </header>
                  {groupedByCategory.sauces.length > 1 && (
                    <div className="shop-section-steps shop-section-steps-mobile">
                      {groupedByCategory.sauces.map((_, idx) => (
                        <div
                          key={idx}
                          className={`shop-step ${idx === activeSauceIndex ? 'shop-step--active' : ''}`}
                        >
                          <span className="shop-step-dot">{idx + 1}</span>
                          {idx < groupedByCategory.sauces.length - 1 && (
                            <span className="shop-step-line" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="shop-grid" ref={saucesGridRef}>
                    {groupedByCategory.sauces.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onShowToast={() => setToastShow(true)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {groupedByCategory.chopsticks.length > 0 && (
                <section
                  className={`shop-category-section shop-category-chopsticks${
                    groupedByCategory.chopsticks.length === 1 ? ' shop-category-section--single' : ''
                  }`}
                >
                  <header className="shop-category-header">
                    <h3 className="shop-category-title">{categoryMeta.chopsticks.title}</h3>
                    <p className="shop-category-sub">{categoryMeta.chopsticks.sub}</p>
                  </header>
                  <div className="shop-grid">
                    {groupedByCategory.chopsticks.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onShowToast={() => setToastShow(true)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
            {shopList.length === 0 && (
              <div className="shop-empty" aria-live="polite">
                <i className="bi bi-inbox" />
                <p className="shop-empty-title">{emptyLabel}</p>
                <p className="shop-empty-desc">{t('empty.desc')}</p>
              </div>
            )}
          </div>
        </section>
        <section className="block-order" id="order">
          <div className="order-inner">
            <h2 className="order-title anim-on-scroll">{t('order.title')}</h2>
            <p className="order-sub anim-on-scroll">{t('order.sub')}</p>
            <a
              href="https://wa.me/972501234567"
              className="btn-order btn-order-wa anim-on-scroll"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="bi bi-whatsapp" /> <span>{t('order.wa')}</span>
            </a>
          </div>
        </section>
        <Footer />
      </main>
      <CookieConsent />
    </>
  );
}

function PageLoader({ visible }) {
  const [show, setShow] = useState(visible);
  useEffect(() => {
    if (!visible && show) {
      const el = document.getElementById('pageLoader');
      if (el) {
        el.classList.add('loader-out');
        const tmr = setTimeout(() => setShow(false), 450);
        return () => clearTimeout(tmr);
      }
    }
    setShow(visible);
  }, [visible, show]);
  if (!show) return null;
  return (
    <div className="page-loader" id="pageLoader">
      <div className="loader-inner">
        <img src="/img/logo.webp" alt="Chef Farah Ammar" className="loader-logo" width="220" height="110" decoding="async" />
        <div className="loader-bar"><span className="loader-bar-fill" /></div>
      </div>
    </div>
  );
}
