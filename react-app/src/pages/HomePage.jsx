/**
 * HomePage — Hero, Shop (product grid), Order block, Footer.
 * Shop: products loaded once, displayed by order (no filter/sort UI).
 */

import { useState, useEffect, useMemo } from 'react';
import { Hero } from '../components/Hero';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { CartPanel } from '../components/CartPanel';
import { CartToast } from '../components/CartToast';
import { useLanguage } from '../context/LanguageContext';
import { fetchProducts, getMockProducts } from '../services/api';
import { siteConfig } from '../config/env';
import { BiIcon } from '../components/BiIcon';

export function HomePage({ onCartOpen, cartOpen, setCartOpen }) {
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState(getMockProducts);
  const [remoteChecked, setRemoteChecked] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [CookieConsent, setCookieConsent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    import('../components/CookieConsent').then((mod) => {
      if (!cancelled) setCookieConsent(() => mod.CookieConsent);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((list) => {
        if (!cancelled && Array.isArray(list) && list.length > 0) {
          setProducts(list);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRemoteChecked(true);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = document.querySelectorAll('.anim-on-scroll');
    if (reduceMotion) {
      els.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px 40px 0px' }
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
                  <div className="shop-grid">
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
                  <div className="shop-grid">
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
            {shopList.length === 0 && remoteChecked && (
              <div className="shop-empty" aria-live="polite">
                <BiIcon name="inbox" />
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
              href={siteConfig.whatsappUrl || '#order'}
              className="btn-order btn-order-wa anim-on-scroll"
              target={siteConfig.whatsappUrl ? '_blank' : undefined}
              rel={siteConfig.whatsappUrl ? 'noopener noreferrer' : undefined}
              aria-disabled={siteConfig.whatsappUrl ? undefined : true}
            >
              <BiIcon name="whatsapp" /> <span>{t('order.wa')}</span>
            </a>
          </div>
        </section>
        <Footer />
      </main>
      {CookieConsent ? <CookieConsent /> : null}
    </>
  );
}
