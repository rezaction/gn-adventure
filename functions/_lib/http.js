// Pembantu kecil untuk respons JSON dan validasi.
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', ...headers },
  });

export const fail = (status, message, extra = {}) => json({ ok: false, error: message, ...extra }, status, { 'cache-control': 'no-store' });

export async function readJson(request, maxBytes = 16000) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new HttpError(415, 'Gunakan content-type application/json');
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, 'Permintaan terlalu besar');
  try { return JSON.parse(text); } catch { throw new HttpError(400, 'JSON tidak valid'); }
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Bungkus handler agar HttpError menjadi respons yang rapi dan error lain tidak membocorkan detail.
export const handle = (fn) => async (context) => {
  try { return await fn(context); }
  catch (e) {
    if (e instanceof HttpError) return fail(e.status, e.message);
    console.error('API error:', e && e.stack || e);
    return fail(500, 'Terjadi kesalahan di server');
  }
};

export const isSlug = (s) => typeof s === 'string' && /^[a-z0-9][a-z0-9-]{0,99}$/.test(s);
export const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
export const clientIp = (request) => request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '0.0.0.0';

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Pembatas laju sederhana berbasis Cache API (cukup untuk mencegah penyalahgunaan ringan).
export async function rateLimit(context, bucket, limit, windowSec) {
  const cache = caches.default;
  const ip = clientIp(context.request);
  const slot = Math.floor(Date.now() / 1000 / windowSec);
  const key = new Request(`https://rl.invalid/${bucket}/${await sha256(ip)}/${slot}`);
  const hit = await cache.match(key);
  const n = hit ? parseInt(await hit.text(), 10) || 0 : 0;
  if (n >= limit) throw new HttpError(429, 'Terlalu banyak permintaan. Coba lagi sebentar.');
  context.waitUntil(cache.put(key, new Response(String(n + 1), { headers: { 'cache-control': `max-age=${windowSec}` } })));
}
