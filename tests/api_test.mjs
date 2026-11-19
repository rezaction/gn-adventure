// Uji logika API dengan Supabase tiruan (tanpa jaringan). Jalankan: node tests/api_test.mjs
import assert from 'node:assert/strict';

// ---- tiruan Cache API ----
const store = new Map();
globalThis.caches = { default: {
  async match(req) { const r = store.get(typeof req === 'string' ? req : req.url); return r ? r.clone() : undefined; },
  async put(req, res) { store.set(typeof req === 'string' ? req : req.url, res); },
} };

// ---- tiruan Supabase ----
const calls = [];
const USERS = { 'tok-owner': { id: '11111111-1111-1111-1111-111111111111' }, 'tok-admin': { id: '22222222-2222-2222-2222-222222222222' } };
const PROFILES = { '11111111-1111-1111-1111-111111111111': { id: '11111111-1111-1111-1111-111111111111', email: 'o@x.id', name: 'O', role: 'owner', active: true },
                   '22222222-2222-2222-2222-222222222222': { id: '22222222-2222-2222-2222-222222222222', email: 'a@x.id', name: 'A', role: 'admin', active: true } };
let messageRows = []; let claimResult = true; let failProfileInsert = false;
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url); const method = init.method || 'GET';
  const h = init.headers || {}; calls.push({ url: u.pathname + u.search, method, h, body: init.body });
  const J = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
  if (u.pathname === '/auth/v1/user') { const t = (h.authorization || '').replace('Bearer ', ''); return USERS[t] ? J(USERS[t]) : J({ msg: 'bad' }, 401); }
  if (u.pathname === '/auth/v1/admin/users' && method === 'POST') return J({ id: '33333333-3333-3333-3333-333333333333' });
  if (u.pathname.startsWith('/auth/v1/admin/users/')) return J({});
  if (u.pathname === '/rest/v1/profiles' && method === 'GET') {
    const id = u.searchParams.get('id');
    if (id) { const p = PROFILES[id.replace('eq.', '')]; return J(p ? [p] : []); }
    return J(Object.values(PROFILES));
  }
  if (u.pathname === '/rest/v1/profiles' && method === 'POST') return failProfileInsert ? J({ message: 'boom' }, 400) : J([JSON.parse(init.body)], 201);
  if (u.pathname === '/rest/v1/profiles' && method === 'PATCH') return J({});
  if (u.pathname === '/rest/v1/messages' && method === 'GET') return J(messageRows);
  if (u.pathname === '/rest/v1/messages' && method === 'POST') return J([{ id: 'm1', ...JSON.parse(init.body) }], 201);
  if (u.pathname === '/rest/v1/rpc/claim_promo') return J(claimResult);
  if (u.pathname === '/rest/v1/rpc/validate_promo') return J(JSON.parse(init.body).p_code === 'OK10' ? { valid: true, code: 'OK10' } : { valid: false });
  if (u.pathname === '/rest/v1/rpc/vehicles_available') return J([{ vehicle_id: 'v1', available: true }]);
  if (u.pathname === '/rest/v1/site_settings') return J([{ key: 'brand', value: { name: 'GoNEST' } }, { key: 'nav', value: {} }]);
  if (u.pathname.startsWith('/rest/v1/')) return J([{ ok: 1 }]);
  if (u.pathname.startsWith('/storage/v1/object/public/media/')) return u.pathname.endsWith('missing.webp') ? new Response('', { status: 404 }) : new Response('IMG', { status: 200 });
  return new Response('?', { status: 404 });
};

const env = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'ANON', SUPABASE_SERVICE_KEY: 'SERVICE', IP_SALT: 's' };
const ctx = (req, params = {}, e = env) => ({ request: req, env: e, params, waitUntil: (p) => { p && p.catch && p.catch(() => {}); } });
const R = (path, init = {}, ip = '9.9.9.9') => new Request('https://gonest.test' + path, { ...init, headers: { 'cf-connecting-ip': ip, ...(init.headers || {}) } });
const post = (path, body, headers = {}, ip) => R(path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }, ip);
const imp = (p) => import('../functions/' + p);
let n = 0; const ok = (name) => { n++; console.log('  ok  ' + name); };

