import { cn } from '@/lib/cn';

export function AdminStatusBadge({ status }) {
  const s = String(status || 'new').toLowerCase();
  const variant =
    s === 'new' ? 'admin-status--new' : ['done', 'completed', 'delivered'].includes(s) ? 'admin-status--done' : 'admin-status--default';
  return <span className={cn('admin-status', variant)}>{status || 'new'}</span>;
}
