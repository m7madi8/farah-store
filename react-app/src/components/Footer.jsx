/**
 * Footer — site footer with Instagram, payment note (cash on delivery), and copyright.
 */

import { useLanguage } from '../context/LanguageContext';
import { siteConfig } from '../config/env';
import { SiteIcon } from './SiteIcon';

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
            href={siteConfig.instagramUrl || 'https://instagram.com'}
            className="footer-instagram"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <SiteIcon name="instagram" />
            <span>{t('footer.instagram')}</span>
          </a>
        </div>
        <div className="footer-col footer-col-payment">
          <span className="footer-label">{t('footer.paymentMethods')}</span>
          <div className="footer-payment">
            <span className="footer-payment-item footer-payment-cod">
              <SiteIcon name="cod" />
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
