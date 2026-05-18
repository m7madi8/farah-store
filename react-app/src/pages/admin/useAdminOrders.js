import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

const POLL_MS = 30_000;

export function useAdminOrders() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const sb = getSupabase();
      const { data: rows, error: qErr } = await sb
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      if (mountedRef.current) setData(rows ?? []);
    } catch (e) {
      if (mountedRef.current) setError(e);
    } finally {
      if (mountedRef.current && !silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadOrders();

    const sb = getSupabase();
    const channel = sb
      .channel('admin-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders({ silent: true });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        loadOrders({ silent: true });
      })
      .subscribe();

    const pollId = window.setInterval(() => loadOrders({ silent: true }), POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') loadOrders({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      mountedRef.current = false;
      window.clearInterval(pollId);
      document.removeEventListener('visibilitychange', onVisible);
      sb.removeChannel(channel);
    };
  }, [loadOrders]);

  return { data, setData, isLoading, error, setError, loadOrders };
}
