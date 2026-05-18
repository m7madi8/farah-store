import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';

function deleteErrorMessage(err, fallback) {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  const parts = [err.message, err.details, err.hint].filter(Boolean);
  return parts.length ? parts.join(' — ') : fallback;
}

function isMissingRpcError(error) {
  if (!error) return false;
  const msg = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  return (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    msg.includes('staff_delete_order') ||
    msg.includes('could not find the function')
  );
}

async function ensureStaffSession(sb, t) {
  const { data: refreshData, error: refreshErr } = await sb.auth.refreshSession();
  if (refreshErr) {
    throw new Error(deleteErrorMessage(refreshErr, t('admin.deleteNotSignedIn')));
  }
  const session = refreshData.session ?? (await sb.auth.getSession()).data.session;
  if (!session?.access_token) {
    throw new Error(t('admin.deleteNotSignedIn'));
  }
  return session;
}

async function deleteOrderViaRpc(sb, orderId) {
  const { data, error } = await sb.rpc('staff_delete_order', { p_order_id: orderId });
  if (error) {
    if (isMissingRpcError(error)) {
      return { status: 'missing_rpc', error };
    }
    throw error;
  }
  if (data === true) return { status: 'ok' };
  if (data === false) return { status: 'not_found' };
  return { status: 'unknown', data };
}

async function deleteOrderViaTable(sb, orderId) {
  const { error: itemsErr } = await sb.from('order_items').delete({ count: 'exact' }).eq('order_id', orderId);
  if (itemsErr) throw itemsErr;

  const { error: delErr, count } = await sb.from('orders').delete({ count: 'exact' }).eq('id', orderId);
  if (delErr) throw delErr;
  return (count ?? 0) > 0;
}

export function useAdminOrderActions({ setData, setError, t }) {
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);

  async function confirmDelete() {
    if (!orderToDelete) return;
    const orderId = orderToDelete.id;
    setDeletingId(orderId);
    setError(null);
    try {
      const sb = getSupabase();
      await ensureStaffSession(sb, t);

      const rpc = await deleteOrderViaRpc(sb, orderId);

      if (rpc.status === 'ok') {
        setData((prev) => prev.filter((o) => o.id !== orderId));
        if (expandedId === orderId) setExpandedId(null);
        setOrderToDelete(null);
        return;
      }

      if (rpc.status === 'missing_rpc') {
        const tableOk = await deleteOrderViaTable(sb, orderId);
        if (tableOk) {
          setData((prev) => prev.filter((o) => o.id !== orderId));
          if (expandedId === orderId) setExpandedId(null);
          setOrderToDelete(null);
          return;
        }
        throw new Error(t('admin.deleteRpcMissing'));
      }

      if (rpc.status === 'not_found') {
        throw new Error(t('admin.deleteNotFound'));
      }

      const tableOk = await deleteOrderViaTable(sb, orderId);
      if (!tableOk) {
        throw new Error(t('admin.deleteFailed'));
      }

      setData((prev) => prev.filter((o) => o.id !== orderId));
      if (expandedId === orderId) setExpandedId(null);
      setOrderToDelete(null);
    } catch (e) {
      setError(new Error(deleteErrorMessage(e, t('admin.deleteFailed'))));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleApprove(order) {
    setApprovingId(order.id);
    setError(null);
    try {
      const { data: updated, error: upErr } = await getSupabase()
        .from('orders')
        .update({ status: 'approved' })
        .eq('id', order.id)
        .select('*, order_items(*)')
        .single();
      if (upErr) throw upErr;
      if (!updated) throw new Error(t('admin.approveFailed'));
      setData((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      setExpandedId(null);
    } catch (e) {
      setError(e);
    } finally {
      setApprovingId(null);
    }
  }

  return {
    expandedId,
    setExpandedId,
    deletingId,
    approvingId,
    orderToDelete,
    setOrderToDelete,
    confirmDelete,
    handleApprove,
  };
}
