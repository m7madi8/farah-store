/** Extra product photos shown below the hero on detail pages. */
const DUMPLINGS_GALLERY = ['/img/d1.png', '/img/d2.png', '/img/d3.jpeg', '/img/d4.png'];

const GALLERY_BY_SLUG = {
  'dumplings-chicken': DUMPLINGS_GALLERY,
  'dumplings-meat': DUMPLINGS_GALLERY,
};

export function getProductGalleryImages(slug) {
  const key = String(slug || '').trim().toLowerCase();
  return GALLERY_BY_SLUG[key] ?? [];
}
