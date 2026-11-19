import { json, handle } from '../_lib/http.js';
// Kunci "anon" memang publik (dilindungi RLS). Disajikan dari sini supaya tidak tertanam di repo.
export const onRequestGet = handle(async ({ env }) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return json({ ok: false, error: 'Belum dikonfigurasi' }, 503, { 'cache-control': 'no-store' });
  return json({ ok: true, supabaseUrl: env.SUPABASE_URL, anonKey: env.SUPABASE_ANON_KEY }, 200, { 'cache-control': 'public, max-age=300' });
});
