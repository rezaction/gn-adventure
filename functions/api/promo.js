import { json, handle, readJson, rateLimit, HttpError } from '../_lib/http.js';
import { rpc } from '../_lib/supabase.js';

// POST /api/promo {code}  ->  {valid, ...detail}
export const onRequestPost = handle(async (context) => {
  await rateLimit(context, 'promo', 20, 60);
  const body = await readJson(context.request, 500);
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!/^[A-Za-z0-9_-]{2,32}$/.test(code)) throw new HttpError(400, 'Format kode tidak valid');
  const result = await rpc(context.env, 'validate_promo', { p_code: code });
  return json({ ok: true, ...result }, 200, { 'cache-control': 'no-store' });
});
