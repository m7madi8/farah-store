const REVEAL_SELECTOR = '.anim-on-scroll';
const REDUCE_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

let observer = null;
const observed = new WeakSet();

function prefersReducedMotion() {
  return window.matchMedia(REDUCE_MOTION_QUERY).matches;
}

function settleReveal(el) {
  el.classList.add('reveal-settled');
}

function reveal(el) {
  if (el.classList.contains('is-visible')) return;
  el.classList.add('is-visible');
  el.addEventListener(
    'animationend',
    () => settleReveal(el),
    { once: true }
  );
  // Fallback if animation is disabled / instant
  window.setTimeout(() => settleReveal(el), 800);
}

function ensureObserver() {
  if (observer) return observer;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
        observed.delete(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px 8% 0px' }
  );

  return observer;
}

/** Scan DOM and reveal / observe `.anim-on-scroll` elements. Safe to call repeatedly. */
export function refreshScrollReveal() {
  const els = document.querySelectorAll(`${REVEAL_SELECTOR}:not(.is-visible)`);
  if (!els.length) return;

  if (prefersReducedMotion()) {
    els.forEach((el) => {
      el.classList.add('is-visible', 'reveal-settled');
    });
    return;
  }

  const io = ensureObserver();
  els.forEach((el) => {
    if (observed.has(el)) return;
    observed.add(el);
    io.observe(el);
  });
}

export function destroyScrollReveal() {
  observer?.disconnect();
  observer = null;
}

/** Pause heavy CSS animations while the user is scrolling. */
export function initScrollPerformance() {
  let timer = 0;
  let scrolling = false;

  const onScroll = () => {
    if (!scrolling) {
      scrolling = true;
      document.body.classList.add('is-scrolling');
    }
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      scrolling = false;
      document.body.classList.remove('is-scrolling');
    }, 140);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    clearTimeout(timer);
    window.removeEventListener('scroll', onScroll);
    document.body.classList.remove('is-scrolling');
  };
}
