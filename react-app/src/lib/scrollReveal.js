const REVEAL_SELECTOR = '.anim-on-scroll';
const REDUCE_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

let observer = null;

function prefersReducedMotion() {
  return window.matchMedia(REDUCE_MOTION_QUERY).matches;
}

function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top < vh * 0.96 && rect.bottom > 0;
}

function reveal(el) {
  if (!el.classList.contains('is-visible')) {
    el.classList.add('is-visible');
  }
}

function ensureObserver() {
  if (observer) return observer;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.01, rootMargin: '0px 0px 10% 0px' }
  );

  return observer;
}

/** Scan DOM and reveal / observe all `.anim-on-scroll` elements. Safe to call repeatedly. */
export function refreshScrollReveal() {
  const els = document.querySelectorAll(REVEAL_SELECTOR);
  if (!els.length) return;

  if (prefersReducedMotion()) {
    els.forEach(reveal);
    return;
  }

  const io = ensureObserver();
  els.forEach((el) => {
    if (el.classList.contains('is-visible')) return;
    if (isInViewport(el)) {
      reveal(el);
      return;
    }
    io.observe(el);
  });
}

export function destroyScrollReveal() {
  observer?.disconnect();
  observer = null;
}
