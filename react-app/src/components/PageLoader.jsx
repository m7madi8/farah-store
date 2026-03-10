/**
 * PageLoader — full-screen loading overlay with logo and subtle dumpling orbit animation.
 */

export function PageLoader({ visible }) {
  if (!visible) return null;
  return (
    <div className="page-loader" id="pageLoader">
      <div className="loader-inner">
        <div className="loader-orbit">
          <span className="loader-orbit-ring" />
          <span className="loader-orbit-dot loader-orbit-dot-1" />
          <span className="loader-orbit-dot loader-orbit-dot-2" />
          <span className="loader-orbit-dot loader-orbit-dot-3" />
          <img
            src="/img/logo.webp"
            alt="Chef Farah Ammar"
            className="loader-logo"
            width="220"
            height="110"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}
