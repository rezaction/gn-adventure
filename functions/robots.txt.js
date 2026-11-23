// GET /robots.txt  — mengarahkan mesin pencari ke sitemap dan menjauhkan dari admin/API
export const onRequestGet = async ({ request }) => new Response(
  `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${new URL(request.url).origin}/sitemap.xml\n`,
  { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
