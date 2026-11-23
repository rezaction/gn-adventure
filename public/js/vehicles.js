/* GoNEST — halaman kendaraan: daftar armada + cek ketersediaan per tanggal. */
(function () {
  'use strict';
  var GN = window.GN, esc = GN.esc, $ = GN.$;
  var list = [], range = null, err = '', busy = false, from = '', to = '';
  var iso = function (d) { var x = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return x.toISOString().slice(0, 10); };

  function render() {
    if (!$('#vh')) return;
    var today = iso(new Date());
    $('#vh').innerHTML = '<div class="page-h"><h1>' + esc(GN.s('vhTitle')) + '</h1><p>' + esc(GN.s('vhLead')) + '</p></div>' +
      '<form class="avail card" id="av" novalidate><div><label for="d1">' + esc(GN.s('dFrom')) + '</label><input id="d1" type="date" min="' + today + '" value="' + esc(from) + '" required></div>' +
      '<div><label for="d2">' + esc(GN.s('dTo')) + '</label><input id="d2" type="date" min="' + today + '" value="' + esc(to) + '"></div>' +
      '<button class="btn btn--gold" type="submit"' + (busy ? ' disabled' : '') + '>' + esc(GN.s('check')) + '</button></form><p class="err" id="averr" role="alert">' + esc(err) + '</p>' +
      (list.length ? '<div class="vh-grid vh-grid--page">' + list.map(function (v) {
        var o = { cta: true }; if (range) { o.range = { ok: !!range.map[v.id], text: range.text }; } return GN.vhCard(v, o);
      }).join('') + '</div>' : '<div class="empty"><p>' + esc(GN.s('soonVh')) + '</p><a class="btn btn--gold btn--sm" href="' + esc(GN.wa()) + '" target="_blank" rel="noopener">' + esc(GN.s('ask')) + '</a></div>');
    $('#av').onsubmit = function (e) {
      e.preventDefault(); from = $('#d1').value; to = $('#d2').value; err = '';
      if (!from) { err = GN.s('dFrom'); render(); return; }
      if (to && to < from) { err = GN.s('badRange'); render(); return; }
      busy = true; render();
      fetch('/api/availability?from=' + from + (to ? '&to=' + to : '')).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.ok) throw new Error(); var m = {}; (j.data || []).forEach(function (x) { m[x.vehicle_id] = x.available; });
        range = { map: m, text: GN.date(from) + (to && to !== from ? ' - ' + GN.date(to) : '') };
      }).catch(function () { err = GN.s('availErr'); }).then(function () { busy = false; render(); });
    };
    document.title = GN.s('vhTitle') + ' | ' + ((GN.settings.brand || {}).name || 'GoNEST');
    if (window.GoNEST) GoNEST.fitBrand();
  }
  GN.onRender(render);
  GN.boot(function () { return GN.get('vehicles').catch(function () { return []; }).then(function (r) { list = r; render(); }); });
})();
