/**
 * Syncs document meta tags from VITE_SITE_URL (set in .env).
 */

import { useEffect } from 'react';
import { absoluteSiteUrl, siteConfig } from '@/config/env';

function setMeta(attr, key, value) {
  if (!value) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function SiteMeta() {
  useEffect(() => {
    if (!siteConfig.siteUrl) return undefined;

    const pageUrl = absoluteSiteUrl('/');
    const imageUrl = absoluteSiteUrl('/img/logo.webp');

    setMeta('property', 'og:url', pageUrl);
    setMeta('property', 'og:image', imageUrl);
    setMeta('name', 'twitter:image', imageUrl);
    setLink('canonical', pageUrl);

    return undefined;
  }, []);

  return null;
}
