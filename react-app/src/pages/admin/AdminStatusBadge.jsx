import { cn } from '@/lib/cn';
import { normalizeOrderStatus } from './orderUtils';

const VARIANT_BY_STATUS = {
  pending: 'admin-status--pending',
  approved: 'admin-status--approved',
};

/** @param {{ status?: string, label: string }} props */
export function AdminStatusBadge({ status, label }) {
  const key = normalizeOrderStatus(status);
  const variant = VARIANT_BY_STATUS[key] || 'admin-status--default';
  return <span className={cn('admin-status', variant)}>{label}</span>;
}
