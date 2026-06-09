import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './supabaseConfig';

export { isSupabaseConfigured };

let browserClient;

/**
 * Browser Supabase client (anon key). Safe for storefront reads/inserts allowed by RLS.
 */
export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase URL / anon key missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  if (!browserClient) {
    browserClient = createClient(
      String(import.meta.env.VITE_SUPABASE_URL).trim(),
      String(import.meta.env.VITE_SUPABASE_ANON_KEY).trim(),
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'cfa-supabase-auth',
        },
      }
    );
  }
  return browserClient;
}
