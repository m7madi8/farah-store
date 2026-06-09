/**
 * Hero — full-viewport hero section with logo and tagline.
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BiIcon } from './BiIcon';

export function Hero() {
  const { t } = useLanguage();
  const tagline = t('hero.tagline');
  const [HeroBackground, setHeroBackground] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      import('./HeroBackground').then((mod) => {
        if (!cancelled) setHeroBackground(() => mod.HeroBackground);
      });
    };

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(load, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const timer = setTimeout(load, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const scrollToShop = () => {
    document.getElementById('product')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const parts = tagline.split(/(\s+)/).filter(Boolean);
  const delayPerUnit = 0.12;

  return (
    <section className="hero-full" id="hero">
      <div className="hero-bg">
        {HeroBackground ? <HeroBackground /> : null}
      </div>
      <div className="hero-content">
        <img
          src="/img/logo.webp"
          alt="Chef Farah Ammar"
          className="hero-logo anim-fade-up"
          width="400"
          height="200"
          decoding="async"
          fetchPriority="high"
        />
        <p className="hero-tagline hero-tagline-type" aria-label={tagline}>
          {parts.map((part, i) => (
            <span
              key={i}
              className="hero-tagline-char"
              style={{ animationDelay: `${0.5 + i * delayPerUnit}s` }}
            >
              {part === ' ' ? '\u00A0' : part}
            </span>
          ))}
        </p>
        <button
          type="button"
          className="hero-shop-cta anim-fade-up"
          onClick={scrollToShop}
        >
          {t('hero.shopNow')}
        </button>
      </div>
      <div className="hero-scroll anim-fade">
        <span>{t('hero.scroll')}</span>
        <BiIcon name="chevron-down" />
      </div>
    </section>
  );
}
