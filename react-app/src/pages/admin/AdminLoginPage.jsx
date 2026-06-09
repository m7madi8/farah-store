import '@/styles/admin.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminLoginPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return undefined;
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) navigate('/admin/pending', { replace: true });
      });
    return undefined;
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isSupabaseConfigured()) {
      setError(t('admin.configMissing'));
      return;
    }
    setLoading(true);
    try {
      const { error: signErr } = await getSupabase().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signErr) {
        setError(signErr.message);
        return;
      }
      navigate('/admin/pending', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  if (!isSupabaseConfigured()) {
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
