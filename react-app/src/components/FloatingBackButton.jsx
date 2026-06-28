/**
 * Fixed back control for sub-pages — always visible bottom-right, no scroll to top required.
 */

import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { SiteIcon } from './SiteIcon';

export function FloatingBackButton({ label, scrollTargetId = 'product' }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const text = label ?? t('product.backHome');

  const handleClick = () => {
    navigate('/');
    if (!scrollTargetId) return;
    setTimeout(() => {
      const el = document.getElementById(scrollTargetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  return (
    <button
      type="button"
      className="floating-back-btn"
      onClick={handleClick}
      aria-label={text}
    >
      <SiteIcon name="back" />
      <span className="floating-back-btn__label">{text}</span>
    </button>
  );
}
