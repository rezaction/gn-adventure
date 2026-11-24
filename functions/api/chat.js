import { json, handle, readJson, rateLimit, sha256, clientIp, HttpError } from '../_lib/http.js';
import { rest } from '../_lib/supabase.js';

// Live chat pengunjung. Pengunjung memegang id percakapan + token acak (hanya hash yang disimpan).
//   POST /api/chat {action:'start', name, contact?, body, lang}   -> {id, token}
//   POST /api/chat {action:'send',  id, token, body}              -> {ok}
//   GET  /api/chat?id=&token=                                     -> {messages:[...], status}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN = /^[A-Za-z0-9_-]{32,64}$/;
const text = (v, min, max, label) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (s.length < min || s.length > max) throw new HttpError(400, `${label} harus ${min}-${max} karakter`);
  return s;
};
const newToken = () => { const a = crypto.getRandomValues(new Uint8Array(24)); return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_'); };
const hashToken = (env, t) => sha256(t + (env.IP_SALT || 'gonest'));

async function ownThread(env, id, token) {
  if (!UUID.test(id || '') || !TOKEN.test(token || '')) throw new HttpError(403, 'Percakapan tidak ditemukan');
  const rows = await rest(env, `chat_threads?select=id,token_hash,status&id=eq.${id}`, { service: true });
  const t = Array.isArray(rows) ? rows[0] : null;
  if (!t || t.token_hash !== await hashToken(env, token)) throw new HttpError(403, 'Percakapan tidak ditemukan');
  return t;
}

export const onRequestGet = handle(async (context) => {
  const { request, env } = context;
  await rateLimit(context, 'chat-poll', 60, 60);
  const u = new URL(request.url);
  const t = await ownThread(env, u.searchParams.get('id'), u.searchParams.get('token'));
  const msgs = await rest(env, `chat_messages?select=id,sender,body,created_at&thread_id=eq.${t.id}&order=created_at.asc&limit=200`, { service: true });
  return json({ ok: true, status: t.status, messages: msgs || [] }, 200, { 'cache-control': 'no-store' });
});

export const onRequestPost = handle(async (context) => {
  const { request, env } = context;
  const b = await readJson(request, 6000);
  if (typeof b.hp === 'string' && b.hp.trim() !== '') return json({ ok: true });
  const body = text(b.body, 1, 1000, 'Pesan');
  if (b.action === 'start') {
    await rateLimit(context, 'chat-start', 3, 600);
    const name = text(b.name, 2, 80, 'Nama');
    const contact = b.contact ? text(b.contact, 5, 120, 'Kontak') : null;
    const ip_hash = (await sha256(clientIp(request) + (env.IP_SALT || 'gonest'))).slice(0, 32);
    const since = new Date(Date.now() - 3600 * 1000).toISOString();
    const recent = await rest(env, `chat_threads?select=id&ip_hash=eq.${ip_hash}&created_at=gte.${encodeURIComponent(since)}&limit=10`, { service: true });
    if (Array.isArray(recent) && recent.length >= 5) throw new HttpError(429, 'Terlalu banyak percakapan. Coba lagi nanti.');
    const token = newToken();
    const now = new Date().toISOString();
    const rows = await rest(env, 'chat_threads', { method: 'POST', service: true, prefer: 'return=representation',
      body: { token_hash: await hashToken(env, token), name, contact, lang: b.lang === 'en' ? 'en' : 'id', ip_hash, unread_staff: 1, last_msg_at: now, last_text: body.slice(0, 120) } });
    const id = rows && rows[0] && rows[0].id;
    await rest(env, 'chat_messages', { method: 'POST', service: true, body: { thread_id: id, sender: 'visitor', body } });
    return json({ ok: true, id, token }, 201, { 'cache-control': 'no-store' });
  }
  if (b.action === 'send') {
    await rateLimit(context, 'chat-send', 20, 60);
    const t = await ownThread(env, b.id, b.token);
    if (t.status === 'closed') throw new HttpError(409, 'Percakapan sudah ditutup. Mulai percakapan baru.');
    const n = await rest(env, `chat_messages?select=id&thread_id=eq.${t.id}&sender=eq.visitor&created_at=gte.${encodeURIComponent(new Date(Date.now() - 600000).toISOString())}&limit=40`, { service: true });
    if (Array.isArray(n) && n.length >= 30) throw new HttpError(429, 'Terlalu banyak pesan. Tunggu sebentar.');
    await rest(env, 'chat_messages', { method: 'POST', service: true, body: { thread_id: t.id, sender: 'visitor', body } });
    const cur = await rest(env, `chat_threads?select=unread_staff&id=eq.${t.id}`, { service: true });
    await rest(env, `chat_threads?id=eq.${t.id}`, { method: 'PATCH', service: true, body: { unread_staff: ((cur && cur[0] && cur[0].unread_staff) || 0) + 1, last_msg_at: new Date().toISOString(), last_text: body.slice(0, 120) } });
    return json({ ok: true }, 201, { 'cache-control': 'no-store' });
  }
  throw new HttpError(400, 'action tidak dikenal');
});
