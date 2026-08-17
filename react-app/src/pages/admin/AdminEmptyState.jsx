import { cn } from '@/lib/cn';

export function AdminEmptyState({ icon, title, body, action }) {
  return (
    <div className="admin-empty admin-empty--rich">
      {icon ? (
        <div className="admin-empty-icon-wrap" aria-hidden>
          {icon}
        </div>
      ) : (
        <svg className="admin-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 9h10M7 13h6" />
        </svg>
      )}
      {title ? <h3 className="admin-empty-title">{title}</h3> : null}
      {body ? <p>{body}</p> : null}
      {action}
    </div>
  );
}

export function AdminErrorBanner({ message, onRetry, retryLabel }) {
  if (!message) return null;
  return (
    <div className="admin-error admin-error--banner" role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="admin-error-retry" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

export function AdminSkeleton({ className, lines = 1 }) {
  return (
    <div className={cn('admin-skeleton-stack', className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="admin-skeleton-line" />
      ))}
    </div>
  );
}
