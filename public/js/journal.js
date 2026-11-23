/* GoNEST — jurnal: daftar artikel dan detail (/journal/?slug=...). */
(function () {
  'use strict';
  var GN = window.GN, esc = GN.esc, t = GN.t, $ = GN.$;
  var slug = (location.search.match(/[?&]slug=([A-Za-z0-9_-]+)/) || [])[1];
  var list = null, one;
  function render() {
    if (!$('#jr')) return;
    if (!slug) {
      if (!list) return;
      $('#jr').innerHTML = '<div class="page-h"><h1>' + esc(GN.s('jrTitle')) + '</h1><p>' + esc(GN.s('jrLead')) + '</p></div>' +
        (list.length ? '<div class="jr jr--page">' + list.map(GN.arCard).join('') + '</div>' : '<div class="empty"><p>' + esc(GN.s('jrEmpty')) + '</p></div>');
      document.title = GN.s('jrTitle') + ' | ' + ((GN.settings.brand || {}).name || 'GoNEST');
    } else {
      if (one === undefined) return; var a = one;
      if (!a) { $('#jr').innerHTML = '<div class="page-h"><a class="crumb" href="/journal/">&larr; ' + esc(GN.s('jrBack')) + '</a><h1>' + esc(GN.s('notFound')) + '</h1></div>'; return; }
      $('#jr').innerHTML = '<article class="post"><a class="crumb" href="/journal/">&larr; ' + esc(GN.s('jrBack')) + '</a>' + (a.category ? '<p class="ar__c">' + esc(a.category) + '</p>' : '') +
        '<h1>' + esc(t(a.title)) + '</h1>' + (a.published_at ? '<p class="post__d">' + esc(GN.date(a.published_at)) + '</p>' : '') +
        (a.cover ? '<div class="dt__cover">' + GN.cover(a.cover, t(a.title)) + '</div>' : '') + '<div class="post__b">' + GN.md(t(a.body)) + '</div></article>';
      document.title = t(a.title) + ' | ' + ((GN.settings.brand || {}).name || 'GoNEST');
      GN.seo({ title: document.title, description: t(a.excerpt).slice(0, 155), image: a.cover, type: 'article', jsonld: { '@context': 'https://schema.org', '@type': 'Article', headline: t(a.title), description: t(a.excerpt), image: a.cover ? location.origin + GN.img(a.cover) : undefined, datePublished: a.published_at || undefined, dateModified: a.updated_at || a.published_at || undefined, publisher: { '@type': 'Organization', name: (GN.settings.brand || {}).name || 'GoNEST' } } });
    }
    if (window.GoNEST) GoNEST.fitBrand();
  }
  GN.onRender(render);
  GN.boot(function () {
    var q = slug ? GN.get('articles', { slug: slug }).then(function (r) { one = r[0] || null; }) : GN.get('articles', { limit: 50 }).then(function (r) { list = r; });
    return q.catch(function () { if (slug) one = null; else list = []; }).then(render);
  });
})();
