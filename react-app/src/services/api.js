/**
 * API service for Chef Farah Ammar store.
 *
 * Data source priority:
 * 1. Supabase — when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set (see supabase/schema.sql).
 * 2. REST — when VITE_API_BASE is set (legacy Django-style API).
 * 3. Mock — built-in demo catalog + local checkout success.
 */

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return value != null && UUID_RE.test(String(value));
}

function apiBase() {
  const raw = import.meta.env.VITE_API_BASE;
  return raw != null && String(raw).trim() !== ''
    ? String(raw).replace(/\/$/, '')
    : '';
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

/**
 * Fallback product list when no remote source is available.
 */
const MOCK_PRODUCTS = [
  { id: '1', slug: 'dumplings-chicken', name: 'Dumplings – Chicken', nameAr: 'دامبلنغ – دجاج', description: 'Handcrafted chicken dumplings with rich flavors. Created by Chef Farah.', descriptionAr: 'دامبلنغ دجاج مصنوع يدوياً بنكهات غنية. من إبداع الشيف فرح.', price: 25, category: 'boxes', imageUrl: '/img/1.webp', heroImage: '/img/2.webp', order: 1, badge: 'Signature', details: ['detail1', 'detail2', 'detail3', 'detail4', 'detail5', 'detailTeriyaki', 'detailSweetChili', 'detail6'] },
  { id: '2', slug: 'dumplings-meat', name: 'Dumplings – Meat', nameAr: 'دامبلنغ – لحم', description: 'Handcrafted meat dumplings with rich flavors. Created by Chef Farah.', descriptionAr: 'دامبلنغ لحم مصنوع يدوياً بنكهات غنية. من إبداع الشيف فرح.', price: 27, category: 'boxes', imageUrl: '/img/1.webp', heroImage: '/img/2.webp', order: 2, badge: 'Signature', details: ['detail1', 'detail2Meat', 'detail3', 'detail4', 'detail5', 'detailTeriyaki', 'detailSweetChili', 'detail6'] },
  { id: '3', slug: 'teriyaki-sauce', name: 'Teriyaki sauce', nameAr: 'صلصة ترياكي', description: 'Rich teriyaki glaze, perfect for dumplings and stir-fry.', descriptionAr: 'صلصة ترياكي غنية، مثالية للدامبلنغ والقلي السريع.', price: 2, category: 'sauces', imageUrl: '/img/teriyaki.webp', heroImage: '/img/teriyaki.webp', order: 3, badge: 'Sauce', details: [] },
  { id: '4', slug: 'soya-sauce', name: 'Soya sauce', nameAr: 'صلصة صويا', description: 'Classic soy sauce for dipping and cooking.', descriptionAr: 'صلصة صويا كلاسيكية للغمس والطبخ.', price: 2, category: 'sauces', imageUrl: '/img/soya.webp', heroImage: '/img/soya.webp', order: 4, badge: 'Sauce', details: [] },
  { id: '5', slug: 'buffalo-sauce', name: 'Buffalo sauce', nameAr: 'صلصة بافلو', description: 'Spicy buffalo sauce for a bold kick.', descriptionAr: 'صلصة بافلو حارة لمذاق قوي.', price: 2, category: 'sauces', imageUrl: '/img/buffalo.webp', heroImage: '/img/buffalo.webp', order: 5, badge: 'Sauce', details: [] },
  { id: '6', slug: 'sweet-chili-sauce', name: 'Sweet chili sauce', nameAr: 'صلصة الفلفل الحلو', description: 'Sweet and tangy chili sauce for dipping.', descriptionAr: 'صلصة فلفل حلوة وحامضة للغمس.', price: 2, category: 'sauces', imageUrl: '/img/sweet-chili.webp', heroImage: '/img/sweet-chili.webp', order: 6, badge: 'Sauce', details: [] },
  { id: '7', slug: 'chop-sticks', name: 'Chop sticks', nameAr: 'عيدان الطعام', description: '1 ₪ per stick (not per pack).', descriptionAr: '1 ₪ للعود الواحد (وليس للمجموعة).', price: 1, category: 'chopsticks', imageUrl: '/img/chop-sticks.webp', heroImage: '/img/chop-sticks.webp', order: 7, badge: 'Accessory', details: [] },
  {
    id: '8',
    slug: 'date-balls-chocolate',
    name: 'Date balls with chocolate',
    nameAr: 'كرات التمر بالشوكولاته',
    description: 'Delicious date balls coated in chocolate. Two sizes available.',
    descriptionAr: 'كرات تمر لذيذة مغطاة بالشوكولاته. حجمين متوفرين.',
    price: 25,
    category: 'boxes',
    imageUrl: '/img/pro2.png',
    heroImage: '/img/pro2.png',
    order: 8,
    badge: 'Signature',
    details: [],
    variants: [
      { key: '7', labelEn: '7 pieces', labelAr: '٧ حبات', price: 25 },
      { key: '16', labelEn: '16 pieces', labelAr: '١٦ حبة', price: 45 },
    ],
    images: ['/img/pro2.png'],
  },
];

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

function normalizeProduct(p) {
  const category = inferCategoryFromProduct(p);
  const heroImg = p.hero_image ?? p.images?.find((i) => i.is_hero) ?? p.images?.[0];
  const imageUrlRaw = typeof heroImg === 'string' ? heroImg : (heroImg?.url ?? p.imageUrl);
  const backendImageUrl = normalizeImageUrl(imageUrlRaw);
  const slugImageUrl = localImageBySlug(p.slug);
  const finalImageUrl = slugImageUrl || backendImageUrl || DEFAULT_PRODUCT_IMAGE;
  const slugNorm = String(p.slug || '').trim();
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
  };
  if (slugNorm === 'date-balls-chocolate') {
    merged.images = [finalImageUrl];
  }
  return merged;
}

