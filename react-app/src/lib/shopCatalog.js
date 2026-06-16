/** Shared storefront catalog grouping — matches HomePage shop sections. */

export function sortShopProducts(products) {
  return [...products].sort(
    (a, b) =>
      (Number(a.order ?? a.sort_order) || 0) - (Number(b.order ?? b.sort_order) || 0)
  );
}

export function groupShopProducts(products) {
  const list = sortShopProducts(products);
  const dateBalls = list.find((p) => p.slug === 'date-balls-chocolate') || null;
  const groups = { boxes: [], sauces: [], chopsticks: [] };

  list.forEach((product) => {
    if (product.slug === 'date-balls-chocolate') return;
    const key = product.category || 'boxes';
    if (groups[key]) groups[key].push(product);
  });

  return { groups, dateBalls, list };
}

export const SHOP_CATALOG_SECTIONS = [
  { id: 'boxes', getProducts: ({ groups }) => groups.boxes },
  { id: 'dateBalls', getProducts: ({ dateBalls }) => (dateBalls ? [dateBalls] : []) },
  { id: 'sauces', getProducts: ({ groups }) => groups.sauces },
  { id: 'chopsticks', getProducts: ({ groups }) => groups.chopsticks },
];
