// Server uji lokal: menyajikan public/, menjalankan fungsi /api/* sungguhan, dan meniru Supabase di /sb/*.
// Hanya untuk pengujian. Jalankan: node tests/dev_server.mjs [port]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +process.argv[2] || 8140;
const FX = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures.json'), 'utf8'));
const store = new Map();
globalThis.caches = { default: { async match(r) { const x = store.get(r.url); return x && x.clone(); }, async put(r, res) { store.set(r.url, res); } } };

const TOK = { 'tok-owner': { id: '11111111-1111-1111-1111-111111111111', email: 'owner@x.id' }, 'tok-admin': { id: '22222222-2222-2222-2222-222222222222', email: 'admin@x.id' } };
const PASS = { 'owner@x.id': ['ownerpass123', 'tok-owner'], 'admin@x.id': ['adminpass123', 'tok-admin'] };
const profiles = [
  { id: '11111111-1111-1111-1111-111111111111', email: 'owner@x.id', name: 'Pemilik', role: 'owner', active: true, created_at: '2026-01-01' },
  { id: '22222222-2222-2222-2222-222222222222', email: 'admin@x.id', name: 'Admin Satu', role: 'admin', active: true, created_at: '2026-01-02' }];
const COUNTS = { articles: 3, packages: 2, vehicles: 4, promos: 1, messages: 5 };

async function sb(req, res, url, body) {
  const p = url.pathname.replace('/sb', ''); const m = req.method;
  const J = (d, s = 200, h = {}) => { res.writeHead(s, { 'content-type': 'application/json', ...h }); res.end(JSON.stringify(d)); };
  const bearer = (req.headers.authorization || '').replace('Bearer ', '');
  if (p === '/auth/v1/token') { const b = JSON.parse(body); const e = PASS[b.email]; if (!e || e[0] !== b.password) return J({ error: 'invalid_grant', error_description: 'Invalid login credentials' }, 400);
    return J({ access_token: e[1], token_type: 'bearer', expires_in: 3600, refresh_token: 'r' + e[1], user: { id: TOK[e[1]].id, email: b.email, aud: 'authenticated' } }); }
  if (p === '/auth/v1/user' && m === 'GET') return TOK[bearer] ? J({ ...TOK[bearer], aud: 'authenticated' }) : J({ msg: 'bad jwt' }, 401);
  if (p === '/auth/v1/user' && m === 'PUT') return J({ id: TOK[bearer]?.id });
  if (p === '/auth/v1/admin/users' && m === 'POST') { const b = JSON.parse(body); globalThis.__lastCreate = b; return J({ id: '44444444-4444-4444-4444-444444444444', email: b.email }); }
  if (p.startsWith('/auth/v1/admin/users/')) { const id = p.split('/').pop(); if (m === 'DELETE') { const i = profiles.findIndex((x) => x.id === id); if (i >= 0) profiles.splice(i, 1); } return J({}); }
  if (p === '/rest/v1/profiles') {
    if (m === 'GET') { const id = url.searchParams.get('id'); return J(id ? profiles.filter((x) => 'eq.' + x.id === id) : profiles); }
    if (m === 'POST') { const b = JSON.parse(body); profiles.push({ ...b, created_at: new Date().toISOString() }); return J([b], 201); }
    if (m === 'PATCH') { const id = url.searchParams.get('id').replace('eq.', ''); Object.assign(profiles.find((x) => x.id === id) || {}, JSON.parse(body)); return J({}, 200); }
  }
  const t = p.replace('/rest/v1/', '');
  if (t in COUNTS && m === 'HEAD') { res.writeHead(200, { 'content-type': 'application/json', 'content-range': `0-0/${COUNTS[t]}` }); return res.end(m === 'HEAD' ? '' : '[]'); }
  if (p.startsWith('/storage/v1/object/')) { globalThis.__uploads = (globalThis.__uploads || []).concat(p); return J({ Key: p }); }
  if (t === 'sections' && m === 'PATCH') { const id = url.searchParams.get('id').replace('eq.', ''); const row = FX.sections.find((x) => x.id === id); if (!row) return J([], 200); Object.assign(row, JSON.parse(body)); store.clear(); return J([row]); }
  if (t === 'site_settings' && m === 'POST') { const b = JSON.parse(body); FX.settings[b.key] = b.value; store.clear(); return J([b], 201); }
  if (t === 'sections' && url.searchParams.get('id')) { const row = FX.sections.find((x) => 'eq.' + x.id === url.searchParams.get('id')); return req.headers.accept?.includes('object') ? (row ? J(row) : J({ message: 'none' }, 406)) : J(row ? [row] : []); }
  if (t.startsWith('site_settings')) return J(Object.entries(FX.settings).map(([key, value]) => ({ key, value })));
  if (t.startsWith('sections')) { const pg = url.searchParams.get('page'); return J(FX.sections.map((x) => ({ visible: true, ...x })).filter((x) => !pg || pg === 'eq.' + x.page)); }
  if (t.startsWith('packages')) { const sl = url.searchParams.get('slug'); return J(FX.packages.filter((x) => !sl || sl === 'eq.' + x.slug)); }
  if (t.startsWith('vehicles')) return J(FX.vehicles);
  if (t.startsWith('gallery_items') || t.startsWith('articles')) return J([]);
  return J({ message: 'nf ' + p }, 404);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let body = ''; for await (const c of req) body += c;
  try {
    if (url.pathname.startsWith('/sb/')) return await sb(req, res, url, body);
    if (url.pathname.startsWith('/api/')) {
      const env = { SUPABASE_URL: `http://localhost:${PORT}/sb`, SUPABASE_ANON_KEY: 'ANON', SUPABASE_SERVICE_KEY: 'SERVICE', IP_SALT: 'x' };
      const segs = url.pathname.slice(5).split('/').filter(Boolean);
      let file, params = {};
      const tryFile = (f) => fs.existsSync(path.join(root, 'functions/api', f));
      if (segs[0] === 'content') { file = 'content/[name].js'; params.name = segs[1]; }
      else if (segs[0] === 'image') { file = 'image/[[path]].js'; params.path = segs.slice(1); }
      else if (tryFile(segs.join('/') + '.js')) file = segs.join('/') + '.js';
      if (!file) { res.writeHead(404); return res.end('{"ok":false}'); }
      const mod = await import(pathToFileURL(path.join(root, 'functions/api', file)).href);
      const fn = mod['onRequest' + req.method[0] + req.method.slice(1).toLowerCase()];
      if (!fn) { res.writeHead(405); return res.end('{"ok":false}'); }
      const request = new Request(url, { method: req.method, headers: { ...req.headers, 'cf-connecting-ip': '5.5.5.5' }, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
      const r = await fn({ request, env, params, waitUntil: () => {} });
      res.writeHead(r.status, Object.fromEntries(r.headers)); return res.end(Buffer.from(await r.arrayBuffer()));
    }
    let f = path.join(root, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!f.startsWith(path.join(root, 'public')) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
    res.writeHead(200, { 'content-type': (types[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8' }); res.end(fs.readFileSync(f));
  } catch (e) { console.error(e); res.writeHead(500); res.end(String(e)); }
});
server.listen(PORT, () => console.log('dev server on', PORT));
