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
  GN.vhCard = function (v, o) {
    o = o || {};
    var note = t(v.status_note) || (v.available_from && v.status !== 'available' ? GN.s('availFrom') + ' ' + GN.date(v.available_from) : '');
    var rng = o.range ? '<span class="pill pill--' + (o.range.ok ? 'ok' : 'err') + '">' + esc(GN.s(o.range.ok ? 'okRange' : 'noRange')) + '</span>' : '';
    var msg = GN.s('helloVhD') + v.name + (o.range ? ' (' + o.range.text + ')' : '');
    return '<article class="card vc"><div class="vc__img">' + GN.cover(v.photo, v.name) + '</div><div><h3>' + esc(v.name) + '</h3>' +
      '<p class="vc__m">' + v.seats + ' ' + esc(GN.s('seats')) + (note ? ' &middot; ' + esc(note) : '') + '</p>' +
      '<div class="vc__f"><span class="pill pill--' + (VCLS[v.status] || 'ok') + '">' + esc(GN.s(v.status || 'available')) + '</span>' + rng +
      (v.price_from != null ? '<b>' + esc(GN.money(v.price_from)) + '</b>' : '') + '</div>' +
      (o.cta ? '<a class="btn btn--gold btn--sm vc__cta" href="' + esc(GN.wa(msg)) + '" target="_blank" rel="noopener">' + esc(GN.s('askVh')) + '</a>' : '') + '</div></article>';
  };
  GN.arCard = function (a) {
    var u = '/journal/?slug=' + encodeURIComponent(a.slug);
    return '<article class="card ar"><a class="ar__img" href="' + esc(u) + '" tabindex="-1" aria-hidden="true">' + GN.cover(a.cover, '') + '</a><div class="ar__b">' +
      (a.category ? '<span class="ar__c">' + esc(a.category) + '</span>' : '') + '<h3><a href="' + esc(u) + '">' + esc(t(a.title)) + '</a></h3><p>' + esc(t(a.excerpt)) + '</p></div></article>';
  };
  /* Markdown ringan yang aman: judul, tebal, miring, daftar, tautan, paragraf. Teks di-escape lebih dulu. */
  GN.md = function (src) {
    var inl = function (s) {
      return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, function (m, a, b) { return '<a href="' + b.replace(/"/g, '%22') + '" rel="noopener">' + a + '</a>'; });
    };
    return String(src || '').split(/\n{2,}/).map(function (b) {
      b = b.trim(); if (!b) return '';
      if (/^##\s/.test(b)) return '<h2>' + inl(b.replace(/^##\s+/, '')) + '</h2>';
      if (/^###\s/.test(b)) return '<h3>' + inl(b.replace(/^###\s+/, '')) + '</h3>';
      if (/^(-|\*)\s/.test(b)) return '<ul>' + b.split(/\n/).map(function (l) { return '<li>' + inl(l.replace(/^(-|\*)\s+/, '')) + '</li>'; }).join('') + '</ul>';
      return '<p>' + inl(b).replace(/\n/g, '<br>') + '</p>';
    }).join('');
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
