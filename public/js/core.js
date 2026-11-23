/* GoNEST — inti situs publik: bahasa, data, header, footer, chat, tema. Dipakai semua halaman. */
(function () {
  'use strict';
  var GN = window.GN = window.GN || {};
  var $ = GN.$ = function (s, r) { return (r || document).querySelector(s); };
  GN.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- bahasa ---------- */
  var lang = 'id';
  try { lang = (location.search.match(/[?&]lang=(id|en)/) || [])[1] || localStorage.getItem('gn_lang') || 'id'; } catch (e) {}
  if (lang !== 'id' && lang !== 'en') lang = 'id';
  GN.lang = lang;
  GN.t = function (v) { if (v == null) return ''; if (typeof v !== 'object') return String(v); return v[GN.lang] || v.id || v.en || ''; };
  var S = {
    id: { from: 'Mulai dari', days: 'hari', day: 'hari', detail: 'Lihat detail', ask: 'Tanya via WhatsApp', all: 'Semua', seats: 'kursi',
      available: 'Tersedia', limited: 'Terbatas', booked: 'Penuh', maintenance: 'Perawatan', availFrom: 'Tersedia mulai',
      open: 'Open trip', private: 'Private', family: 'Keluarga', custom: 'Custom', soonPk: 'Paket trip baru segera hadir. Tanyakan langsung ke admin untuk rencana perjalananmu.',
      soonVh: 'Daftar armada sedang diperbarui. Hubungi admin untuk cek ketersediaan.', menu: 'Menu', lang: 'Bahasa', chat: 'Chat dengan kami',
      hello: 'Halo GoNEST, saya ingin bertanya.', helloPk: 'Halo GoNEST, saya tertarik dengan paket: ', helloVh: 'Halo GoNEST, saya ingin cek ketersediaan: ',
      itinerary: 'Rencana perjalanan', included: 'Sudah termasuk', excluded: 'Belum termasuk', highlights: 'Sorotan', back: 'Semua paket',
      notFound: 'Paket tidak ditemukan.', pkTitle: 'Paket Trip', pkLead: 'Pilih jenis trip, lihat rincian biayanya, lalu tanya langsung ke admin.', day1: 'Hari', readMore: 'Baca selengkapnya', contact: 'Kontak', hours: 'Jam layanan', explore: 'Jelajahi', vhTitle: 'Armada & Sewa Kendaraan', vhLead: 'Pilih kendaraan, cek ketersediaan di tanggalmu, lalu tanya langsung ke admin.', check: 'Cek ketersediaan', dFrom: 'Tanggal mulai', dTo: 'Sampai (opsional)', okRange: 'Tersedia di tanggal itu', noRange: 'Tidak tersedia di tanggal itu', askVh: 'Tanya & pesan', badRange: 'Tanggal sampai tidak boleh sebelum tanggal mulai.', availErr: 'Gagal mengecek ketersediaan. Coba lagi.', helloVhD: 'Halo GoNEST, saya ingin sewa ',
      galTitle: 'Galeri Perjalanan', galLead: 'Momen dari perjalanan bersama GoNEST. Arahkan kursor ke nama destinasi untuk melihat cuplikan.', galAll: 'Semua', photos: 'foto', jrTitle: 'Jurnal', jrLead: 'Tips, rute, dan cerita perjalanan dari tim GoNEST.', jrBack: 'Semua artikel', jrEmpty: 'Artikel pertama segera terbit.', empty: 'Belum ada data.',
      promoTitle: 'Promo & kode', promoLead: 'Salin kodenya, lalu sebutkan saat memesan lewat admin.', soonPr: 'Belum ada promo aktif. Pantau terus.', claim: 'Klaim promo', copy: 'Salin kode', copied: 'Tersalin', close: 'Tutup', prev: 'Sebelumnya', next: 'Berikutnya', until: 'Berlaku sampai', terms: 'Syarat & ketentuan', off: 'Diskon', pctOff: '% off', helloPr: 'Halo GoNEST, saya ingin klaim promo ', zoom: 'Perbesar foto', read: 'Baca', },
    en: { from: 'From', days: 'days', day: 'day', detail: 'View details', ask: 'Ask on WhatsApp', all: 'All', seats: 'seats',
      available: 'Available', limited: 'Limited', booked: 'Booked', maintenance: 'Maintenance', availFrom: 'Available from',
      open: 'Open trip', private: 'Private', family: 'Family', custom: 'Custom', soonPk: 'New trip packages are coming soon. Ask our admin directly about your plans.',
      soonVh: 'Our fleet list is being updated. Contact our admin to check availability.', menu: 'Menu', lang: 'Language', chat: 'Chat with us',
      hello: 'Hello GoNEST, I would like to ask something.', helloPk: 'Hello GoNEST, I am interested in the package: ', helloVh: 'Hello GoNEST, I would like to check availability: ',
      itinerary: 'Itinerary', included: 'Included', excluded: 'Not included', highlights: 'Highlights', back: 'All trips',
      notFound: 'Package not found.', pkTitle: 'Trips', pkLead: 'Pick a trip type, see the cost breakdown, then ask our admin directly.', day1: 'Day', readMore: 'Read more', contact: 'Contact', hours: 'Service hours', explore: 'Explore', vhTitle: 'Fleet & Vehicle Rental', vhLead: 'Pick a vehicle, check availability for your dates, then ask our admin directly.', check: 'Check availability', dFrom: 'Start date', dTo: 'Until (optional)', okRange: 'Available on those dates', noRange: 'Not available on those dates', askVh: 'Ask & book', badRange: 'End date cannot be before start date.', availErr: 'Could not check availability. Please try again.', helloVhD: 'Hello GoNEST, I would like to rent ',
      galTitle: 'Travel Gallery', galLead: 'Moments from trips with GoNEST. Hover a destination name for a preview.', galAll: 'All', photos: 'photos', jrTitle: 'Journal', jrLead: 'Tips, routes and travel stories from the GoNEST team.', jrBack: 'All articles', jrEmpty: 'The first article is coming soon.', empty: 'Nothing here yet.',
      promoTitle: 'Promos & codes', promoLead: 'Copy the code and mention it when you book through our admin.', soonPr: 'No active promos right now. Check back soon.', claim: 'Claim promo', copy: 'Copy code', copied: 'Copied', close: 'Close', prev: 'Previous', next: 'Next', until: 'Valid until', terms: 'Terms & conditions', off: 'Discount', pctOff: '% off', helloPr: 'Hello GoNEST, I would like to claim the promo ', zoom: 'Enlarge photo', read: 'Read', }
  };
  GN.s = function (k) { return (S[GN.lang] && S[GN.lang][k]) || S.id[k] || k; };
  GN.money = function (n) { return n == null ? '' : 'Rp ' + new Intl.NumberFormat('id-ID').format(n); };
  GN.date = function (d) { try { return new Date(d).toLocaleDateString(GN.lang === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } };

  /* ---------- data ---------- */
  var cache = {};
  GN.get = function (name, params) {
    var q = params ? '?' + Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&') : '';
    var key = name + q;
    if (!cache[key]) cache[key] = fetch('/api/content/' + name + q).then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) throw new Error(j.error || 'gagal'); return j.data; });
    return cache[key].catch(function (e) { delete cache[key]; throw e; });
  };
  GN.img = function (p) { if (!p) return ''; return /^(https?:)?\/\//.test(p) || p.charAt(0) === '/' ? p : '/api/image/' + p.split('/').map(encodeURIComponent).join('/'); };

  /* Halaman yang sudah ada; tautan ke halaman lain sementara diarahkan ke bagian di beranda. */
  var LIVE = ['/', '/packages', '/vehicles', '/gallery', '/journal'];
  var FALLBACK = { '/destinations': '/gallery', '/contact': '/#kontak', '/booking': '/#kontak', '/faq': '/#kontak' };
  GN.href = function (h) {
    h = h || '#'; if (!/^\//.test(h)) return h;
    if (FALLBACK[h]) return FALLBACK[h];
    var p = h.split(/[?#]/)[0]; if (h.indexOf('#') < 0 && LIVE.indexOf(p.replace(/\/$/, '') || '/') < 0 && FALLBACK[p]) return FALLBACK[p];
    return h;
  };

  GN.settings = {};
  GN.wa = function (text) {
    var n = (GN.settings.contact || {}).whatsapp || '';
    return n ? 'https://wa.me/' + n.replace(/\D/g, '') + '?text=' + encodeURIComponent(text || GN.s('hello')) : '#kontak';
  };

  /* ---------- tema ---------- */
  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(function (v) { return Math.max(0, Math.min(255, Math.round(v * f))); });
    return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
  }
  function theme(th) {
    var p = (th && th.palette) || {}, r = document.documentElement.style, ok = function (v) { return /^#[0-9a-fA-F]{6}$/.test(v || ''); };
    if (ok(p.golden)) r.setProperty('--golden', p.golden);
    if (ok(p.ultramarine)) { r.setProperty('--ultra', p.ultramarine); r.setProperty('--ultra-text', shade(p.ultramarine, 0.66)); }
    if (ok(p.gray)) r.setProperty('--gray', p.gray);
    if (ok(p.black)) { r.setProperty('--ink', p.black); }
  }

  /* ---------- ikon ---------- */
  var IC = {
    chat: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.6A8 8 0 1 1 21 12z"/><path d="M9 11h6M9 14.5h3.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 0 1-11.7 7.1L4 20.2l1.2-4.1A8 8 0 1 1 20 12z"/><path d="M9.2 8.8c.3 2.7 2.6 5.2 5.9 6.1l1-1.4-2-1-.8.8c-.9-.4-1.8-1.3-2.2-2.3l.8-.7-.9-2.1z" fill="currentColor" stroke="none"/></svg>',
    tg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 3.5L2.8 10.7l5.6 2.1 2.2 6.6 3.1-3.9 4.4 3.3z"/><path d="M8.4 12.8l9.3-6.2"/></svg>',
    ok: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2.2 2.2L15.5 10"/></svg>',
    car: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16V11l2-5h12l2 5v5M3 16h18v3H3z"/><circle cx="7.5" cy="16" r="1.2"/><circle cx="16.5" cy="16" r="1.2"/></svg>',
    msg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>'
  };
  GN.icon = function (k) { return IC[k] || ''; };
  GN.placeholder = function () { return '<div class="ph" aria-hidden="true"><img src="/assets/logo-glyph.svg" alt=""></div>'; };

  /* ---------- header ---------- */
  var navBound = false;
  function buildHeader(st) {
    var host = $('#site-header'); if (!host) return;
    var br = st.brand || {}, nav = st.nav || {}, items = (nav.items || []).filter(function (i) { return i.visible !== false; });
    var tag = GN.t(br.tagline) || 'Tour & Transport';
    var links = items.map(function (i) { return '<a href="' + GN.esc(GN.href(i.href)) + '">' + GN.esc(GN.t(i.label)) + '</a>'; }).join('');
    var cta = nav.cta && GN.t(nav.cta.label) ? '<a class="btn btn--gold btn--sm" href="' + GN.esc(GN.href(nav.cta.href)) + '">' + GN.esc(GN.t(nav.cta.label)) + '</a>' : '';
    host.innerHTML =
      '<div class="wrap hd__in"><a class="brand" href="/" aria-label="' + GN.esc(br.name || 'GoNEST') + '"><img class="brand__mark" src="' + GN.esc(GN.img(br.logo) || '/assets/logo-mark.svg') + '" alt="" width="40" height="40"><span class="brand__txt"><span class="brand__name"><span class="go">' + GN.esc(br.go || 'Go') + '</span><span class="nest">' + GN.esc(br.nest || 'NEST') + '</span></span><span class="brand__tag">' + GN.esc(tag) + '</span></span></a>' +
      '<nav class="hd__nav" id="hd-nav" aria-label="' + GN.esc(GN.s('menu')) + '">' + links + '<span class="hd__cta-m">' + cta + '</span></nav>' +
      '<div class="hd__r"><div class="lang" role="group" aria-label="' + GN.esc(GN.s('lang')) + '"><button type="button" data-l="id" aria-pressed="' + (GN.lang === 'id') + '">ID</button><button type="button" data-l="en" aria-pressed="' + (GN.lang === 'en') + '">EN</button></div>' +
      '<span class="hd__cta-d">' + cta + '</span>' +
      '<button class="hd__burger" type="button" aria-expanded="false" aria-controls="hd-nav" aria-label="' + GN.esc(GN.s('menu')) + '"><span></span><span></span><span></span></button></div></div>';
    if (window.GoNEST) GoNEST.fitBrand(host);
    var b = $('.hd__burger', host), n = $('#hd-nav');
    b.onclick = function () { var o = n.classList.toggle('open'); b.setAttribute('aria-expanded', o); };
    n.onclick = function (e) { if (e.target.closest('a')) { n.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } };
    [].forEach.call(host.querySelectorAll('.lang button'), function (x) { x.onclick = function () { GN.setLang(x.dataset.l); }; });
    if (!navBound) { navBound = true; document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var n2 = $('#hd-nav'); if (n2) n2.classList.remove('open'); } }); }
  }

  /* ---------- footer ---------- */
  function buildFooter(st) {
    var host = $('#site-footer'); if (!host) return;
    var br = st.brand || {}, f = st.footer || {}, c = st.contact || {};
    var cols = (f.columns || []).map(function (col) {
      return '<div class="ft__col"><h3>' + GN.esc(GN.t(col.title)) + '</h3><ul>' + (col.links || []).map(function (l) { return '<li><a href="' + GN.esc(GN.href(l.href)) + '">' + GN.esc(GN.t(l.label)) + '</a></li>'; }).join('') + '</ul></div>';
    }).join('');
    var ct = [];
    if (c.whatsapp) ct.push('<li><a href="' + GN.esc(GN.wa()) + '" rel="noopener">WhatsApp ' + GN.esc(c.phone || '+' + c.whatsapp) + '</a></li>');
    if (c.telegram) ct.push('<li><a href="https://t.me/' + GN.esc(c.telegram) + '" rel="noopener">Telegram @' + GN.esc(c.telegram) + '</a></li>');
    if (c.email) ct.push('<li><a href="mailto:' + GN.esc(c.email) + '">' + GN.esc(c.email) + '</a></li>');
    if (c.instagram) ct.push('<li><a href="' + GN.esc(/^http/.test(c.instagram) ? c.instagram : 'https://instagram.com/' + c.instagram.replace(/^@/, '')) + '" rel="noopener">Instagram</a></li>');
    if (GN.t(c.address)) ct.push('<li>' + (c.maps_url ? '<a href="' + GN.esc(c.maps_url) + '" rel="noopener">' + GN.esc(GN.t(c.address)) + '</a>' : GN.esc(GN.t(c.address))) + '</li>');
    if (GN.t(c.hours)) ct.push('<li class="ft__hours">' + GN.esc(GN.t(c.hours)) + '</li>');
    host.innerHTML = '<div class="wrap"><div class="ft__top"><div class="ft__about"><a class="brand brand--light" href="/"><img class="brand__mark" src="' + GN.esc(GN.img(br.logo) || '/assets/logo-mark.svg') + '" alt="" width="40" height="40"><span class="brand__txt"><span class="brand__name"><span class="go">' + GN.esc(br.go || 'Go') + '</span><span class="nest">' + GN.esc(br.nest || 'NEST') + '</span></span><span class="brand__tag">' + GN.esc(GN.t(br.tagline) || 'Tour & Transport') + '</span></span></a><p>' + GN.esc(GN.t(f.about)) + '</p></div>' + cols +
      '<div class="ft__col" id="kontak-ft"><h3>' + GN.esc(GN.s('contact')) + '</h3><ul>' + ct.join('') + '</ul></div></div><div class="ft__bot"><span>&copy; ' + new Date().getFullYear() + ' ' + GN.esc(br.name || 'GoNEST') + '. ' + GN.esc(GN.t(f.copyright)) + '</span></div></div>';
    if (window.GoNEST) GoNEST.fitBrand(host);
  }

  /* ---------- chat: lingkaran yang mengembang jadi pil ---------- */
  function buildChat(st) {
    var host = $('#chat'); if (host) host.remove();
    var ch = st.chat || {}, c = st.contact || {}; if (ch.enabled === false) return;
    var pills = [];
    if (c.whatsapp && (!ch.whatsapp || ch.whatsapp.enabled !== false)) pills.push('<a class="chat__pill" href="' + GN.esc(GN.wa()) + '" target="_blank" rel="noopener"><span class="chat__ic">' + IC.wa + '</span><span class="chat__lb">' + GN.esc(GN.t(ch.whatsapp && ch.whatsapp.label) || 'WhatsApp') + '</span></a>');
    if (c.telegram && (!ch.telegram || ch.telegram.enabled !== false)) pills.push('<a class="chat__pill" href="https://t.me/' + GN.esc(c.telegram) + '" target="_blank" rel="noopener"><span class="chat__ic">' + IC.tg + '</span><span class="chat__lb">' + GN.esc(GN.t(ch.telegram && ch.telegram.label) || 'Telegram') + '</span></a>');
    if (!pills.length) return;
    var el = document.createElement('div'); el.id = 'chat'; el.className = 'chat';
    el.innerHTML = '<div class="chat__list" id="chat-list">' + pills.join('') + '</div><button class="chat__btn" type="button" aria-expanded="false" aria-controls="chat-list" aria-label="' + GN.esc(GN.s('chat')) + '"><span class="chat__i1">' + IC.chat + '</span><span class="chat__i2">' + IC.close + '</span></button>';
    document.body.appendChild(el);
    var btn = $('.chat__btn', el), set = function (o) { el.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); };
    btn.onclick = function (e) { e.stopPropagation(); set(!el.classList.contains('open')); };
    document.addEventListener('click', function (e) { if (!el.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  }

  /* ---------- siklus ---------- */
  var renders = [];
  GN.onRender = function (fn) { renders.push(fn); };
  GN.setLang = function (l) {
    GN.lang = l; try { localStorage.setItem('gn_lang', l); } catch (e) {}
    document.documentElement.lang = l; shell(); renders.forEach(function (f) { f(); });
  };
  function shell() { buildHeader(GN.settings); buildFooter(GN.settings); buildChat(GN.settings); }
  GN.boot = function (init) {
    document.documentElement.lang = GN.lang;
    buildHeader({}); 
    GN.get('settings').then(function (st) { return st; }, function (e) { GN.failed = e.message || 'gagal'; return {}; }).then(function (st) {
      GN.settings = st; theme(st.theme); shell();
      if (GN.ambient) GN.ambient((st.theme || {}).ambient);
      if (GN.failed) { var m = $('main'); if (m) { var b = document.createElement('div'); b.className = 'wrap'; b.innerHTML = '<div class="empty" role="alert" style="margin-top:24px"><p><b>Konten belum bisa dimuat.</b> ' + GN.esc(GN.failed) + '</p><button class="btn btn--gold btn--sm" type="button" onclick="location.reload()">Coba lagi</button></div>'; m.prepend(b); } }
      if (GN.promoPopup && !GN.failed) GN.get('promos').then(function (l) { GN.promoPopup(l, st.promo_popup); }, function () {});
      if (init) return init(st);
    });
  };
})();
