/**
 * Footer & product-page icons — rounded stroke style (24×24).
 */

const STROKE = {
  w: 1.75,
  cap: 'round',
  join: 'round',
};

const ICONS = {
  back: [
    'M14.5 8.25 10 12.75 14.5 17.25',
    'M10.25 12.75H18.75',
  ],

  'arrow-forward': [
    'M9.5 8.25 14 12.75 9.5 17.25',
    'M14 12.75H5.25',
  ],

  'cart-add': [
    'M6 6V5.25a3.75 3.75 0 0 1 7.5 0V6',
    'M4.25 6h15.5l-1.4 7.35a1 1 0 0 1-.99.8H6.69a1 1 0 0 1-.99-.8L4.25 6z',
    'M9.25 19.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5z',
    'M16.75 19.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5z',
    'M12 10.75v3.25',
    'M10.375 12.375h3.25',
  ],

  cod: [
    'M4 6.75h16c.55 0 1 .45 1 1v10.25c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V7.75c0-.55.45-1 1-1z',
    'M12 16.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5z',
    'M6.25 9.75h2.25',
    'M6.25 13h2.25',
    'M17.75 9.75H16.5',
    'M17.75 13H16.5',
  ],

  instagram: [
    'M8 5.75h8A2.25 2.25 0 0 1 18.25 8v8A2.25 2.25 0 0 1 16 18.25H8A2.25 2.25 0 0 1 5.75 16V8A2.25 2.25 0 0 1 8 5.75',
    'M12 15.1a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2',
    'M16.65 7.65h.01',
  ],
};

export function SiteIcon({ name, className = '', ...props }) {
  const paths = ICONS[name];
  if (!paths) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={`site-icon site-icon--${name}${className ? ` ${className}` : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE.w}
      strokeLinecap={STROKE.cap}
      strokeLinejoin={STROKE.join}
      aria-hidden={props['aria-hidden'] ?? true}
      {...props}
    >
      {paths.map((d) => (
        <path key={d.slice(0, 28)} d={d} />
      ))}
    </svg>
  );
}
