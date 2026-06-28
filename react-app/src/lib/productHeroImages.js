/** Product detail hero: mobile vs tablet/desktop sources (picture element). */
export const DESKTOP_HERO_MEDIA = '(min-width: 768px)';

const RESPONSIVE_HERO_BY_SLUG = {
  'dumplings-chicken': { mobile: '/img/1.webp', desktop: '/img/pro1.png' },
  'dumplings-meat': { mobile: '/img/1.webp', desktop: '/img/pro1.png' },
};

export function getResponsiveHeroImages(slug) {
  const key = String(slug || '').trim().toLowerCase();
  return RESPONSIVE_HERO_BY_SLUG[key] ?? null;
}

export function isResponsiveHeroProduct(slug) {
  return getResponsiveHeroImages(slug) != null;
}
