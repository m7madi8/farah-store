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
    'M8.75 10V9a3.25 3.25 0 0 1 6.5 0v1',
    'M7.25 10h9.5L15.25 20H8.75L7.25 10',
    'M12 13.25v3.5',
    'M10.25 15h3.5',
  ],

  cod: [
    'M3.75 14.25h9.75',
    'M13.5 12.25h2.75l1.75 2v2.25',
    'M5.75 16.75a1.35 1.35 0 1 0 0-2.7',
    'M14.75 16.75a1.35 1.35 0 1 0 0-2.7',
    'M3.75 14.25V10.5l1.85-3.35h6.4',
    'M18.75 10.25a2.15 2.15 0 1 0 0-4.3',
    'M17.35 10.25h2.8',
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
