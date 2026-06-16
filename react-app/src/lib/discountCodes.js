/** Valid promo codes → discount percent (e.g. sam15 → 15% off). */
export const VALID_DISCOUNT_CODES = {
  sam15: 15,
  sahar15: 15,
};

export function normalizeDiscountCode(raw) {
  return String(raw || '').trim().toLowerCase();
}

export function getDiscountPercent(raw) {
  return VALID_DISCOUNT_CODES[normalizeDiscountCode(raw)] ?? 0;
}

/**
 * @param {number} subtotal
 * @param {string} rawCode
 */
export function calculateOrderDiscount(subtotal, rawCode) {
  const sub = Number(subtotal) || 0;
  const code = normalizeDiscountCode(rawCode);
  const percent = VALID_DISCOUNT_CODES[code] ?? 0;

  if (!percent || sub <= 0) {
    return {
      code: '',
      percent: 0,
      amount: 0,
      subtotal: sub,
      total: sub,
      isValid: false,
    };
  }

  const amount = Math.round((sub * percent) / 100);
  const total = sub - amount;

  return {
    code,
    percent,
    amount,
    subtotal: sub,
    total,
    isValid: true,
  };
}
