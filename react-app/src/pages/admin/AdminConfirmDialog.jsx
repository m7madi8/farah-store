import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

export function AdminConfirmDialog({
  open,
  title,
  description,
  detail,
  confirmLabel,
  cancelLabel,
  loading = false,
  loadingLabel = '…',
  onCancel,
  onConfirm,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(ev) {
      if (ev.key === 'Escape' && !loading) onCancel();
    }
    window.addEventListener('keydown', onKey);
    confirmRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="admin-dialog-root" role="presentation">
      <button
        type="button"
        className="admin-dialog-backdrop"
        aria-label={cancelLabel}
        disabled={loading}
        onClick={onCancel}
      />
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        aria-describedby="admin-dialog-desc"
      >
        <div className="admin-dialog-icon" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </div>
        <h2 id="admin-dialog-title" className="admin-dialog-title">
          {title}
        </h2>
        <p id="admin-dialog-desc" className="admin-dialog-desc">
          {description}
        </p>
        {detail ? <p className="admin-dialog-detail">{detail}</p> : null}
        <div className="admin-dialog-actions">
          <Button type="button" variant="outline" className="flex-1" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant="destructive"
            className="flex-1"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
