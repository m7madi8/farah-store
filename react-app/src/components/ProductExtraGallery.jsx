/**
 * Additional product photos — below hero on dumplings detail pages.
 */

import { useLanguage } from '../context/LanguageContext';
import { getProductGalleryImages } from '../lib/productGalleryImages';

export function ProductExtraGallery({ slug, productName }) {
  const { t } = useLanguage();
  const images = getProductGalleryImages(slug);
  if (!images.length) return null;

  return (
    <section
      className="product-extra-gallery anim-on-scroll"
      aria-label={t('product.galleryTitle')}
    >
      <div className="product-extra-gallery-track">
        {images.map((src, index) => (
          <figure key={src} className="product-extra-gallery-item">
            <img
              src={src}
              alt={`${productName} — ${index + 1}`}
              width="640"
              height="640"
              loading="lazy"
              decoding="async"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
