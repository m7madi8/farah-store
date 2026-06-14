/** Jump to document top instantly (ignores global smooth-scroll). */
export function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  if (document.scrollingElement) {
    document.scrollingElement.scrollTop = 0;
  }
}

/** Align viewport with the fixed header at the very top. */
export function scrollToPageHeader() {
  scrollToTop();
}

/** Reset scroll after paint and layout shifts (hero image, etc.). */
export function scrollToPageHeaderAfterPaint() {
  scrollToPageHeader();
  requestAnimationFrame(() => {
    scrollToPageHeader();
    requestAnimationFrame(scrollToPageHeader);
  });
}

/** @deprecated use scrollToPageHeaderAfterPaint */
export function scrollToTopAfterPaint() {
  scrollToPageHeaderAfterPaint();
}