// ---- content ----
{ const m = await imp('api/content/[name].js');
  let r = await m.onRequestGet(ctx(R('/api/content/settings'), { name: 'settings' }));
  assert.equal(r.status, 200); const j = await r.json(); assert.deepEqual(j.data.brand, { name: 'GoNEST' }); ok('settings diubah jadi objek');
  assert.equal(calls.at(-1).h.apikey, 'ANON'); assert.equal(calls.at(-1).h.authorization, 'Bearer ANON'); ok('konten publik memakai kunci anon (bukan service)');
  const before = calls.length; r = await m.onRequestGet(ctx(R('/api/content/settings'), { name: 'settings' })); assert.equal(calls.length, before); ok('respons kedua dari cache');
  r = await m.onRequestGet(ctx(R('/api/content/hacker'), { name: 'hacker' })); assert.equal(r.status, 404); ok('nama konten tak dikenal -> 404');
  r = await m.onRequestGet(ctx(R('/api/content/packages?slug=a%27%3Bdrop'), { name: 'packages' })); assert.equal(r.status, 400); ok('slug berbahaya ditolak');
  r = await m.onRequestGet(ctx(R('/api/content/sections?page=home'), { name: 'sections' })); assert.match(calls.at(-1).url, /page=eq\.home/); ok('filter page diteruskan');
  r = await m.onRequestGet(ctx(R('/api/content/sections?page=x%26y'), { name: 'sections' })); assert.equal(r.status, 400); ok('page tidak valid ditolak');
  await m.onRequestGet(ctx(R('/api/content/articles'), { name: 'articles' })); assert.doesNotMatch(calls.at(-1).url, /body/); ok('daftar artikel tanpa isi lengkap');
  await m.onRequestGet(ctx(R('/api/content/articles?slug=halo'), { name: 'articles' })); assert.match(calls.at(-1).url, /select=\*/); ok('artikel tunggal dengan isi lengkap');
  await m.onRequestGet(ctx(R('/api/content/packages?limit=9999'), { name: 'packages' })); assert.match(calls.at(-1).url, /limit=100/); ok('limit dibatasi 100'); }

// ---- promo ----
{ const m = await imp('api/promo.js');
  let r = await m.onRequestPost(ctx(post('/api/promo', { code: 'ok10' }, {}, '1.1.1.1'))); let j = await r.json(); assert.equal(j.valid, false); ok('kode tak dikenal -> valid:false');
  r = await m.onRequestPost(ctx(post('/api/promo', { code: 'OK10' }, {}, '1.1.1.1'))); j = await r.json(); assert.equal(j.valid, true); ok('kode valid');
  r = await m.onRequestPost(ctx(post('/api/promo', { code: "x'; --" }, {}, '1.1.1.1'))); assert.equal(r.status, 400); ok('format kode berbahaya ditolak');
  r = await m.onRequestPost(ctx(R('/api/promo', { method: 'POST', body: '{}' }))); assert.equal(r.status, 415); ok('tanpa content-type JSON -> 415');
  let last; for (let i = 0; i < 25; i++) last = await m.onRequestPost(ctx(post('/api/promo', { code: 'AA' }, {}, '7.7.7.7'))); assert.equal(last.status, 429); ok('rate limit promo bekerja'); }

// ---- availability ----
{ const m = await imp('api/availability.js');
  let r = await m.onRequestGet(ctx(R('/api/availability?from=2026-12-01'))); assert.equal(r.status, 200); ok('availability OK');
  r = await m.onRequestGet(ctx(R('/api/availability?from=bukan-tanggal'))); assert.equal(r.status, 400); ok('tanggal tidak valid ditolak');
  r = await m.onRequestGet(ctx(R('/api/availability?from=2026-12-05&to=2026-12-01'))); assert.equal(r.status, 400); ok('rentang terbalik ditolak'); }

