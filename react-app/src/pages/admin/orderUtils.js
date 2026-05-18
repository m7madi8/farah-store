/** @typedef {'pending' | 'approved'} OrderWorkflowStatus */

/** @param {string | null | undefined} status */
export function normalizeOrderStatus(status) {
  const s = String(status || 'pending').toLowerCase();
  if (s === 'new') return 'pending';
  if (s === 'approved' || s === 'done' || s === 'completed' || s === 'delivered') return 'approved';
  if (s === 'pending') return 'pending';
  return 'pending';
}

/** @param {{ status?: string }} order */
export function isPendingOrder(order) {
  return normalizeOrderStatus(order?.status) === 'pending';
}

/** @param {{ status?: string }} order */
export function isApprovedOrder(order) {
  return normalizeOrderStatus(order?.status) === 'approved';
}
