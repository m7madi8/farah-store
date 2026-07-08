/**
 * Hero — full-viewport hero section with logo and tagline.
 * Background: lightweight CSS gradient only (no WebGL).
 */

import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BiIcon } from './BiIcon';

const HERO_SETTLE_MS = 1300;

export function Hero() {
  const { t } = useLanguage();
  const tagline = t('hero.tagline');

  useEffect(() => {
    const section = document.getElementById('hero');
    if (!section) return undefined;

    const settle = () => section.classList.add('hero-settled');

    const onEnd = (event) => {
      if (event.animationName === 'fadeIn' || event.animationName === 'fadeUp' || event.animationName === 'logoEntrance') {
        settle();
      }
    };

    section.addEventListener('animationend', onEnd);
    const timer = window.setTimeout(settle, HERO_SETTLE_MS);

    return () => {
      section.removeEventListener('animationend', onEnd);
      window.clearTimeout(timer);
    };
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
        <span className="hero-scroll-label">{t('hero.scroll')}</span>
        <BiIcon name="chevron-down" />
      </div>
    </section>
  );
}
