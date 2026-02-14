/**
 * OrderSummary — displays list of cart items and total for checkout page.
 * Used inside CheckoutPage; receives items and total from CartContext.
 */

import { useLanguage } from '../context/LanguageContext';

export function OrderSummary({ items, total }) {
  const { t } = useLanguage();

  return (
    <section className="checkout-summary ui-card" aria-labelledby="summaryHeading">
      <h2 id="summaryHeading" className="checkout-summary-title">
        {t('checkout.orderSummary')}
      </h2>
      <ul className="checkout-summary-list">
        {items.map((item, i) => {
          const qty = item.quantity || 1;
          return (
          <li key={`${item.productId}-${i}`} className="checkout-summary-item">
            <span className="checkout-summary-name">{item.name}</span>
            <span className="checkout-summary-qty" aria-label={t('cart.qty')}>× {qty}</span>
            <span className="checkout-summary-price">
              {(item.price * qty)} ₪
            </span>
          </li>
          );
        })}
      </ul>
      <div className="checkout-summary-total">
        <span>{t('cart.total')}</span>
        <span>{total} ₪</span>
      </div>
    </section>
  );
}
