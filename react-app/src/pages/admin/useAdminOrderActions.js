import { useState } from 'react';
import { getAdminFirestore, getFirebaseAuth } from '@/lib/firebase';
import { mapFirestoreOrder } from '@/lib/firestoreMappers';
import { formatAdminFirestoreError } from './adminFirestoreError';

function deleteErrorMessage(err, fallback) {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  const parts = [err.message, err.code].filter(Boolean);
  return parts.length ? parts.join(' — ') : fallback;
}

async function ensureStaffSession(t) {
  const auth = await getFirebaseAuth();
  if (!auth.currentUser) {
    throw new Error(t('admin.deleteNotSignedIn'));
  }
  return auth;
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
      await ensureStaffSession(t);
      const [{ deleteDoc, doc }, db] = await Promise.all([
        import('firebase/firestore'),
        getAdminFirestore(),
      ]);
      await deleteDoc(doc(db, 'orders', orderId));
      setData((prev) => prev.filter((o) => o.id !== orderId));
      if (expandedId === orderId) setExpandedId(null);
      setOrderToDelete(null);
    } catch (e) {
      setError(new Error(formatAdminFirestoreError(e, t)));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleApprove(order) {
    setApprovingId(order.id);
    setError(null);
    try {
      await ensureStaffSession(t);
      const [{ doc, getDoc, updateDoc }, db] = await Promise.all([
        import('firebase/firestore'),
        getAdminFirestore(),
      ]);
      const ref = doc(db, 'orders', order.id);
      await updateDoc(ref, { status: 'approved' });
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error(t('admin.approveFailed'));
      const updated = mapFirestoreOrder(snap.id, snap.data());
      setData((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      setExpandedId(null);
    } catch (e) {
      setError(new Error(formatAdminFirestoreError(e, t)));
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
