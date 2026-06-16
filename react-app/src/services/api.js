/**
 * API service for Chef Farah Ammar store.
 *
 * Data source priority:
 * 1. Firebase — when VITE_FIREBASE_* vars are set (see firebase/README.md).
 * 2. REST — when VITE_API_BASE is set (legacy Django-style API).
 * 3. Mock — built-in demo catalog + local checkout success.
 */

import { isFirebaseConfigured } from '@/lib/firebaseConfig';
import { mapFirestoreProductRow } from '@/lib/firestoreMappers';
import { siteConfig } from '@/config/env';
import { MOCK_PRODUCTS } from './mockProducts';

let firebaseModulePromise;

function loadFirebaseModule() {
  if (!firebaseModulePromise) {
    firebaseModulePromise = import('@/lib/firebase');
  }
  return firebaseModulePromise;
}

function apiBase() {
  const raw = siteConfig.apiBase;
  return raw ? raw.replace(/\/$/, '') : '';
}

/** Fail fast when Firebase/REST host is unreachable (avoids long DNS hangs). */
const REMOTE_TIMEOUT_MS = 2500;

function withTimeout(promise, ms, label = 'Request') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const DEFAULT_PRODUCT_IMAGE = '/img/2.webp';
const FEATURED_ORDER_BY_SLUG = {
  'dumplings-chicken': 1,
  'dumplings-meat': 2,
  'teriyaki-sauce': 3,
  'soya-sauce': 4,
  'buffalo-sauce': 5,
  'sweet-chili-sauce': 6,
  'chop-sticks': 7,
  'date-balls-chocolate': 8,
};

function localImageBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = String(slug).trim();
  if (!cleanSlug) return null;
  if (cleanSlug === 'date-balls-chocolate') {
    return '/img/pro2.png';
  }
  if (cleanSlug === 'dumplings-meat') {
    return '/img/products/dumplings-chicken/dumplings-chicken.webp';
  }
  return `/img/products/${cleanSlug}/${cleanSlug}.webp`;
}

async function request(path, options = {}) {
  const base = apiBase();
  if (!base) {
    throw new Error('API not configured');
  }
  const url = `${base}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json() : null;

  if (!res.ok) {
    const detail =
      payload?.error?.items ||
      payload?.error?.detail ||
      payload?.error?.message ||
      payload?.detail ||
      payload?.items ||
      payload?.message;
    throw new Error(
      detail
        ? String(detail)
        : `API ${res.status}: ${res.statusText}`
    );
  }
  return payload;
}

function toFilterCategory(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim().toLowerCase();
  if (s === 'boxes' || s === 'dumplings' || s === 'box') return 'boxes';
  if (s === 'sauces' || s === 'sauce') return 'sauces';
  if (s === 'chopsticks' || s === 'chop-sticks' || s === 'chop_sticks') return 'chopsticks';
  return '';
}

function inferCategoryFromProduct(p) {
  const raw = p.category ?? p.categories?.[0]?.category?.slug ?? p.categories?.[0]?.slug ?? (typeof p.categories?.[0]?.category === 'string' ? p.categories[0].category : '');
  const fromSlug = toFilterCategory(typeof raw === 'string' ? raw : (raw?.slug != null ? String(raw.slug) : ''));
  if (fromSlug) return fromSlug;
  const slug = (p.slug || '').toLowerCase();
  const badge = (p.badge || '').toLowerCase();
  if (slug.includes('sauce') || badge.includes('sauce')) return 'sauces';
  if (slug.includes('chop') || slug.includes('stick')) return 'chopsticks';
  return 'boxes';
}

function normalizeImageUrl(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed}`;
}

function resolveDisplayOrder(p) {
  const explicitOrder = Number(p.order ?? p.sort_order);
  if (Number.isFinite(explicitOrder) && explicitOrder > 0) return explicitOrder;
  const slug = String(p.slug || '').trim().toLowerCase();
  return FEATURED_ORDER_BY_SLUG[slug] ?? 1000;
}

