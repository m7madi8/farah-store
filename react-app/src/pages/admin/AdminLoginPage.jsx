import '@/styles/admin.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminLanguage } from '@/context/LanguageContext';
import { isFirebaseConfigured } from '@/lib/firebaseConfig';
import { getFirebaseAuth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function loginErrorMessage(err, t) {
  const code = err?.code || '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return t('admin.loginInvalidCredential');
  }
  if (code === 'auth/too-many-requests') return t('admin.loginTooManyRequests');
  if (code === 'auth/network-request-failed') return t('admin.loginNetworkError');
  return err?.message || t('admin.loginInvalidCredential');
}

export function AdminLoginPage() {
  const { t } = useAdminLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) return undefined;
    getFirebaseAuth().then((auth) => {
      if (auth.currentUser) navigate('/admin/pending', { replace: true });
    });
    return undefined;
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isFirebaseConfigured()) {
      setError(t('admin.configMissing'));
      return;
    }
    setLoading(true);
    try {
      const auth = await getFirebaseAuth();
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (signErr) {
        setError(loginErrorMessage(signErr, t));
        return;
      }
      navigate('/admin/pending', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  if (!isFirebaseConfigured()) {
    return (
      <div className="admin-app admin-login-shell font-ui">
        <div className="admin-login-form-wrap">
          <div className="admin-login-card">
            <h2>{t('admin.title')}</h2>
            <p className="admin-login-sub">{t('admin.configMissing')}</p>
            <p className="text-sm text-muted-foreground">{t('admin.configHint')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-app admin-login-shell font-ui">
      <div className="admin-login-hero">
        <h1>{t('admin.title')}</h1>
        <p>{t('admin.loginHero')}</p>
      </div>
      <div className="admin-login-form-wrap">
        <div className="admin-login-card">
          <h2>{t('admin.loginTitle')}</h2>
          <p className="admin-login-sub">{t('admin.loginSub')}</p>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="admin-field grid gap-2">
              <Label htmlFor="admin-email">{t('admin.email')}</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
              />
            </div>
            <div className="admin-field grid gap-2">
              <Label htmlFor="admin-password">{t('admin.password')}</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t('admin.loading') : t('admin.signIn')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