// ---- message ----
{ const m = await imp('api/message.js'); const good = { kind: 'booking', name: 'Budi', contact: '08123456789', body: 'Mau ke Bromo', promo_code: 'ok10', payload: { pax: 4 } };
  let r = await m.onRequestPost(ctx(post('/api/message', good, {}, '2.2.2.2'))); let j = await r.json(); assert.equal(r.status, 201); assert.equal(j.promo, true); ok('pesan tersimpan + promo diklaim');
  const ins = calls.filter((c) => c.url === '/rest/v1/messages' && c.method === 'POST').at(-1); assert.equal(ins.h.apikey, 'SERVICE'); const row = JSON.parse(ins.body); assert.equal(row.promo_code, 'OK10'); assert.ok(row.ip_hash && row.ip_hash.length === 32 && !row.ip_hash.includes('2.2.2.2')); ok('IP disimpan hanya sebagai hash');
  claimResult = false; r = await m.onRequestPost(ctx(post('/api/message', good, {}, '2.2.2.3'))); j = await r.json(); assert.equal(j.promo, false); claimResult = true; ok('promo gagal diklaim tidak menggagalkan pesan');
  const cnt = calls.filter((c) => c.url === '/rest/v1/messages' && c.method === 'POST').length;
  r = await m.onRequestPost(ctx(post('/api/message', { ...good, hp: 'http://spam' }, {}, '2.2.2.4'))); assert.equal((await r.json()).ok, true); assert.equal(calls.filter((c) => c.url === '/rest/v1/messages' && c.method === 'POST').length, cnt); ok('honeypot: bot tidak disimpan');
  r = await m.onRequestPost(ctx(post('/api/message', { ...good, name: 'B' }, {}, '2.2.2.5'))); assert.equal(r.status, 400); ok('nama terlalu pendek ditolak');
  r = await m.onRequestPost(ctx(post('/api/message', { name: 'Budi', contact: '08123456789' }, {}, '2.2.2.6'))); assert.equal(r.status, 400); ok('pesan kosong ditolak');
  r = await m.onRequestPost(ctx(post('/api/message', { ...good, payload: { x: 'a'.repeat(5000) } }, {}, '2.2.2.7'))); assert.equal(r.status, 413); ok('payload besar ditolak');
  messageRows = Array(5).fill({ id: 'x' }); r = await m.onRequestPost(ctx(post('/api/message', good, {}, '2.2.2.8'))); assert.equal(r.status, 429); messageRows = []; ok('batas 5 pesan / 10 menit per IP (DB)');
  const e2 = { ...env }; delete e2.SUPABASE_SERVICE_KEY; r = await m.onRequestPost(ctx(post('/api/message', good, {}, '2.2.2.9'), {}, e2)); assert.equal(r.status, 500); ok('tanpa kunci service -> 500 yang rapi'); }

// ---- image ----
{ const m = await imp('api/image/[[path]].js');
  let r = await m.onRequestGet(ctx(R('/api/image/packages/a.webp'), { path: ['packages', 'a.webp'] })); assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'image/webp'); assert.match(r.headers.get('cache-control'), /s-maxage=31536000/); ok('gambar diproksi dengan cache panjang');
  r = await m.onRequestGet(ctx(R('/x'), { path: ['..', 'etc', 'passwd.png'] })); assert.equal(r.status, 400); ok('path traversal ditolak');
  r = await m.onRequestGet(ctx(R('/x'), { path: ['a.exe'] })); assert.equal(r.status, 400); ok('ekstensi asing ditolak');
  r = await m.onRequestGet(ctx(R('/x'), { path: ['missing.webp'] })); assert.equal(r.status, 404); ok('gambar tidak ada -> 404'); }

