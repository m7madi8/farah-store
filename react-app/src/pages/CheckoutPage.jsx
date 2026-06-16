/**
 * CheckoutPage — form for name, phone, address, notes; order summary; client-side validation.
 * Submits order via API and clears cart on success; shows success toast and redirects.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { OrderSummary } from '../components/OrderSummary';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { submitOrder, isOrderBackendConfigured } from '../services/api';
import { BiIcon } from '../components/BiIcon';

const placeholders = {
  en: { phone: '05xxxxxxxx', address: 'Street, city, floor/apartment' },
  ar: { phone: '05xxxxxxxx', address: 'الشارع، المدينة، الطابق/الشقة' },
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { items, total, clearCart } = useCart();
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationError, setLocationError] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const place = placeholders[lang] || placeholders.en;
  const ordersEnabled = isOrderBackendConfigured();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('checkout.name');
    if (!form.phone.trim()) e.phone = t('checkout.phone');
    if (!form.address.trim()) e.address = t('checkout.address');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(t('checkout.locationUnsupported'));
      setLocationStatus('error');
      return;
    }

    setLocationStatus('loading');
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationStatus('success');
      },
      (err) => {
        setLocationStatus('error');
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(t('checkout.locationDenied'));
        } else if (err.code === err.TIMEOUT) {
          setLocationError(t('checkout.locationTimeout'));
        } else {
          setLocationError(t('checkout.locationUnavailable'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!validate()) return;
    if (!ordersEnabled) {
      setErrors({ submit: t('checkout.unavailable') });
      return;
    }
    setSubmitting(true);
    try {
      await submitOrder({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        paymentMethod: 'cod',
        ...(location ? { location } : {}),
        items: items.map((i) => ({
          productId: i.productId,
          productSlug: i.productSlug,
          name: i.name,
          price: i.price,
          quantity: i.quantity || 1,
        })),
        total,
      });
      clearCart();
      setSuccess(true);
      setTimeout(() => navigate('/?ordered=1'), 2000);
    } catch (err) {
      setErrors({ submit: err.message || 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && !success) {
    return (
      <>
        <Navbar backToShop alwaysShowBackground />
        <main className="checkout-page">
          <div className="checkout-wrap">
            <div className="checkout-empty">
              <BiIcon name="cart-x" />
              <p className="checkout-empty-title">{t('checkout.emptyCart')}</p>
              <p className="checkout-empty-desc">{t('checkout.emptyDesc')}</p>
              <Link to="/#product" className="btn-checkout-primary">
                {t('checkout.goToShop')}
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar backToShop alwaysShowBackground />
      <main className="checkout-main">
        <div className="checkout-wrap">
          <header className="checkout-header">
            <h1 className="checkout-title">{t('checkout.title')}</h1>
            <p className="checkout-sub">{t('checkout.sub')}</p>
          </header>
          <div className="checkout-content">
            <OrderSummary items={items} total={total} />
            <form className="checkout-form ui-card" onSubmit={handleSubmit} noValidate>
              <h2 className="checkout-form-title">{t('checkout.yourDetails')}</h2>
              <div className="checkout-field">
                <label htmlFor="checkoutName" className="checkout-label">{t('checkout.name')}</label>
                <input
                  type="text"
                  id="checkoutName"
                  className="checkout-input ui-input"
                  name="name"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  autoComplete="name"
                  placeholder=""
                />
                {errors.name && <span className="checkout-error" role="alert">{errors.name}</span>}
              </div>
              <div className="checkout-field">
                <label htmlFor="checkoutPhone" className="checkout-label">{t('checkout.phone')}</label>
                <input
                  type="tel"
                  id="checkoutPhone"
                  className="checkout-input ui-input"
                  name="phone"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  required
                  autoComplete="tel"
                  placeholder={place.phone}
                />
                {errors.phone && <span className="checkout-error" role="alert">{errors.phone}</span>}
              </div>
              <div className="checkout-field">
                <label htmlFor="checkoutAddress" className="checkout-label">{t('checkout.address')}</label>
                <textarea
                  id="checkoutAddress"
                  className="checkout-input checkout-textarea ui-input"
                  name="address"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  required
                  rows={3}
                  placeholder={place.address}
                />
                {errors.address && <span className="checkout-error" role="alert">{errors.address}</span>}
              </div>
              <div className="checkout-field checkout-location-field">
                <span className="checkout-label checkout-label-optional">{t('checkout.shareLocation')}</span>
                <p className="checkout-location-hint">{t('checkout.shareLocationHint')}</p>
                <button
                  type="button"
                  className={`btn-checkout-location${locationStatus === 'success' ? ' btn-checkout-location--shared' : ''}`}
                  onClick={handleShareLocation}
                  disabled={locationStatus === 'loading'}
                >
                  <BiIcon name="geo-alt" />
                  <span>
                    {locationStatus === 'loading'
                      ? t('checkout.shareLocationLoading')
                      : locationStatus === 'success'
                        ? t('checkout.shareLocationAgain')
                        : t('checkout.shareLocation')}
                  </span>
                </button>
                {locationStatus === 'success' ? (
                  <p className="checkout-location-success" role="status">
                    <BiIcon name="check-circle-fill" />
                    <span>{t('checkout.shareLocationSuccess')}</span>
                  </p>
                ) : null}
                {locationError ? (
                  <span className="checkout-error" role="alert">{locationError}</span>
                ) : null}
              </div>
              <div className="checkout-field checkout-payment-notice" role="status">
                <span className="checkout-label">{t('checkout.paymentMethod')}</span>
                <p className="checkout-payment-cod">{t('checkout.paymentCodOnly')}</p>
              </div>
              <div className="checkout-field">
                <label htmlFor="checkoutNotes" className="checkout-label checkout-label-optional">{t('checkout.notes')}</label>
                <textarea
                  id="checkoutNotes"
                  className="checkout-input checkout-textarea ui-input"
                  name="notes"
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={2}
                  placeholder=""
                />
              </div>
              {errors.submit && <p className="checkout-error" role="alert">{errors.submit}</p>}
              {!ordersEnabled && !errors.submit ? (
                <p className="checkout-error" role="alert">{t('checkout.unavailable')}</p>
              ) : null}
              <button
                type="submit"
                className="btn-checkout-submit ui-btn-primary"
                disabled={submitting || !ordersEnabled}
              >
                {submitting ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : t('checkout.confirm')}
              </button>
            </form>
          </div>
        </div>
        <div
          className={`checkout-toast checkout-toast-success ${success ? 'checkout-toast-show' : ''}`}
          role="alert"
          aria-live="polite"
          aria-hidden={!success}
          hidden={!success}
        >
          <BiIcon name="check-circle-fill" />
          <span className="checkout-toast-text">{t('checkout.successMessage')}</span>
        </div>
      </main>
    </>
  );
}
