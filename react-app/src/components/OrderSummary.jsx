/**
 * OrderSummary — displays list of cart items, discount code, and total for checkout page.
 * Used inside CheckoutPage; receives items and total from CartContext.
 */

import { useLanguage } from '../context/LanguageContext';
import { resolveCartLineKey } from '../lib/cartLineKey';
import { calculateOrderDiscount } from '../lib/discountCodes';
import { BiIcon } from './BiIcon';

export function OrderSummary({
  items,
  total,
  discountCode = '',
  onDiscountCodeChange,
  discountError = '',
}) {
  const { t } = useLanguage();
  const pricing = calculateOrderDiscount(total, discountCode);
  const hasDiscount = pricing.isValid;
  const discountInputTouched = discountCode.trim().length > 0;
  const discountInvalid = discountInputTouched && !pricing.isValid;
  const showDiscountError = discountError || discountInvalid;

  return (
    <section className="checkout-summary ui-card anim-on-scroll" aria-labelledby="summaryHeading">
      <h2 id="summaryHeading" className="checkout-summary-title">
        {t('checkout.orderSummary')}
      </h2>
      <ul className="checkout-summary-list">
        {items.map((item) => {
          const qty = item.quantity || 1;
          return (
            <li key={resolveCartLineKey(item)} className="checkout-summary-item">
              <span className="checkout-summary-name">{item.name}</span>
              <span className="checkout-summary-qty" aria-label={t('cart.qty')}>× {qty}</span>
              <span className="checkout-summary-price">
                {(item.price * qty)} ₪
              </span>
            </li>
          );
        })}
      </ul>

      <div className="checkout-summary-discount-block">
        <h3 id="checkoutDiscountTitle" className="checkout-discount-title">{t('checkout.discountTitle')}</h3>
        {hasDiscount ? (
          <div className="checkout-discount-applied-row">
            <p className="checkout-discount-applied" role="status">
              <BiIcon name="check-circle-fill" />
              <span>{t('checkout.discountApplied').replace('{percent}', pricing.percent)}</span>
            </p>
            <button
              type="button"
              className="checkout-discount-change"
              onClick={() => onDiscountCodeChange?.('')}
            >
              {t('checkout.discountChange')}
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              id="checkoutDiscount"
              className={`checkout-input checkout-summary-discount-input${showDiscountError ? ' checkout-input--error' : ''}`}
              name="discountCode"
              value={discountCode}
              onChange={(e) => onDiscountCodeChange?.(e.target.value)}
              autoComplete="off"
              aria-labelledby="checkoutDiscountTitle"
              aria-invalid={showDiscountError || undefined}
              aria-describedby={showDiscountError ? 'checkoutDiscountError' : undefined}
            />
            {showDiscountError ? (
              <span id="checkoutDiscountError" className="checkout-error" role="alert">
                {discountError || t('checkout.discountInvalid')}
              </span>
            ) : null}
          </>
        )}
      </div>

      {hasDiscount ? (
        <>
          <div className="checkout-summary-row checkout-summary-subtotal">
            <span>{t('checkout.subtotal')}</span>
            <span>{pricing.subtotal} ₪</span>
          </div>
          <div className="checkout-summary-row checkout-summary-discount">
            <span>
              {t('checkout.discount')}
              {' '}
              ({pricing.percent}%)
            </span>
            <span>−{pricing.amount} ₪</span>
          </div>
        </>
      ) : null}
      <div className="checkout-summary-total">
        <span>{t('cart.total')}</span>
        <span>{pricing.total} ₪</span>
      </div>
    </section>
  );
}
