/** Map Firestore order docs to the shape admin UI expects (Supabase-compatible). */

function toIsoDate(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (value instanceof Date) return value.toISOString();
  return null;
}

export function mapFirestoreOrder(id, data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    id,
    customer_name: data.customer_name ?? '',
    customer_phone: data.customer_phone ?? '',
    shipping_address: data.shipping_address ?? '',
    notes: data.notes ?? '',
    payment_method: data.payment_method ?? 'cod',
    total: Number(data.total) || 0,
    status: data.status ?? 'pending',
    created_at: toIsoDate(data.created_at),
    location_lat: data.location_lat != null ? Number(data.location_lat) : null,
    location_lng: data.location_lng != null ? Number(data.location_lng) : null,
    order_items: items.map((item, index) => ({
      id: item.id ?? `${id}-item-${index}`,
      product_id: item.product_id ?? null,
      product_slug: item.product_slug ?? null,
      product_name: item.product_name ?? '',
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.unit_price) || 0,
    })),
  };
}

export function mapFirestoreProductRow(docId, row) {
  return {
    id: docId,
    slug: row.slug ?? docId,
    name: row.name,
    name_ar: row.name_ar,
    description: row.description,
    description_ar: row.description_ar,
    price: Number(row.price),
    category: row.category,
    image_url: row.image_url,
    hero_image: row.hero_image,
    sort_order: row.sort_order,
    badge: row.badge,
    details: row.details,
    variants: row.variants,
    images: row.images,
  };
}
