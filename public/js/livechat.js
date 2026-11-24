/* GoNEST — widget live chat pengunjung. Dimuat saat tombol "Live chat" ditekan pertama kali. */
(function () {
  'use strict';
  var GN = window.GN, KEY = 'gn_chat', T = {
    id: { title: 'Live chat GoNEST', name: 'Nama', contact: 'WhatsApp / email', contactOpt: 'WhatsApp / email (opsional)', msg: 'Tulis pesan…', send: 'Kirim', start: 'Mulai chat', close: 'Tutup', you: 'Kamu', admin: 'Admin', err: 'Gagal terhubung. Coba lagi.', closed: 'Percakapan ditutup oleh admin.', again: 'Mulai percakapan baru', online: 'Online', offline: 'Offline', sending: 'Mengirim…', welcome: 'Halo! Ada yang bisa kami bantu? Tulis pertanyaanmu, admin akan membalas di sini.', offlineMsg: 'Admin sedang tidak online. Tinggalkan nomor WhatsApp atau email, kami balas begitu kembali.' },
    en: { title: 'GoNEST live chat', name: 'Name', contact: 'WhatsApp / email', contactOpt: 'WhatsApp / email (optional)', msg: 'Write a message…', send: 'Send', start: 'Start chat', close: 'Close', you: 'You', admin: 'Admin', err: 'Could not connect. Please retry.', closed: 'This conversation was closed by our admin.', again: 'Start a new conversation', online: 'Online', offline: 'Offline', sending: 'Sending…', welcome: 'Hi! How can we help? Write your question and our admin will reply here.', offlineMsg: 'Our admin is offline. Leave your WhatsApp number or email and we will reply as soon as we are back.' }
  };
  var tx = function (k) { return (T[GN.lang] || T.id)[k]; };
  var esc = GN.esc, panel, timer, sess, seen = {}, cfg = {}, busy = false;
  var load = function () { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  var save = function (v) { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch (e) {} };
  var isOnline = function () {
    var h = +new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Jakarta' }).format(new Date()) % 24;
    var a = cfg.start_hour == null ? 8 : +cfg.start_hour, b = cfg.end_hour == null ? 21 : +cfg.end_hour;
    return h >= a && h < b;
  };
  var api = function (opt) {
    return fetch('/api/chat' + (opt.q || ''), opt.body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(opt.body) } : { cache: 'no-store' })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: tx('err') }; }); });
  };
  var hm = function (d) { try { return new Date(d).toLocaleTimeString(GN.lang === 'en' ? 'en-GB' : 'id-ID', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };

  function shell() {
    if (panel) return panel;
    panel = document.createElement('section'); panel.className = 'lc'; panel.id = 'livechat'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', tx('title'));
    document.body.appendChild(panel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('lc--on')) hide(); });
    return panel;
  }
  function head() {
    var on = isOnline();
    return '<header class="lc__h"><div><b>' + esc(tx('title')) + '</b><small><i class="lc__dot' + (on ? ' on' : '') + '"></i>' + esc(on ? tx('online') : tx('offline')) + '</small></div><button type="button" class="lc__x" aria-label="' + esc(tx('close')) + '">&times;</button></header>';
  }
  function bindClose() { panel.querySelector('.lc__x').onclick = hide; }
  function hide() { panel.classList.remove('lc--on'); clearTimeout(timer); }

  function form() {
    var on = isOnline();
    panel.innerHTML = head() + '<form class="lc__f" novalidate><p class="lc__note">' + esc(GN.t(on ? cfg.welcome : cfg.offline) || tx(on ? 'welcome' : 'offlineMsg')) + '</p>' +
      '<label>' + esc(tx('name')) + '<input name="name" autocomplete="name" maxlength="80" required></label>' +
      '<label>' + esc(on ? tx('contactOpt') : tx('contact')) + '<input name="contact" autocomplete="off" maxlength="120"' + (on ? '' : ' required') + '></label>' +
      '<label>' + esc(tx('msg').replace('…', '')) + '<textarea name="body" rows="3" maxlength="1000" required></textarea></label>' +
      '<input class="lc__hp" name="hp" tabindex="-1" autocomplete="off" aria-hidden="true"><p class="lc__err" role="alert" hidden></p><button class="btn btn--gold" type="submit">' + esc(tx('start')) + '</button></form>';
    bindClose();
    var f = panel.querySelector('form'), er = panel.querySelector('.lc__err');
    f.onsubmit = function (e) {
      e.preventDefault(); if (busy) return;
      var d = new FormData(f), b = { action: 'start', name: d.get('name'), contact: d.get('contact') || undefined, body: d.get('body'), hp: d.get('hp'), lang: GN.lang };
      if (!String(b.name).trim() || !String(b.body).trim() || (!on && !String(d.get('contact')).trim())) { er.hidden = false; er.textContent = GN.lang === 'en' ? 'Please fill in all required fields.' : 'Lengkapi kolom yang wajib diisi.'; return; }
      busy = true; er.hidden = true;
      api({ body: b }).then(function (r) {
        busy = false;
        if (!r.ok) { er.hidden = false; er.textContent = r.error || tx('err'); return; }
        sess = { id: r.id, token: r.token }; save(sess); seen = {}; convo();
      }).catch(function () { busy = false; er.hidden = false; er.textContent = tx('err'); });
    };
  }

  function convo() {
    panel.innerHTML = head() + '<div class="lc__log" aria-live="polite"></div><form class="lc__s"><input name="body" maxlength="1000" autocomplete="off" placeholder="' + esc(tx('msg')) + '" aria-label="' + esc(tx('msg')) + '"><button class="btn btn--gold btn--sm" type="submit">' + esc(tx('send')) + '</button></form>';
    bindClose();
    var log = panel.querySelector('.lc__log'), s = panel.querySelector('.lc__s'), idle = 0;
    function draw(msgs) {
      var added = false;
      msgs.forEach(function (m) {
        if (seen[m.id]) return; seen[m.id] = 1; added = true;
        var d = document.createElement('div'); d.className = 'lc__m lc__m--' + m.sender;
        d.innerHTML = '<span>' + esc(m.body).replace(/\n/g, '<br>') + '</span><small>' + esc(m.sender === 'staff' ? tx('admin') : tx('you')) + ' &middot; ' + esc(hm(m.created_at)) + '</small>';
        log.appendChild(d);
      });
      if (added) { log.scrollTop = log.scrollHeight; idle = 0; }
      else idle++;
    }
    function poll() {
      clearTimeout(timer);
      if (!panel.classList.contains('lc--on') || !sess) return;
      api({ q: '?id=' + encodeURIComponent(sess.id) + '&token=' + encodeURIComponent(sess.token) }).then(function (r) {
        if (!r.ok) { if (/tidak ditemukan/i.test(r.error || '')) { save(null); sess = null; form(); } return; }
        draw(r.messages || []);
        if (r.status === 'closed') { s.innerHTML = '<span class="lc__closed">' + esc(tx('closed')) + '</span> <button type="button" class="btn btn--ghost btn--sm">' + esc(tx('again')) + '</button>'; s.querySelector('button').onclick = function () { save(null); sess = null; form(); }; return; }
        timer = setTimeout(poll, document.hidden ? 20000 : Math.min(4000 + idle * 1000, 15000));
      }).catch(function () { timer = setTimeout(poll, 15000); });
    }
    s.onsubmit = function (e) {
      e.preventDefault(); var i = s.elements.body, v = i.value.trim(); if (!v || busy) return;
      busy = true; i.disabled = true;
      api({ body: { action: 'send', id: sess.id, token: sess.token, body: v } }).then(function (r) {
        busy = false; i.disabled = false;
        if (r.ok) { i.value = ''; poll(); } else { var n = document.createElement('p'); n.className = 'lc__err'; n.textContent = r.error || tx('err'); log.appendChild(n); log.scrollTop = log.scrollHeight; }
        i.focus();
      }).catch(function () { busy = false; i.disabled = false; });
    };
    poll();
  }

  window.GNLive = {
    open: function (c) {
      cfg = c || {}; shell(); sess = load(); panel.classList.add('lc--on');
      if (sess && sess.id) convo(); else form();
      var f = panel.querySelector('input:not(.lc__hp)'); if (f) f.focus();
    }
  };
})();
