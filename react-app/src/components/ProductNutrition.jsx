/**
 * Collapsible nutrition facts — shown on product pages when data exists for the slug.
 */

import { useLanguage } from '../context/LanguageContext';
import { getProductNutrition } from '../lib/productNutrition';

const LABEL_KEYS = {
  calories: 'nutritionCalories',
  protein: 'nutritionProtein',
  carbs: 'nutritionCarbs',
  sugars: 'nutritionSugars',
  totalFat: 'nutritionTotalFat',
  saturatedFat: 'nutritionSaturatedFat',
  fiber: 'nutritionFiber',
  sodium: 'nutritionSodium',
  fat: 'nutritionFat',
};

const SERVING_ROWS = [
  { key: 'calories', unit: 'kcal' },
  { key: 'protein', unit: 'g' },
  { key: 'carbs', unit: 'g' },
  { key: 'sugars', unit: 'g' },
  { key: 'totalFat', unit: 'g' },
  { key: 'saturatedFat', unit: 'g' },
  { key: 'fiber', unit: 'g' },
  { key: 'sodium', unit: 'mg' },
];

const PIECE_ROWS = [
  { key: 'calories', unit: 'kcal' },
  { key: 'protein', unit: 'g' },
  { key: 'carbs', unit: 'g' },
  { key: 'fat', unit: 'g' },
];

function formatValue(value, unit, t) {
  const unitLabel =
    unit === 'kcal' ? t('product.nutritionUnitKcal')
    : unit === 'mg' ? t('product.nutritionUnitMg')
    : t('product.nutritionUnitG');
  return `${value} ${unitLabel}`;
}

function NutritionTable({ rows, data, subtitle, t }) {
  return (
    <div className="product-nutrition-block">
      <h3 className="product-nutrition-subtitle">{subtitle}</h3>
      <dl className="product-nutrition-table">
        {rows.map(({ key, unit }) => (
          <div key={key} className="product-nutrition-row">
            <dt>{t(`product.${LABEL_KEYS[key]}`)}</dt>
            <dd>{formatValue(data[key], unit, t)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ProductNutrition({ slug }) {
  const { t } = useLanguage();
  const nutrition = getProductNutrition(slug);
  if (!nutrition) return null;

  const servingSubtitle = t('product.nutritionPerPieces').replace('{n}', nutrition.servingPieces);

  return (
    <section className="product-nutrition anim-on-scroll" style={{ '--reveal-delay': '200ms' }}>
      <details className="product-nutrition-details">
        <summary className="product-nutrition-summary">
          <span className="product-nutrition-summary-text">{t('product.nutritionTitle')}</span>
        </summary>
        <div className="product-nutrition-body">
          <NutritionTable rows={SERVING_ROWS} data={nutrition.serving} subtitle={servingSubtitle} t={t} />
          <NutritionTable rows={PIECE_ROWS} data={nutrition.piece} subtitle={t('product.nutritionPerPiece')} t={t} />
        </div>
      </details>
    </section>
  );
}
