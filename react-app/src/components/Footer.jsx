/**
 * Footer — site footer with Instagram, payment note (cash on delivery), and copyright.
 */

import { useLanguage } from '../context/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-top">
        <div className="footer-col footer-col-brand">
          <span className="footer-brand">{t('nav.brand')}</span>
        </div>
        <div className="footer-col footer-col-connect">
          <span className="footer-label">{t('footer.followUs')}</span>
          <a
            href="https://instagram.com/cheffarahammar"
            className="footer-instagram"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <i className="bi bi-instagram" aria-hidden="true" />
            <span>{t('footer.instagram')}</span>
          </a>
        </div>
        <div className="footer-col footer-col-payment">
          <span className="footer-label">{t('footer.paymentMethods')}</span>
          <div className="footer-payment">
            <span className="footer-payment-item footer-payment-cod">
              <i className="bi bi-cash-coin" aria-hidden="true" />
              <span className="footer-payment-cod-text">{t('footer.payOnDelivery')}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-copy">
          © {year} {t('footer.copy')}
        </p>
      </div>
    </footer>
  );
}
