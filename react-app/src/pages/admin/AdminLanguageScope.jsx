import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

/** Forces English + LTR while admin UI is mounted; restores storefront locale on exit. */
export function AdminLanguageScope({ children }) {
  const { lang } = useLanguage();

  useEffect(() => {
    const root = document.getElementById('htmlRoot');
    if (!root) return undefined;
    root.lang = 'en';
    root.dir = 'ltr';
    return () => {
      root.lang = lang;
      root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    };
  }, [lang]);

  return children;
}
