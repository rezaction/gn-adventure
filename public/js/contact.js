/* GoNEST — halaman kontak & booking: kirim ke kotak pesan admin (/api/message), tanpa layanan pihak ketiga. */
(function () {
  'use strict';
  var GN = window.GN, esc = GN.esc, t = GN.t, $ = GN.$;
  var q = function (k) { return (location.search.match(new RegExp('[?&]' + k + '=([^&]*)')) || [])[1]; };
  var kind = ({ ask: 'contact', booking: 'booking', vehicle: 'vehicle' })[q('kind')] || (q('package') ? 'booking' : q('vehicle') ? 'vehicle' : 'contact');
  var packages = [], vehicles = [], sent = null, err = '', busy = false;
  var form = { name: '', contact: '', body: '', package: decodeURIComponent(q('package') || ''), vehicle: decodeURIComponent(q('vehicle') || ''), from: '', to: '', pax: '', promo: decodeURIComponent(q('promo') || '').toUpperCase() };
  var TABS = [['contact', 'kAsk'], ['booking', 'kBook'], ['vehicle', 'kVeh']];

  function field(id, label, input, hint) { return '<div class="ff"><label for="' + id + '">' + esc(label) + (hint ? ' <small>(' + esc(hint) + ')</small>' : '') + '</label>' + input + '<p class="err" id="e-' + id + '" role="alert"></p></div>'; }
  function opts(list, val, name) { return '<option value="">' + esc(GN.s('choose')) + '</option>' + list.map(function (x) { var v = x.slug, l = name(x); return '<option value="' + esc(v) + '"' + (v === val ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join(''); }
  function read() { ['name', 'contact', 'body', 'package', 'vehicle', 'from', 'to', 'pax', 'promo'].forEach(function (k) { var e = $('#f-' + k); if (e) form[k] = e.value; }); }

  function info() {
    var c = GN.settings.contact || {}, rows = [];
    if (c.whatsapp) rows.push('<li><b>WhatsApp</b><a href="' + esc(GN.wa()) + '" target="_blank" rel="noopener">' + esc(c.phone || '+' + c.whatsapp) + '</a></li>');
    if (c.telegram) rows.push('<li><b>Telegram</b><a href="https://t.me/' + esc(c.telegram) + '" target="_blank" rel="noopener">@' + esc(c.telegram) + '</a></li>');
    if (c.email) rows.push('<li><b>Email</b><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></li>');
    if (t(c.address)) rows.push('<li><b>' + esc(GN.s('contact')) + '</b>' + (c.maps_url ? '<a href="' + esc(c.maps_url) + '" target="_blank" rel="noopener">' + esc(t(c.address)) + '</a>' : esc(t(c.address))) + '</li>');
    if (t(c.hours)) rows.push('<li><b>' + esc(GN.s('hours')) + '</b>' + esc(t(c.hours)) + '</li>');
    return '<aside class="card ct__info"><ul>' + rows.join('') + '</ul></aside>';
  }

  function waText() {
    var p = packages.filter(function (x) { return x.slug === form.package; })[0], v = vehicles.filter(function (x) { return x.slug === form.vehicle; })[0];
    return (kind === 'booking' && p ? GN.s('helloPk') + t(p.title) : kind === 'vehicle' && v ? GN.s('helloVhD') + v.name : GN.s('hello')) + (form.name ? ' - ' + form.name : '');
  }

  function render() {
    var root = $('#ct'); if (!root) return;
    if (sent) {
      root.innerHTML = '<div class="page-h"><h1>' + esc(GN.s('sentT')) + '</h1><p>' + esc(GN.s('sentP')) + (sent.promo ? ' ' + esc(GN.s('promoOk')) : '') + '</p></div><div class="hero__cta"><a class="btn btn--gold" href="' + esc(GN.wa(waText())) + '" target="_blank" rel="noopener">' + esc(GN.s('sentWa')) + '</a><button class="btn btn--ghost" type="button" id="again">' + esc(GN.s('another')) + '</button></div>';
      $('#again').onclick = function () { sent = null; form.body = ''; render(); }; return;
    }
    var today = new Date().toISOString().slice(0, 10);
    var extra = kind === 'booking' ? field('f-package', GN.s('fPkg'), '<select id="f-package">' + opts(packages, form.package, function (x) { return t(x.title); }) + '</select>', GN.s('optional')) +
        '<div class="ff2">' + field('f-from', GN.s('dFrom'), '<input id="f-from" type="date" min="' + today + '" value="' + esc(form.from) + '">', GN.s('optional')) + field('f-pax', GN.s('fPax'), '<input id="f-pax" type="number" min="1" max="200" inputmode="numeric" value="' + esc(form.pax) + '">', GN.s('optional')) + '</div>'
      : kind === 'vehicle' ? field('f-vehicle', GN.s('fVeh'), '<select id="f-vehicle">' + opts(vehicles, form.vehicle, function (x) { return x.name; }) + '</select>', GN.s('optional')) +
        '<div class="ff2">' + field('f-from', GN.s('dFrom'), '<input id="f-from" type="date" min="' + today + '" value="' + esc(form.from) + '">', GN.s('optional')) + field('f-to', GN.s('dTo'), '<input id="f-to" type="date" min="' + today + '" value="' + esc(form.to) + '">', GN.s('optional')) + '</div>' : '';
    root.innerHTML = '<div class="page-h"><h1>' + esc(GN.s('ctTitle')) + '</h1><p>' + esc(GN.s('ctLead')) + '</p></div><div class="ct">' +
      '<form class="card ct__form" id="cf" novalidate><div class="filters" role="group">' + TABS.map(function (x) { return '<button class="chip" type="button" data-k="' + x[0] + '" aria-pressed="' + (kind === x[0]) + '">' + esc(GN.s(x[1])) + '</button>'; }).join('') + '</div>' +
      field('f-name', GN.s('fName'), '<input id="f-name" autocomplete="name" maxlength="80" value="' + esc(form.name) + '">') +
      field('f-contact', GN.s('fContact'), '<input id="f-contact" autocomplete="email" maxlength="120" value="' + esc(form.contact) + '">') + extra +
      field('f-body', GN.s('fMsg'), '<textarea id="f-body" rows="4" maxlength="3000">' + esc(form.body) + '</textarea>', kind === 'contact' ? '' : GN.s('optional')) +
      field('f-promo', GN.s('fPromo'), '<input id="f-promo" maxlength="32" autocapitalize="characters" value="' + esc(form.promo) + '">', GN.s('optional')) +
      '<div class="hp" aria-hidden="true"><label>Website<input id="f-hp" tabindex="-1" autocomplete="off"></label></div>' +
      '<p class="err" id="e-form" role="alert">' + esc(err) + '</p><button class="btn btn--gold" type="submit"' + (busy ? ' disabled' : '') + '>' + esc(GN.s(busy ? 'sending' : 'send')) + '</button></form>' + info() + '</div>';
    [].forEach.call(root.querySelectorAll('[data-k]'), function (b) { b.onclick = function () { read(); kind = b.dataset.k; err = ''; render(); }; });
    $('#cf').onsubmit = submit;
    document.title = GN.s('ctTitle') + ' | ' + ((GN.settings.brand || {}).name || 'GoNEST');
    if (window.GoNEST) GoNEST.fitBrand();
  }
  function bad(id, msg) { var e = $('#e-' + id); if (e) e.textContent = msg; return false; }
  function submit(e) {
    e.preventDefault(); read(); err = ''; [].forEach.call(document.querySelectorAll('.ff .err'), function (x) { x.textContent = ''; });
    var ok = true, c = form.contact.trim(), isMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c), isPhone = /^\+?[\d\s().-]{8,20}$/.test(c);
    if (form.name.trim().length < 2) ok = bad('f-name', GN.s('needName'));
    if (!isMail && !isPhone) ok = bad('f-contact', GN.s('needContact'));
    var hasSel = kind === 'booking' ? form.package : kind === 'vehicle' ? form.vehicle : '';
    if (!form.body.trim() && !hasSel) ok = bad('f-body', GN.s('needMsg'));
    if (!ok) return;
    var p = packages.filter(function (x) { return x.slug === form.package; })[0], v = vehicles.filter(function (x) { return x.slug === form.vehicle; })[0];
    var payload = {}; if (p && kind === 'booking') payload.package = t(p.title); if (v && kind === 'vehicle') payload.vehicle = v.name;
    if (form.from) payload.from = form.from; if (form.to && kind === 'vehicle') payload.to = form.to; if (form.pax && kind === 'booking') payload.pax = +form.pax;
    var subject = kind === 'booking' ? (p ? 'Booking: ' + t(p.title) : 'Booking') : kind === 'vehicle' ? (v ? 'Sewa: ' + v.name : 'Sewa kendaraan') : null;
    var body = { kind: kind, name: form.name.trim(), contact: c, subject: subject, body: form.body.trim() || null, payload: payload, lang: GN.lang, hp: ($('#f-hp') || {}).value || '' };
    if (/^[A-Za-z0-9_-]{2,32}$/.test(form.promo.trim())) body.promo_code = form.promo.trim();
    busy = true; render();
    fetch('/api/message', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (j) { return { r: r, j: j }; }); }).then(function (x) {
      busy = false; if (x.j && x.j.ok) { sent = x.j; render(); } else { err = (x.j && x.j.error) || GN.s('sendErr'); render(); }
    }).catch(function () { busy = false; err = GN.s('sendErr'); render(); });
  }
  GN.noPopup = true; // jangan ganggu pengisian form dengan popup
  GN.onRender(function () { read(); render(); });
  GN.boot(function () {
    var s = function (p) { return p.catch(function () { return []; }); };
    return Promise.all([s(GN.get('packages')), s(GN.get('vehicles'))]).then(function (r) { packages = r[0]; vehicles = r[1]; render(); });
  });
})();
