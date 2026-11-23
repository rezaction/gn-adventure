/* GoNEST — galeri: satu sumber data, tiga tampilan.
   Desktop: indeks destinasi dengan pratinjau saat disorot. HP: chip kategori + strip geser. Semua: lightbox. */
(function () {
  'use strict';
  var GN = window.GN, esc = GN.esc, t = GN.t, $ = GN.$;
  var items = [], cat = 'all', hover = null;
  var catsOf = function () { var m = {}, o = []; items.forEach(function (g) { var c = g.category || 'umum'; if (!m[c]) { m[c] = []; o.push(c); } m[c].push(g); }); return { map: m, order: o }; };
  var shown = function () { return cat === 'all' ? items : items.filter(function (g) { return (g.category || 'umum') === cat; }); };

  function preview(g) {
    var p = $('#gpv'); if (!p || !g) return;
    p.innerHTML = '<img src="' + esc(GN.img(g.image)) + '" alt="" decoding="async">' + (t(g.title) ? '<span class="gpv__t">' + esc(t(g.title)) + '</span>' : '');
  }
  function render() {
    if (!$('#gl')) return;
    var C = catsOf(), cur = shown();
    if (!items.length) { $('#gl').innerHTML = '<div class="page-h"><h1>' + esc(GN.s('galTitle')) + '</h1></div><div class="empty"><p>' + esc(GN.s('empty')) + '</p></div>'; return; }
    var idx = '<ul class="gidx" aria-label="' + esc(GN.s('galTitle')) + '"><li><button type="button" data-c="all" aria-pressed="' + (cat === 'all') + '"><span>' + esc(GN.s('galAll')) + '</span><small>' + items.length + '</small></button></li>' +
      C.order.map(function (c) { return '<li><button type="button" data-c="' + esc(c) + '" aria-pressed="' + (cat === c) + '"><span>' + esc(c) + '</span><small>' + C.map[c].length + '</small></button></li>'; }).join('') + '</ul>';
    var chips = '<div class="filters gchips" role="group">' + ['all'].concat(C.order).map(function (c) { return '<button class="chip" type="button" data-c="' + esc(c) + '" aria-pressed="' + (cat === c) + '">' + esc(c === 'all' ? GN.s('galAll') : c) + '</button>'; }).join('') + '</div>';
    $('#gl').innerHTML = '<div class="page-h"><h1>' + esc(GN.s('galTitle')) + '</h1><p>' + esc(GN.s('galLead')) + '</p></div>' +
      '<div class="gl"><div class="gl__side">' + idx + '<div class="gpv" id="gpv" aria-hidden="true"></div></div><div class="gl__main">' + chips +
      '<div class="gstrip gstrip--page" id="gg">' + cur.map(function (g, n) {
        return '<figure><button type="button" data-n="' + n + '" aria-label="' + esc(GN.s('zoom') + ': ' + (t(g.title) || '')) + '"><img src="' + esc(GN.img(g.image)) + '" alt="' + esc(t(g.title)) + '" loading="lazy" decoding="async"></button>' + (t(g.title) ? '<figcaption>' + esc(t(g.title)) + '</figcaption>' : '') + '</figure>';
      }).join('') + '</div></div></div>';
    preview(hover || cur[0]);
    [].forEach.call(document.querySelectorAll('[data-c]'), function (b) {
      b.onclick = function () { cat = b.dataset.c; hover = null; render(); };
      var c = b.dataset.c, first = function () { var l = c === 'all' ? items : C.map[c]; hover = l[0]; preview(hover); };
      b.onmouseenter = first; b.onfocus = first;
    });
    [].forEach.call(document.querySelectorAll('#gg [data-n]'), function (b) { b.onclick = function () { GN.lightbox(GN.lightboxFrom(cur), +b.dataset.n, b); }; });
    document.title = GN.s('galTitle') + ' | ' + ((GN.settings.brand || {}).name || 'GoNEST');
    if (window.GoNEST) GoNEST.fitBrand();
  }
  GN.onRender(render);
  GN.boot(function () { return GN.get('gallery').catch(function () { return []; }).then(function (r) { items = r; render(); }); });
})();
