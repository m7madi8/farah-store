/**
 * Public env config (VITE_* only — exposed in the browser bundle).
 * Secrets / keys: set in react-app/.env (never commit .env).
 */

function readEnv(name, fallback = '') {
  const raw = import.meta.env[name];
  if (raw == null || String(raw).trim() === '') return fallback;
  return String(raw).trim();
}

const DEFAULT_WHATSAPP_URL = 'https://wa.me/972592431275';

export const siteConfig = {
  siteUrl: readEnv('VITE_SITE_URL'),
  whatsappUrl: readEnv('VITE_WHATSAPP_URL', DEFAULT_WHATSAPP_URL),
  instagramUrl: readEnv('VITE_INSTAGRAM_URL'),
  apiBase: readEnv('VITE_API_BASE'),
  phoneDisplay: '+972 59-243-1275',
};

/** Build absolute URL for OG/canonical when VITE_SITE_URL is set. */
export function absoluteSiteUrl(path = '/') {
  const base = siteConfig.siteUrl.replace(/\/$/, '');
  if (!base) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
