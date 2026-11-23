/* GoNEST — beranda: dirangkai dari tabel sections + data paket/kendaraan/galeri/artikel. */
(function () {
  'use strict';
  var GN = window.GN, esc = GN.esc, t = GN.t, $ = GN.$;
  var data = null;
  var ANCHOR = { 'home.packages': 'paket', 'home.vehicles': 'kendaraan', 'home.gallery': 'galeri', 'home.journal': 'jurnal', 'home.cta': 'kontak' };
  var TRUST_IC = ['ok', 'car', 'msg', 'star'];

  function hero(f) {
    var img = f.image ? '<img src="' + esc(GN.img(f.image)) + '" alt="' + esc(t(f.image_alt)) + '" fetchpriority="high" decoding="async">' : GN.placeholder();
    return '<section class="hero" id="atas"><div class="wrap hero__g"><div class="hero__t">' +
      (t(f.eyebrow) ? '<p class="eyebrow">' + esc(t(f.eyebrow)) + '</p>' : '') +
      '<h1>' + esc(t(f.heading)) + (t(f.heading2) ? '<span class="h2-b">' + esc(t(f.heading2)) + '</span>' : '') + '</h1>' +
      '<p class="hero__lead">' + esc(t(f.description)) + '</p><div class="hero__cta">' + GN.btn(f.cta1, 'btn--gold') + GN.btn(f.cta2, 'btn--ghost') + '</div></div>' +
      '<div class="hero__media">' + img + (t(f.image_text) ? '<span class="hero__cap">' + esc(t(f.image_text)) + '</span>' : '') + '</div></div></section>';
  }
  function trust(f) {
    var items = (f.items || []).map(function (i, n) {
      return '<div class="card"><span class="trust__ic">' + GN.icon(TRUST_IC[n % TRUST_IC.length]) + '</span><div><h3>' + esc(t(i.title)) + '</h3><p>' + esc(t(i.text)) + '</p></div></div>';
    }).join('');
    return '<section class="sec sec--tight"><div class="wrap">' + (t(f.heading) ? GN.head(f) : '') + '<div class="trust">' + items + '</div></div></section>';
  }
  function foot(f) { var b = GN.btn(f.cta1, 'btn--ghost') + GN.btn(f.cta2, 'btn--ghost'); return b ? '<div class="sec__foot">' + b + '</div>' : ''; }
  function emptyBox(msg, text) {
    return '<div class="empty"><p>' + esc(msg) + '</p><a class="btn btn--gold btn--sm" href="' + esc(GN.wa(text)) + '" target="_blank" rel="noopener">' + esc(GN.s('ask')) + '</a></div>';
  }
  function packages(f, id) {
    var list = (data.packages || []).slice(0, 6);
    return '<section class="sec" id="' + id + '"><div class="wrap">' + GN.head(f) + (list.length ? '<div class="strip">' + list.map(GN.pkCard).join('') + '</div>' : emptyBox(GN.s('soonPk'))) + foot(f) + '</div></section>';
  }
  function promos() {
    var list = (data.promos || []).slice(0, 4);
    return '<section class="sec" id="promo"><div class="wrap">' + GN.head({ eyebrow: GN.lang === 'en' ? 'Promo' : 'Promo', heading: GN.s('promoTitle'), description: GN.s('promoLead') }) +
      (list.length ? '<div class="strip">' + list.map(function (p) { return GN.promoCard(p); }).join('') + '</div>' : '<div class="empty"><p>' + esc(GN.s('soonPr')) + '</p></div>') + '</div></section>';
  }
  function vehicles(f, id) {
    var list = (data.vehicles || []).slice(0, 6);
    return '<section class="sec" id="' + id + '"><div class="wrap">' + GN.head(f) + (list.length ? '<div class="vh-grid">' + list.map(GN.vhCard).join('') + '</div>' : emptyBox(GN.s('soonVh'))) + foot(f) + '</div></section>';
  }
  function gallery(f, id) {
    var list = (data.gallery || []).slice(0, 12); if (!list.length) return '';
    return '<section class="sec" id="' + id + '"><div class="wrap">' + GN.head(f) + '<div class="gstrip">' + list.map(function (g) {
      return '<figure><button type="button" data-g="' + list.indexOf(g) + '" aria-label="' + esc(GN.s('zoom') + ': ' + (t(g.title) || '')) + '"><img src="' + esc(GN.img(g.image)) + '" alt="' + esc(t(g.title)) + '" loading="lazy" decoding="async"></button>' + (t(g.title) ? '<figcaption>' + esc(t(g.title)) + '</figcaption>' : '') + '</figure>';
    }).join('') + '</div>' + foot(f) + '</div></section>';
  }
  function journal(f, id) {
    var list = (data.articles || []).slice(0, 3); if (!list.length) return '';
    return '<section class="sec" id="' + id + '"><div class="wrap">' + GN.head(f) + '<div class="jr">' + list.map(GN.arCard).join('') + '</div>' + foot(f) + '</div></section>';
  }
  function cta(f, id) {
    return '<section class="sec" id="' + id + '"><div class="wrap"><div class="cta">' + (t(f.eyebrow) ? '<p class="eyebrow">' + esc(t(f.eyebrow)) + '</p>' : '') +
      '<h2>' + esc(t(f.heading)) + '</h2><p>' + esc(t(f.description)) + '</p><div class="cta__r">' + GN.btn(f.cta1, 'btn--gold') + GN.btn(f.cta2, 'btn--ghost') + '</div></div></div></section>';
  }
  var R = { 'home.hero': hero, 'home.trust': trust, 'home.packages': packages, 'home.vehicles': vehicles, 'home.gallery': gallery, 'home.journal': journal, 'home.cta': cta };

  function render() {
    if (!data) return;
    var html = '', qn = [];
    data.sections.forEach(function (s) {
      var fn = R[s.id]; if (!fn) return;
      var out = fn(s.fields || {}, ANCHOR[s.id]);
      if (out && ANCHOR[s.id]) qn.push({ id: ANCHOR[s.id], label: t((s.fields || {}).eyebrow) || t((s.fields || {}).heading) });
      html += out;
      if (s.id === 'home.packages') { html += promos(); qn.push({ id: 'promo', label: GN.s('promoTitle').split(' ')[0] }); }
    });
    $('#home').innerHTML = html;
    var q = $('#qnav'); q.innerHTML = '<div class="qnav__in">' + qn.filter(function (x) { return x.id !== 'kontak'; }).map(function (x) { return '<a href="#' + x.id + '">' + esc(x.label) + '</a>'; }).join('') + '</div>';
    q.hidden = !qn.length; watch(); GN.bindCopy($('#home'));
    [].forEach.call(document.querySelectorAll('#galeri [data-g]'), function (b) { b.onclick = function () { GN.lightbox(GN.lightboxFrom((data.gallery || []).slice(0, 12)), +b.dataset.g, b); }; });
    var h = (data.sections.filter(function (s) { return s.id === 'home.hero'; })[0] || {}).fields;
    if (h && t(h.heading)) document.title = (t(h.heading) + ' ' + (t(h.heading2) || '')).trim() + ' | ' + ((GN.settings.brand || {}).name || 'GoNEST');
    GN.seo({ title: document.title, description: t((h || {}).description), image: (h || {}).image, jsonld: GN.orgLd() });
    if (window.GoNEST) GoNEST.fitBrand();
  }
  var io;
  function watch() {
    if (io) io.disconnect(); if (!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        [].forEach.call(document.querySelectorAll('#qnav a'), function (a) {
          var on = a.getAttribute('href') === '#' + e.target.id; a.classList.toggle('on', on);
          if (on) { var box = a.parentNode; box.scrollTo({ left: a.offsetLeft - 24, behavior: 'smooth' }); }
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    [].forEach.call(document.querySelectorAll('section[id]'), function (s) { io.observe(s); });
  }

  GN.onRender(render);
  GN.boot(function () {
    var safe = function (p, d) { return p.catch(function () { return d; }); };
    return Promise.all([safe(GN.get('sections', { page: 'home' }), []), safe(GN.get('packages', { limit: 6 }), []), safe(GN.get('vehicles'), []), safe(GN.get('gallery'), []), safe(GN.get('articles', { limit: 3 }), []), safe(GN.get('promos'), [])])
      .then(function (r) { data = { sections: r[0], packages: r[1], vehicles: r[2], gallery: r[3], articles: r[4], promos: r[5] }; render(); });
  });
})();
