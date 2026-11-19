import { json, handle, readJson, rateLimit, sha256, clientIp, HttpError } from '../_lib/http.js';
import { rest, rpc } from '../_lib/supabase.js';

const KINDS = ['contact', 'booking', 'vehicle'];
const str = (v, min, max, label) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (s.length < min || s.length > max) throw new HttpError(400, `${label} harus ${min}-${max} karakter`);
  return s;
};

// POST /api/message  ->  masuk ke kotak pesan admin (tanpa layanan pihak ketiga)
export const onRequestPost = handle(async (context) => {
  const { request, env } = context;
  await rateLimit(context, 'message', 6, 600);
  const b = await readJson(request, 8000);
  if (typeof b.hp === 'string' && b.hp.trim() !== '') return json({ ok: true }); // honeypot: bot dianggap berhasil, tidak disimpan
  const kind = KINDS.includes(b.kind) ? b.kind : 'contact';
  const name = str(b.name, 2, 80, 'Nama');
  const contact = str(b.contact, 5, 120, 'Kontak');
  const subject = b.subject ? str(b.subject, 1, 150, 'Subjek') : null;
  const body = b.body ? str(b.body, 1, 3000, 'Pesan') : null;
  if (!subject && !body && !(b.payload && typeof b.payload === 'object')) throw new HttpError(400, 'Pesan kosong');
  let payload = {};
  if (b.payload != null) {
    if (typeof b.payload !== 'object' || Array.isArray(b.payload)) throw new HttpError(400, 'payload tidak valid');
    if (JSON.stringify(b.payload).length > 4000) throw new HttpError(413, 'payload terlalu besar');
    payload = b.payload;
  }
  const lang = b.lang === 'en' ? 'en' : 'id';
  const ip_hash = (await sha256(clientIp(request) + (env.IP_SALT || 'gonest'))).slice(0, 32);

  // batas harian per IP (lapis kedua, tahan terhadap restart cache)
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recent = await rest(env, `messages?select=id&ip_hash=eq.${ip_hash}&created_at=gte.${encodeURIComponent(since)}&limit=10`, { service: true });
  if (Array.isArray(recent) && recent.length >= 5) throw new HttpError(429, 'Terlalu banyak pesan. Coba lagi beberapa menit lagi.');

  let promo_code = null; let promo = false;
  if (typeof b.promo_code === 'string' && /^[A-Za-z0-9_-]{2,32}$/.test(b.promo_code.trim())) {
    const code = b.promo_code.trim().toUpperCase();
    if (await rpc(env, 'claim_promo', { p_code: code }, { service: true })) { promo_code = code; promo = true; }
  }

  const rows = await rest(env, 'messages', {
    method: 'POST', service: true, prefer: 'return=representation',
    body: { kind, name, contact, subject, body, payload, promo_code, lang, ip_hash },
  });
  return json({ ok: true, id: rows && rows[0] && rows[0].id, promo }, 201, { 'cache-control': 'no-store' });
});