function mockDetailsForSlug(slug) {
  const mock = MOCK_PRODUCTS.find((p) => p.slug === slug);
  return mock?.details?.length ? mock.details : null;
}

/** Use catalog defaults when remote DB has empty or outdated ingredient lists. */
function resolveProductDetails(slug, details) {
  const list = Array.isArray(details) ? details : [];
  const defaults = mockDetailsForSlug(slug);
  if (!defaults?.length) return list;
  if (!list.length) return defaults;
  if (list.length < defaults.length) return defaults;
  return list;
}

function normalizeProduct(p) {
  const category = inferCategoryFromProduct(p);
  const heroImg = p.hero_image ?? p.images?.find((i) => i.is_hero) ?? p.images?.[0];
  const imageUrlRaw = typeof heroImg === 'string' ? heroImg : (heroImg?.url ?? p.imageUrl);
  const backendImageUrl = normalizeImageUrl(imageUrlRaw);
  const slugImageUrl = localImageBySlug(p.slug);
  const finalImageUrl = slugImageUrl || backendImageUrl || DEFAULT_PRODUCT_IMAGE;
  const slugNorm = String(p.slug || '').trim().toLowerCase();
  const merged = {
    ...p,
    name: p.name ?? p.name_en,
    nameAr: p.nameAr ?? p.name_ar,
    description: p.description ?? p.description_en,
    descriptionAr: p.descriptionAr ?? p.description_ar,
    imageUrl: finalImageUrl,
    heroImage: finalImageUrl,
    order: resolveDisplayOrder(p),
    category,
    details: resolveProductDetails(slugNorm, p.details),
  };
  if (slugNorm === 'date-balls-chocolate') {
    merged.images = [finalImageUrl];
  }
  return merged;
}

function mapRemoteProductRow(row) {
  return normalizeProduct({
    id: row.id,
    slug: row.slug,
    name: row.name,
    name_ar: row.name_ar,
    description: row.description,
    description_ar: row.description_ar,
    price: Number(row.price),
    category: row.category,
    imageUrl: row.image_url,
    hero_image: row.hero_image,
    sort_order: row.sort_order,
    badge: row.badge,
    details: row.details,
    variants: row.variants,
    images: row.images,
  });
}

