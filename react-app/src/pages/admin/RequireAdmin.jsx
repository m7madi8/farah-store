import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Protects /admin/* (except /admin/login). Redirects to login or home if misconfigured.
 */
export function RequireAdmin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      navigate('/', { replace: true });
      return undefined;
    }

    const sb = getSupabase();

    sb.auth.getSession().then(({ data }) => {
      const sess = data.session;
      setSession(sess);
      setReady(true);
      if (!sess) navigate('/admin/login', { replace: true });
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (!sess) navigate('/admin/login', { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!isSupabaseConfigured()) return null;

  if (!ready) {
    return (
      <div className="admin-app flex min-h-screen items-center justify-center bg-background font-ui text-muted-foreground">
        {t('admin.loading')}
      </div>
    );
  }

  if (!session) return null;

  return <Outlet />;
}
