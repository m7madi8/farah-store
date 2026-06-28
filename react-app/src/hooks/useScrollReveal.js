import { useEffect, useLayoutEffect } from 'react';
import { refreshScrollReveal } from '../lib/scrollReveal';

/**
 * Reveal `.anim-on-scroll` elements when they enter the viewport.
 * Re-runs when `deps` change (route, loaded data, etc.).
 */
export function useScrollReveal(deps = []) {
  useLayoutEffect(() => {
    let cancelled = false;
    let raf2 = 0;

    const run = () => {
      if (!cancelled) refreshScrollReveal();
    };

    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(run);
    });

    const lateTimer = window.setTimeout(run, 120);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      clearTimeout(lateTimer);
    };
  }, deps);
}

/** Run once after mount (e.g. app shell). */
export function useScrollRevealOnce() {
  useEffect(() => {
    refreshScrollReveal();
    const onLoad = () => refreshScrollReveal();
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
}