function mapSupabaseProductRow(row) {
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

async function fetchProductsFromSupabase() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapSupabaseProductRow);
}

async function submitOrderSupabase(orderPayload) {
  const supabase = getSupabase();
  const orderId = crypto.randomUUID();
  const { error: orderErr } = await supabase.from('orders').insert({
    id: orderId,
    customer_name: orderPayload.name,
    customer_phone: orderPayload.phone,
    shipping_address: orderPayload.address,
    notes: orderPayload.notes || '',
    payment_method: orderPayload.paymentMethod || 'cod',
    total: orderPayload.total ?? 0,
    status: 'new',
  });

  if (orderErr) throw orderErr;

  const lines = (orderPayload.items || []).map((item) => ({
    order_id: orderId,
    product_id: isValidUuid(item.productId) ? item.productId : null,
    product_slug: item.productSlug || null,
    quantity: item.quantity || 1,
    unit_price: item.price ?? 0,
    product_name: item.name ?? '',
  }));

  if (lines.length > 0) {
    const { error: itemsErr } = await supabase.from('order_items').insert(lines);
    if (itemsErr) throw itemsErr;
  }

  return {
    ok: true,
    orderId,
    message: 'Order saved.',
  };
}

function mockProductsList() {
  return MOCK_PRODUCTS.map(normalizeProduct);
}

/**
 * Fetch all products.
 */
export async function fetchProducts() {
  if (isSupabaseConfigured()) {
    try {
      const list = await fetchProductsFromSupabase();
      if (Array.isArray(list) && list.length > 0) return list;
    } catch (err) {
      console.warn('[fetchProducts] Supabase:', err);
    }
  }

  if (apiBase()) {
    try {
      const data = await request('/products/');
      const raw = Array.isArray(data) ? data : (data?.results ?? data?.products ?? []);
      const list = Array.isArray(raw) ? raw : [];
      return list.map(normalizeProduct);
    } catch (_) {
      return mockProductsList();
    }
  }

  return mockProductsList();
}

/**
 * Fetch single product by slug.
 */
export async function fetchProductBySlug(slug) {
  const products = await fetchProducts();
  return products.find((p) => p.slug === slug) || null;
}

/**
 * Submit checkout order.
 */
export async function submitOrder(orderPayload) {
  if (isSupabaseConfigured()) {
    return submitOrderSupabase(orderPayload);
  }

  if (!apiBase()) {
    return {
      ok: true,
      orderId: `local-${Date.now()}`,
      message: 'Order recorded locally (no API configured).',
    };
  }

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
  };
  return request('/orders/', {
    method: 'POST',
    body: JSON.stringify(backendPayload),
  });
}

/** Re-export Supabase flag for admin UI (avoid importing lib/supabase everywhere). */
export { isSupabaseConfigured };
