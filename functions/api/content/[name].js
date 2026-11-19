import { json, fail, handle, isSlug, HttpError } from '../../_lib/http.js';
import { rest } from '../../_lib/supabase.js';

// Konten publik (hanya baris yang boleh dilihat publik; RLS yang menjaganya). Di-cache di tepi Cloudflare.
const TTL = { settings: 60, sections: 60, packages: 120, vehicles: 60, articles: 120, promos: 60, gallery: 120, destinations: 300 };
const slugOrNull = (v) => { if (v == null || v === '') return null; if (!isSlug(v)) throw new HttpError(400, 'slug tidak valid'); return v; };
const pageOrNull = (v) => { if (v == null || v === '') return null; if (!/^[a-z0-9_-]{1,40}$/.test(v)) throw new HttpError(400, 'page tidak valid'); return v; };
const limitOf = (v, d = 50) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(Math.max(n, 1), 100) : d; };

const BUILDERS = {
  settings: () => ({ path: 'site_settings?select=key,value', shape: (rows) => Object.fromEntries(rows.map((r) => [r.key, r.value])) }),
  sections: (q) => {
    const page = pageOrNull(q.get('page'));
    return { path: `sections?select=id,page,kind,sort,fields&order=sort.asc${page ? `&page=eq.${page}` : ''}` };
  },
  packages: (q) => {
    const slug = slugOrNull(q.get('slug')); const kind = q.get('kind');
    let p = `packages?select=*&order=sort.asc,created_at.desc&limit=${limitOf(q.get('limit'))}`;
    if (slug) p += `&slug=eq.${slug}`;
    if (kind && /^(open|private|family|custom)$/.test(kind)) p += `&kind=eq.${kind}`;
    return { path: p };
  },
  vehicles: (q) => {
    const slug = slugOrNull(q.get('slug'));
    return { path: `vehicles?select=*&order=sort.asc${slug ? `&slug=eq.${slug}` : ''}` };
  },
  articles: (q) => {
    const slug = slugOrNull(q.get('slug'));
    const cols = slug ? '*' : 'id,slug,title,excerpt,category,tags,cover,published_at,seo';
    let p = `articles?select=${cols}&order=published_at.desc.nullslast&limit=${limitOf(q.get('limit'), 20)}`;
    if (slug) p += `&slug=eq.${slug}`;
    const cat = q.get('category'); if (cat && /^[\p{L}\p{N} _-]{1,40}$/u.test(cat)) p += `&category=eq.${encodeURIComponent(cat)}`;
    return { path: p };
  },
  promos: () => ({ path: 'promos?select=id,code,title,description,terms,type,value,starts_at,ends_at,image,show_popup&order=ends_at.asc.nullslast' }),
  gallery: (q) => {
    const cat = q.get('category');
    let p = 'gallery_items?select=id,image,title,caption,location,category,destination_id&order=sort.asc,created_at.desc&limit=100';
    if (cat && /^[\p{L}\p{N} _-]{1,40}$/u.test(cat)) p += `&category=eq.${encodeURIComponent(cat)}`;
    return { path: p };
  },
  destinations: (q) => {
    const slug = slugOrNull(q.get('slug'));
    return { path: `destinations?select=*&order=sort.asc${slug ? `&slug=eq.${slug}` : ''}` };
  },
};

export const onRequestGet = handle(async (context) => {
  const { request, env, params } = context;
  const name = params.name;
  if (!Object.prototype.hasOwnProperty.call(BUILDERS, name)) return fail(404, 'Konten tidak ditemukan');
  const url = new URL(request.url);
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const b = BUILDERS[name](url.searchParams);
  let data = await rest(env, b.path);
  if (b.shape) data = b.shape(data);
  const res = json({ ok: true, data }, 200, {
    'cache-control': `public, max-age=20, s-maxage=${TTL[name]}`,
  });
  context.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
});
