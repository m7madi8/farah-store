/** Unique cart line: same product + different variant = separate rows */
export function getCartLineKey(productId, variantKey) {
  const id = String(productId ?? '');
  if (variantKey != null && variantKey !== '') {
    return `${id}::${variantKey}`;
  }
  return id;
}

export function resolveCartLineKey(item) {
  if (item?.lineKey) return item.lineKey;
  return getCartLineKey(item?.productId, item?.variantKey);
}
