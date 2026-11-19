import { json, handle, isDate, HttpError } from '../_lib/http.js';
import { rpc } from '../_lib/supabase.js';

// GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD  ->  [{vehicle_id, available}]
export const onRequestGet = handle(async (context) => {
  const q = new URL(context.request.url).searchParams;
  const from = q.get('from'); const to = q.get('to') || null;
  if (!isDate(from) || (to && !isDate(to))) throw new HttpError(400, 'Format tanggal harus YYYY-MM-DD');
  if (to && to < from) throw new HttpError(400, 'Tanggal selesai tidak boleh sebelum tanggal mulai');
  const cache = caches.default;
  const key = new Request(new URL(context.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  const rows = await rpc(context.env, 'vehicles_available', { p_from: from, p_to: to });
  const res = json({ ok: true, data: rows }, 200, { 'cache-control': 'public, max-age=15, s-maxage=30' });
  context.waitUntil(cache.put(key, res.clone()));
  return res;
});
