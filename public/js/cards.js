/* GoNEST — potongan tampilan yang dipakai beberapa halaman (kartu paket, kendaraan, artikel). */
(function () {
  'use strict';
  var GN = window.GN, esc = GN.esc, t = GN.t;
  var KIND = { open: 'open', private: 'private', family: 'family', custom: 'custom' };

  GN.cover = function (path, alt, cls) {
    return path ? '<img class="cv ' + (cls || '') + '" src="' + esc(GN.img(path)) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async">' : GN.placeholder();
  };
  GN.pkUrl = function (p) { return '/packages/?slug=' + encodeURIComponent(p.slug); };
  GN.pkCard = function (p) {
    var d = p.duration_days || 1;
    return '<article class="card pk"><a class="pk__img" href="' + esc(GN.pkUrl(p)) + '" tabindex="-1" aria-hidden="true">' + GN.cover(p.cover, '') + '</a><div class="pk__b">' +
      '<div class="pk__meta"><span class="pill">' + esc(GN.s(KIND[p.kind] || 'open')) + '</span><span>' + d + ' ' + esc(GN.s(d > 1 ? 'days' : 'day')) + '</span></div>' +
      '<h3><a href="' + esc(GN.pkUrl(p)) + '">' + esc(t(p.title)) + '</a></h3><p>' + esc(t(p.summary)) + '</p>' +
      '<div class="pk__f"><div class="price">' + (p.price_from != null ? '<small>' + esc(GN.s('from')) + '</small><b>' + esc(GN.money(p.price_from)) + '</b>' : '') + '</div>' +
      '<a class="btn btn--ghost btn--sm" href="' + esc(GN.pkUrl(p)) + '">' + esc(GN.s('detail')) + '</a></div></div></article>';
  };
  var VCLS = { available: 'ok', limited: 'warn', booked: 'err', maintenance: 'err' };
  GN.vhCard = function (v) {
    var note = t(v.status_note) || (v.available_from && v.status !== 'available' ? GN.s('availFrom') + ' ' + GN.date(v.available_from) : '');
    return '<article class="card vc"><div class="vc__img">' + GN.cover(v.photo, v.name) + '</div><div><h3>' + esc(v.name) + '</h3>' +
      '<p class="vc__m">' + v.seats + ' ' + esc(GN.s('seats')) + (note ? ' &middot; ' + esc(note) : '') + '</p>' +
      '<div class="vc__f"><span class="pill pill--' + (VCLS[v.status] || 'ok') + '">' + esc(GN.s(v.status || 'available')) + '</span>' +
      (v.price_from != null ? '<b>' + esc(GN.money(v.price_from)) + '</b>' : '') + '</div></div></article>';
  };
  GN.arCard = function (a) {
    return '<article class="card ar"><div class="ar__img">' + GN.cover(a.cover, '') + '</div><div class="ar__b">' +
      (a.category ? '<span class="ar__c">' + esc(a.category) + '</span>' : '') + '<h3>' + esc(t(a.title)) + '</h3><p>' + esc(t(a.excerpt)) + '</p></div></article>';
  };
  GN.head = function (f, light) {
    f = f || {};
    return '<div class="sec-head">' + (t(f.eyebrow) ? '<p class="eyebrow">' + esc(t(f.eyebrow)) + '</p>' : '') +
      '<h2>' + esc(t(f.heading)) + (t(f.heading2) ? '<span class="h2-b">' + esc(t(f.heading2)) + '</span>' : '') + '</h2>' +
      (t(f.description) ? '<p>' + esc(t(f.description)) + '</p>' : '') + '</div>';
  };
  GN.btn = function (c, cls) {
    if (!c || !t(c.label)) return '';
    return '<a class="btn ' + (cls || '') + '" href="' + esc(GN.href(c.href)) + '">' + esc(t(c.label)) + '</a>';
  };
})();
