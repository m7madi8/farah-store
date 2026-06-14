import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { getAdminFirestore } from '@/lib/firebase';
import { mapFirestoreOrder } from '@/lib/firestoreMappers';
import { formatAdminFirestoreError } from './adminFirestoreError';

const POLL_MS = 30_000;

export function useAdminOrders() {
  const { t } = useLanguage();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const [{ collection, getDocs, orderBy, query }, db] = await Promise.all([
        import('firebase/firestore'),
        getAdminFirestore(),
      ]);
      const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      const rows = snap.docs.map((docSnap) => mapFirestoreOrder(docSnap.id, docSnap.data()));
      if (mountedRef.current) setData(rows);
    } catch (e) {
      if (mountedRef.current) setError(new Error(formatAdminFirestoreError(e, t)));
    } finally {
      if (mountedRef.current && !silent) setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    mountedRef.current = true;
    let unsubscribe = () => {};

    async function subscribe() {
      setIsLoading(true);
      setError(null);
      try {
        const [{ collection, onSnapshot, orderBy, query }, db] = await Promise.all([
          import('firebase/firestore'),
          getAdminFirestore(),
        ]);
        const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
        unsubscribe = onSnapshot(
          q,
          (snap) => {
            if (!mountedRef.current) return;
            const rows = snap.docs.map((docSnap) => mapFirestoreOrder(docSnap.id, docSnap.data()));
            setData(rows);
            setIsLoading(false);
          },
          (err) => {
            if (mountedRef.current) {
              setError(new Error(formatAdminFirestoreError(err, t)));
              setIsLoading(false);
            }
          }
        );
      } catch (e) {
        if (mountedRef.current) {
          setError(new Error(formatAdminFirestoreError(e, t)));
          setIsLoading(false);
        }
      }
    }

    subscribe();

    const pollId = window.setInterval(() => loadOrders({ silent: true }), POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') loadOrders({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      mountedRef.current = false;
      window.clearInterval(pollId);
      document.removeEventListener('visibilitychange', onVisible);
      unsubscribe();
    };
  }, [loadOrders, t]);

  return { data, setData, isLoading, error, setError, loadOrders };
}
