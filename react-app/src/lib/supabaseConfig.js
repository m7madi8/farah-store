/** Env-only check — no @supabase/supabase-js import (keeps storefront bundle lean). */
export function isSupabaseConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && String(url).trim() && key && String(key).trim());
}
