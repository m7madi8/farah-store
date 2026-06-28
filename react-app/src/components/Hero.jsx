/**
 * Hero — full-viewport hero section with logo and tagline.
 * Background: lightweight CSS gradient only (no WebGL).
 */

import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BiIcon } from './BiIcon';

export function Hero() {
  const { t } = useLanguage();
  const tagline = t('hero.tagline');

  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        hero.classList.toggle('hero-paused', !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const scrollToShop = () => {
    document.getElementById('product')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="hero-full" id="hero">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-content">
        <img
          src="/img/logo.webp"
          alt="Chef Farah Ammar"
          className="hero-logo anim-fade-up"
          width="400"
          height="200"
          loading="eager"
          decoding="sync"
          fetchpriority="high"
        />
        <p className="hero-tagline anim-fade-up">{tagline}</p>
        <button type="button" className="hero-shop-cta anim-fade-up" onClick={scrollToShop}>
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