async function fetchProductsFromFirebase() {
  const [{ getFirestoreDb }, { collection, getDocs, orderBy, query }] = await Promise.all([
    loadFirebaseModule(),
    import('firebase/firestore'),
  ]);
  const db = await getFirestoreDb();
  const q = query(collection(db, 'products'), orderBy('sort_order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => mapRemoteProductRow(mapFirestoreProductRow(docSnap.id, docSnap.data())));
}

async function submitOrderFirebase(orderPayload) {
  const [{ getFirestoreDb }, { addDoc, collection, serverTimestamp }] = await Promise.all([
    loadFirebaseModule(),
    import('firebase/firestore'),
  ]);
  const db = await getFirestoreDb();
  const items = (orderPayload.items || []).map((item) => ({
    product_id: item.productId || null,
    product_slug: item.productSlug || null,
    product_name: item.name ?? '',
    quantity: item.quantity || 1,
    unit_price: item.price ?? 0,
  }));

  const locationFields =
    orderPayload.location?.lat != null && orderPayload.location?.lng != null
      ? {
          location_lat: orderPayload.location.lat,
          location_lng: orderPayload.location.lng,
        }
      : {};

  const ref = await addDoc(collection(db, 'orders'), {
    customer_name: orderPayload.name,
    customer_phone: orderPayload.phone,
    shipping_address: orderPayload.address,
    notes: orderPayload.notes || '',
    payment_method: orderPayload.paymentMethod || 'cod',
    total: orderPayload.total ?? 0,
    status: 'pending',
    created_at: serverTimestamp(),
    items,
    ...locationFields,
  });

  return {
    ok: true,
    orderId: ref.id,
    message: 'Order saved.',
  };
}

/** Synchronous demo catalog — instant storefront paint before remote fetch. */
export function getMockProducts() {
  return MOCK_PRODUCTS.map(normalizeProduct);
}

function mockProductsList() {
  return getMockProducts();
}

/**
 * Fetch all products.
 */
export async function fetchProducts() {
  if (isFirebaseConfigured()) {
    try {
      const list = await withTimeout(
        fetchProductsFromFirebase(),
        REMOTE_TIMEOUT_MS,
        'Firebase products'
      );
      if (Array.isArray(list) && list.length > 0) return list;
    } catch (err) {
      console.warn('[fetchProducts] Firebase:', err);
    }
  }

  if (apiBase()) {
    try {
      const data = await withTimeout(request('/products/'), REMOTE_TIMEOUT_MS, 'REST products');
      const raw = Array.isArray(data) ? data : (data?.results ?? data?.products ?? []);
      const list = Array.isArray(raw) ? raw : [];
      return list.map(normalizeProduct);
    } catch (_) {
      return mockProductsList();
    }
  }

  return mockProductsList();
}

/** Synchronous lookup — instant product detail paint (no network wait). */
export function getProductBySlug(slug) {
  if (!slug) return null;
  const hit = MOCK_PRODUCTS.find((p) => p.slug === slug);
  return hit ? normalizeProduct({ ...hit }) : null;
}

/**
 * Fetch single product by slug.
 * Returns local catalog immediately when remote is unavailable; merges remote when ready.
 */
export async function fetchProductBySlug(slug) {
  const local = getProductBySlug(slug);

  if (!isFirebaseConfigured() && !apiBase()) {
    return local;
  }

  if (isFirebaseConfigured()) {
    try {
      const list = await withTimeout(
        fetchProductsFromFirebase(),
        REMOTE_TIMEOUT_MS,
        'Firebase products'
      );
      const remote = Array.isArray(list) ? list.find((p) => p.slug === slug) : null;
      if (remote) return remote;
    } catch (err) {
      console.warn('[fetchProductBySlug] Firebase:', err);
    }
  }

  if (apiBase()) {
    try {
      const data = await withTimeout(request('/products/'), REMOTE_TIMEOUT_MS, 'REST products');
      const raw = Array.isArray(data) ? data : (data?.results ?? data?.products ?? []);
      const list = Array.isArray(raw) ? raw.map(normalizeProduct) : [];
      const remote = list.find((p) => p.slug === slug);
      if (remote) return remote;
    } catch (_) {
      /* fall through to local */
    }
  }

  return local;
}

/**
 * Submit checkout order.
 */
export function isOrderBackendConfigured() {
  return isFirebaseConfigured() || !!apiBase();
}

export async function submitOrder(orderPayload) {
  if (isFirebaseConfigured()) {
    return submitOrderFirebase(orderPayload);
  }

  if (apiBase()) {
    const backendPayload = {
      customer_name: orderPayload.name,
      customer_phone: orderPayload.phone,
      shipping_address: orderPayload.address,
      notes: orderPayload.notes || '',
      payment_method: orderPayload.paymentMethod || 'cod',
      items: (orderPayload.items || []).map((item) => ({
        product: Number(item.productId ?? item.product),
        quantity: item.quantity || 1,
      })),
      ...(orderPayload.location?.lat != null && orderPayload.location?.lng != null
        ? {
            location_lat: orderPayload.location.lat,
            location_lng: orderPayload.location.lng,
          }
        : {}),
    };
    return request('/orders/', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    });
  }

  if (import.meta.env.DEV) {
    return {
      ok: true,
      orderId: `local-${Date.now()}`,
      message: 'Order recorded locally (no API configured).',
    };
  }

  throw new Error('Order backend is not configured.');
}

