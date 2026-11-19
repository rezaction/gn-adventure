import { fail, handle } from '../../_lib/http.js';

// Proksi gambar dari Supabase Storage dengan cache panjang di Cloudflare (hemat kuota transfer Supabase).
// Contoh: /api/image/packages/bali-800.webp
const TYPES = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', avif: 'image/avif', svg: 'image/svg+xml' };

export const onRequestGet = handle(async (context) => {
  const { request, env, params } = context;
  const path = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  if (!path || path.length > 200 || path.includes('..') || !/^[A-Za-z0-9/_.-]+$/.test(path)) return fail(400, 'Path tidak valid');
  const ext = path.split('.').pop().toLowerCase();
  if (!TYPES[ext]) return fail(400, 'Jenis file tidak didukung');
  if (!env.SUPABASE_URL) return fail(503, 'Belum dikonfigurasi');

  const cache = caches.default;
  const key = new Request(new URL(request.url).toString(), { method: 'GET' });
  const hit = await cache.match(key);
  if (hit) return hit;

  const upstream = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/media/${path.split('/').map(encodeURIComponent).join('/')}`);
  if (!upstream.ok) return fail(upstream.status === 404 ? 404 : 502, 'Gambar tidak ditemukan');
  const res = new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': TYPES[ext],
      'cache-control': 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
  context.waitUntil(cache.put(key, res.clone()));
  return res;
});
