import { useEffect } from 'react';
import { initScrollPerformance, refreshScrollReveal } from '../lib/scrollReveal';

/**
 * Reveal `.anim-on-scroll` elements when they enter the viewport.
 * Re-runs when `deps` change (route, loaded data, etc.).
 */
export function useScrollReveal(deps = []) {
  useEffect(() => {
    let cancelled = false;
    let raf = 0;

    const run = () => {
      if (!cancelled) refreshScrollReveal();
    };

    raf = requestAnimationFrame(run);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, deps);
}

/** App shell: scroll perf + one extra refresh after full load. */
export function useScrollPerformance() {
  useEffect(() => {
    const cleanupScroll = initScrollPerformance();
    const onLoad = () => refreshScrollReveal();
    window.addEventListener('load', onLoad, { once: true });
    return () => {
      cleanupScroll();
      window.removeEventListener('load', onLoad);
    };
  }, []);
}
