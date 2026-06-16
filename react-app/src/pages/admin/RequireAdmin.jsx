import '@/styles/admin.css';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAdminLanguage } from '@/context/LanguageContext';
import { isFirebaseConfigured } from '@/lib/firebaseConfig';
import { getFirebaseAuth } from '@/lib/firebase';

/**
 * Protects /admin/* (except /admin/login). Redirects to login or home if misconfigured.
 */
export function RequireAdmin() {
  const navigate = useNavigate();
  const { t } = useAdminLanguage();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      navigate('/', { replace: true });
      return undefined;
    }

    let cancelled = false;
    let unsubscribe = () => {};

    (async () => {
      const auth = await getFirebaseAuth();
      const { onAuthStateChanged } = await import('firebase/auth');
      if (cancelled) return;
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setSession(user);
        setReady(true);
        if (!user) navigate('/admin/login', { replace: true });
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [navigate]);

  if (!isFirebaseConfigured()) return null;

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
