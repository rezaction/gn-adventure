import { handle } from './_lib/http.js';
import { rest } from './_lib/supabase.js';

// GET /sitemap.xml  — halaman tetap + paket + artikel terbit (cache 1 jam)
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
export const onRequestGet = handle(async ({ request, env }) => {
  const origin = new URL(request.url).origin;
  let pk = []; let ar = [];
  try { pk = await rest(env, 'packages?select=slug,updated_at&status=eq.published&limit=500'); } catch (e) { /* tetap tampilkan halaman tetap */ }
  try { ar = await rest(env, 'articles?select=slug,updated_at&status=eq.published&limit=500'); } catch (e) { /* idem */ }
  const urls = [['/', 1.0], ['/packages/', 0.9], ['/vehicles/', 0.9], ['/gallery/', 0.6], ['/journal/', 0.7], ['/contact/', 0.7]].map(([p, pr]) => ({ loc: origin + p, pr }))
    .concat((pk || []).map((x) => ({ loc: `${origin}/packages/?slug=${encodeURIComponent(x.slug)}`, pr: 0.8, lm: x.updated_at })))
    .concat((ar || []).map((x) => ({ loc: `${origin}/journal/?slug=${encodeURIComponent(x.slug)}`, pr: 0.6, lm: x.updated_at })));
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `<url><loc>${esc(u.loc)}</loc>${u.lm ? `<lastmod>${esc(String(u.lm).slice(0, 10))}</lastmod>` : ''}<priority>${u.pr}</priority></url>`).join('\n') + '\n</urlset>\n';
  return new Response(xml, { status: 200, headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
});