// ---- admin ----
{ const me = await imp('api/admin/me.js'); const us = await imp('api/admin/users.js'); const A = (t) => ({ authorization: 'Bearer ' + t });
  let r = await me.onRequestGet(ctx(R('/api/admin/me'))); assert.equal(r.status, 401); ok('tanpa token -> 401');
  r = await me.onRequestGet(ctx(R('/api/admin/me', { headers: A('tok-bad') }))); assert.equal(r.status, 401); ok('token palsu -> 401');
  r = await me.onRequestGet(ctx(R('/api/admin/me', { headers: A('tok-admin') }))); assert.equal((await r.json()).profile.role, 'admin'); ok('admin umum bisa lihat profil sendiri');
  r = await us.onRequestGet(ctx(R('/api/admin/users', { headers: A('tok-admin') }))); assert.equal(r.status, 403); ok('admin umum TIDAK bisa daftar pengguna');
  r = await us.onRequestPost(ctx(post('/api/admin/users', { email: 'n@x.id', name: 'Baru', password: 'panjang-sekali-123' }, A('tok-admin')))); assert.equal(r.status, 403); ok('admin umum TIDAK bisa membuat pengguna');
  r = await us.onRequestGet(ctx(R('/api/admin/users', { headers: A('tok-owner') }))); assert.equal((await r.json()).data.length, 2); ok('owner melihat daftar pengguna');
  r = await us.onRequestPost(ctx(post('/api/admin/users', { email: 'n@x.id', name: 'Baru', password: 'pendek' }, A('tok-owner')))); assert.equal(r.status, 400); ok('kata sandi pendek ditolak');
  r = await us.onRequestPost(ctx(post('/api/admin/users', { email: 'n@x.id', name: 'Baru', password: 'panjang-sekali-123', role: 'superuser' }, A('tok-owner')))); assert.equal(r.status, 201); const p = JSON.parse(calls.filter((c) => c.url === '/rest/v1/profiles' && c.method === 'POST').at(-1).body); assert.equal(p.role, 'admin'); ok('owner membuat admin; peran tak dikenal -> admin');
  failProfileInsert = true; const delBefore = calls.filter((c) => c.method === 'DELETE').length;
  r = await us.onRequestPost(ctx(post('/api/admin/users', { email: 'z@x.id', name: 'Zed', password: 'panjang-sekali-123' }, A('tok-owner')))); assert.notEqual(r.status, 201); assert.equal(calls.filter((c) => c.method === 'DELETE').length, delBefore + 1); failProfileInsert = false; ok('gagal buat profil -> akun auth dibatalkan');
  r = await us.onRequestPatch(ctx(R('/api/admin/users', { method: 'PATCH', headers: { 'content-type': 'application/json', ...A('tok-owner') }, body: JSON.stringify({ id: '11111111-1111-1111-1111-111111111111', active: false }) }))); assert.equal(r.status, 400); ok('owner tidak bisa menonaktifkan dirinya sendiri');
  r = await us.onRequestPatch(ctx(R('/api/admin/users', { method: 'PATCH', headers: { 'content-type': 'application/json', ...A('tok-owner') }, body: JSON.stringify({ id: '22222222-2222-2222-2222-222222222222', active: false }) }))); assert.equal(r.status, 200); ok('owner menonaktifkan admin');
  r = await us.onRequestDelete(ctx(R('/api/admin/users?id=11111111-1111-1111-1111-111111111111', { method: 'DELETE', headers: A('tok-owner') }))); assert.equal(r.status, 400); ok('owner tidak bisa menghapus dirinya sendiri');
  r = await us.onRequestDelete(ctx(R('/api/admin/users?id=bukan-uuid', { method: 'DELETE', headers: A('tok-owner') }))); assert.equal(r.status, 400); ok('id bukan UUID ditolak'); }

// ---- config ----
{ const m = await imp('api/config.js'); let r = await m.onRequestGet(ctx(R('/api/config'))); const j = await r.json(); assert.equal(j.anonKey, 'ANON'); assert.ok(!JSON.stringify(j).includes('SERVICE')); ok('config hanya membocorkan kunci anon');
  r = await m.onRequestGet(ctx(R('/api/config'), {}, {})); assert.equal(r.status, 503); ok('config belum diatur -> 503'); }

console.log(`\nSEMUA ${n} TES API LULUS`);
