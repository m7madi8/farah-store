import { useEffect } from 'react';

const REVEAL_SELECTOR = '.anim-on-scroll';

/**
 * Reveal elements with `.anim-on-scroll` when they enter the viewport.
 * Re-runs when `deps` change (route, loaded data, etc.).
 */
export function useScrollReveal(deps = []) {
  useEffect(() => {
    let observer;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const els = document.querySelectorAll(REVEAL_SELECTOR);

      if (!els.length) return;

      if (reduceMotion) {
        els.forEach((el) => el.classList.add('is-visible'));
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.06, rootMargin: '0px 0px 8% 0px' }
      );

      els.forEach((el) => observer.observe(el));
    }, 80);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, deps);
}
