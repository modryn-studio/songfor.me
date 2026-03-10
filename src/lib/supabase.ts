import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — avoids "supabaseUrl is required" at build time when env vars
// aren't configured yet. The client is created on first property access.
let _client: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Supabase env vars not configured');
  return (_client = createClient(url, anon));
}

// Browser client — anon key, governed by RLS
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, p) {
    return getClient()[p as keyof SupabaseClient];
  },
});

// Server client — service role key, bypasses RLS for admin operations
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role env vars not set');
  return createClient(url, key, { auth: { persistSession: false } });
}
