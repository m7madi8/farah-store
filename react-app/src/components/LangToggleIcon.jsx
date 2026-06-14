/**
 * Language toggle — shows target language label (EN / ع).
 */

export function LangToggleIcon({ lang }) {
  const label = lang === 'ar' ? 'EN' : 'ع';

  return (
    <span className="nav-lang-label" aria-hidden="true">
      {label}
    </span>
  );
}
