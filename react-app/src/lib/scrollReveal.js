const REVEAL_SELECTOR = '.anim-on-scroll';
const REDUCE_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

let observer = null;
const observed = new WeakSet();

let scrolling = false;
let scrollTimer = 0;
let scrollRaf = 0;
let scrollListenerAttached = false;

function prefersReducedMotion() {
  return window.matchMedia(REDUCE_MOTION_QUERY).matches;
}

function settleReveal(el) {
  el.classList.add('reveal-settled');
}

function revealInstant(el) {
  if (el.classList.contains('reveal-settled')) return;
  el.classList.add('is-visible', 'reveal-settled');
}

function revealAnimated(el) {
  if (el.classList.contains('is-visible')) return;
  el.classList.add('is-visible');
  el.addEventListener('animationend', () => settleReveal(el), { once: true });
  window.setTimeout(() => settleReveal(el), 650);
}

function revealElement(el) {
  if (prefersReducedMotion() || scrolling) {
    revealInstant(el);
    return;
  }
  revealAnimated(el);
}

function unobserve(el) {
  observer?.unobserve(el);
  observed.delete(el);
}

function isNearViewport(el) {
  const rect = el.getBoundingClientRect();
  const margin = window.innerHeight * 0.08;
  return rect.top < window.innerHeight - margin && rect.bottom > margin;
}

function onIntersect(entry) {
  if (!entry.isIntersecting) return;
  revealElement(entry.target);
  unobserve(entry.target);
}

function ensureObserver() {
  if (observer) return observer;

  observer = new IntersectionObserver(
    (entries) => entries.forEach(onIntersect),
    { threshold: 0.08, rootMargin: '0px 0px 6% 0px' }
  );

  return observer;
}

function settleVisibleInView() {
  document.querySelectorAll(`${REVEAL_SELECTOR}.is-visible:not(.reveal-settled)`).forEach(settleReveal);
  document.querySelectorAll(`${REVEAL_SELECTOR}:not(.is-visible)`).forEach((el) => {
    if (isNearViewport(el)) {
      revealElement(el);
      unobserve(el);
    }
  });
}

function onScroll() {
  if (scrollRaf) return;
  scrollRaf = window.requestAnimationFrame(() => {
    scrollRaf = 0;
    if (!scrolling) {
      scrolling = true;
      document.body.classList.add('is-scrolling');
    }
    clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      scrolling = false;
      document.body.classList.remove('is-scrolling');
      settleVisibleInView();
    }, 100);
  });
}

function attachScrollListener() {
  if (scrollListenerAttached) return;
  scrollListenerAttached = true;
  window.addEventListener('scroll', onScroll, { passive: true });
}

/** Scan DOM and reveal / observe `.anim-on-scroll` elements. Safe to call repeatedly. */
export function refreshScrollReveal() {
  attachScrollListener();

  const els = document.querySelectorAll(`${REVEAL_SELECTOR}:not(.reveal-settled)`);
  if (!els.length) return;

  if (prefersReducedMotion()) {
    els.forEach(revealInstant);
    return;
  }

  const io = ensureObserver();
  els.forEach((el) => {
    if (isNearViewport(el)) {
      revealElement(el);
      unobserve(el);
      return;
    }
    if (observed.has(el)) return;
    observed.add(el);
    io.observe(el);
  });
}

export function destroyScrollReveal() {
  observer?.disconnect();
  observer = null;
}

/** Scroll perf: hero pause only; cards/footer reveal instantly while scrolling. */
export function initScrollPerformance() {
  attachScrollListener();
  return () => {
    clearTimeout(scrollTimer);
    if (scrollRaf) {
      window.cancelAnimationFrame(scrollRaf);
      scrollRaf = 0;
    }
    window.removeEventListener('scroll', onScroll);
    scrollListenerAttached = false;
    document.body.classList.remove('is-scrolling');
    scrolling = false;
  };
}
