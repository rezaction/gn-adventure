/* GoNEST — halaman paket: daftar dengan filter jenis, dan detail lewat /packages/?slug=... */
(function () {
  'use strict';
  var GN = window.GN, esc = GN.esc, t = GN.t, $ = GN.$;
  var list = null, one = undefined, kind = 'all';
  var slug = (location.search.match(/[?&]slug=([A-Za-z0-9_-]+)/) || [])[1];
  var li = function (arr, cls) { return '<ul class="' + cls + '">' + (arr || []).map(function (x) { return '<li>' + esc(t(x)) + '</li>'; }).join('') + '</ul>'; };

  function renderList() {
    var kinds = []; list.forEach(function (p) { if (kinds.indexOf(p.kind) < 0) kinds.push(p.kind); });
    var shown = list.filter(function (p) { return kind === 'all' || p.kind === kind; });
    var f = kinds.length > 1 ? '<div class="filters" role="group">' + ['all'].concat(kinds).map(function (k) {
      return '<button class="chip" type="button" data-k="' + k + '" aria-pressed="' + (k === kind) + '">' + esc(GN.s(k)) + '</button>';
    }).join('') + '</div>' : '';
    $('#pk').innerHTML = '<div class="page-h"><h1>' + esc(GN.s('pkTitle')) + '</h1><p>' + esc(GN.s('pkLead')) + '</p></div>' + f +
      (shown.length ? '<div class="pk-grid">' + shown.map(GN.pkCard).join('') + '</div>' :
        '<div class="empty"><p>' + esc(GN.s('soonPk')) + '</p><a class="btn btn--gold btn--sm" href="' + esc(GN.wa()) + '" target="_blank" rel="noopener">' + esc(GN.s('ask')) + '</a></div>');
    [].forEach.call(document.querySelectorAll('.filters .chip'), function (c) { c.onclick = function () { kind = c.dataset.k; renderList(); }; });
    document.title = GN.s('pkTitle') + ' | ' + ((GN.settings.brand || {}).name || 'GoNEST');
  }
  function renderOne() {
    var p = one;
    if (!p) { $('#pk').innerHTML = '<div class="page-h"><a class="crumb" href="/packages/">&larr; ' + esc(GN.s('back')) + '</a><h1>' + esc(GN.s('notFound')) + '</h1></div>'; return; }
    var d = p.duration_days || 1;
    var it = (p.itinerary || []).map(function (x, n) {
      return '<details class="it"' + (n === 0 ? ' open' : '') + '><summary><b>' + esc(GN.s('day1')) + ' ' + (n + 1) + '</b>' + esc(t(x.title)) + '</summary><div>' + esc(t(x.text)) + '</div></details>';
    }).join('');
    var msg = GN.s('helloPk') + t(p.title);
    $('#pk').innerHTML = '<div class="page-h"><a class="crumb" href="/packages/">&larr; ' + esc(GN.s('back')) + '</a></div><div class="dt"><div>' +
      '<div class="dt__cover">' + GN.cover(p.cover, t(p.title)) + '</div>' +
      '<p style="margin-top:18px"><span class="pill">' + esc(GN.s(p.kind || 'open')) + '</span> &nbsp; ' + d + ' ' + esc(GN.s(d > 1 ? 'days' : 'day')) + '</p>' +
      '<h1>' + esc(t(p.title)) + '</h1><p>' + esc(t(p.summary)) + '</p>' +
      ((p.highlights || []).length ? '<h2>' + esc(GN.s('highlights')) + '</h2>' + li(p.highlights, 'ul-ok') : '') +
      (it ? '<h2>' + esc(GN.s('itinerary')) + '</h2>' + it : '') +
      ((p.included || []).length ? '<h2>' + esc(GN.s('included')) + '</h2>' + li(p.included, 'ul-ok') : '') +
      ((p.excluded || []).length ? '<h2>' + esc(GN.s('excluded')) + '</h2>' + li(p.excluded, 'ul-no') : '') +
      '</div><aside class="card dt__side"><div class="price">' + (p.price_from != null ? '<small>' + esc(GN.s('from')) + '</small><b>' + esc(GN.money(p.price_from)) + '</b>' : '') + '</div>' +
      (t(p.price_note) ? '<p style="margin:0;color:var(--muted);font-size:.9rem">' + esc(t(p.price_note)) + '</p>' : '') +
      '<a class="btn btn--gold" href="' + esc(GN.wa(msg)) + '" target="_blank" rel="noopener">' + esc(GN.s('ask')) + '</a><a class="btn btn--ghost" href="/contact/?package=' + encodeURIComponent(p.slug) + '">' + esc(GN.s('bookPk')) + '</a></aside></div>';
    document.title = t(p.title) + ' | ' + ((GN.settings.brand || {}).name || 'GoNEST');
    GN.seo({ title: document.title, description: t(p.summary).slice(0, 155), image: p.cover, type: 'product', jsonld: { '@context': 'https://schema.org', '@type': 'TouristTrip', name: t(p.title), description: t(p.summary), image: p.cover ? location.origin + GN.img(p.cover) : undefined, touristType: p.kind,
      provider: { '@type': 'TravelAgency', name: (GN.settings.brand || {}).name || 'GoNEST' }, offers: p.price_from != null ? { '@type': 'Offer', priceCurrency: 'IDR', price: p.price_from, availability: 'https://schema.org/InStock', url: location.href } : undefined } });
  }
  function render() { if (slug) { if (one !== undefined) renderOne(); } else if (list) renderList(); if (window.GoNEST) GoNEST.fitBrand(); }
  GN.onRender(render);
  GN.boot(function () {
    var q = slug ? GN.get('packages', { slug: slug }).then(function (r) { one = r[0] || null; }) : GN.get('packages').then(function (r) { list = r; });
    return q.catch(function () { if (slug) one = null; else list = []; }).then(render);
  });
})();
