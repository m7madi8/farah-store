/** Nutrition facts for products (keyed by slug). Values per serving + per piece. */
export const PRODUCT_NUTRITION = {
  'dumplings-meat': {
    servingPieces: 8,
    serving: {
      calories: 390,
      protein: 18,
      carbs: 48,
      sugars: 7,
      totalFat: 14,
      saturatedFat: 4,
      fiber: 3,
      sodium: 950,
    },
    piece: {
      calories: 49,
      protein: 2.3,
      carbs: 6,
      fat: 1.8,
    },
  },
  'dumplings-chicken': {
    servingPieces: 8,
    serving: {
      calories: 340,
      protein: 22,
      carbs: 47,
      sugars: 7,
      totalFat: 8,
      saturatedFat: 2,
      fiber: 3,
      sodium: 950,
    },
    piece: {
      calories: 43,
      protein: 2.8,
      carbs: 5.9,
      fat: 1,
    },
  },
};

export function getProductNutrition(slug) {
  return PRODUCT_NUTRITION[slug] ?? null;
}
