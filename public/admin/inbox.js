/* GoNEST Admin — kotak masuk pesan (kontak, booking, sewa kendaraan). Tanpa layanan pihak ketiga. */
(function () {
  'use strict';
  var A = window.GNAdmin, esc = A.esc, $ = A.$;
  var ST = { new: 'Baru', replied: 'Dibalas', done: 'Selesai', spam: 'Spam' }, KIND = { contact: 'Pertanyaan', booking: 'Booking trip', vehicle: 'Sewa kendaraan' };
  var PAY = { package: 'Paket', vehicle: 'Kendaraan', from: 'Tanggal mulai', to: 'Tanggal selesai', pax: 'Peserta' };
  var filter = 'new';
  var when = function (d) { try { return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return d; } };
  var digits = function (c) { var d = String(c || '').replace(/\D/g, ''); if (d.charAt(0) === '0') d = '62' + d.slice(1); return d; };
  var isMail = function (c) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c || ''); };

  async function badge() {
    var a = $('#nav a[href="#/pesan"]'); if (!a) return;
    var r = await A.sb().from('messages').select('id', { count: 'exact', head: true }).eq('status', 'new');
    var b = a.querySelector('.badge'); if (b) b.remove();
    if (!r.error && r.count > 0) { var s = document.createElement('span'); s.className = 'badge'; s.textContent = r.count > 99 ? '99+' : r.count; s.setAttribute('aria-label', r.count + ' pesan baru'); a.appendChild(s); }
    var c = $('#nav a[href="#/chat"]'); if (!c) return;
    var q = await A.sb().from('chat_threads').select('id', { count: 'exact', head: true }).gt('unread_staff', 0);
    var cb = c.querySelector('.badge'); if (cb) cb.remove();
    if (!q.error && q.count > 0) { var t = document.createElement('span'); t.className = 'badge'; t.textContent = q.count > 99 ? '99+' : q.count; t.setAttribute('aria-label', q.count + ' chat belum dibaca'); c.appendChild(t); }
  }
  setInterval(function () { if (!document.hidden && A.me()) badge(); }, 20000);

  async function list() {
    var v = $('#view'), sb = A.sb();
    v.innerHTML = '<h1>Kotak masuk</h1><div class="filters" id="fl" role="group"></div><div id="rows" class="rows"><p class="muted">Memuat…</p></div>';
    $('#fl').innerHTML = [['new', 'Baru'], ['replied', 'Dibalas'], ['done', 'Selesai'], ['spam', 'Spam'], ['all', 'Semua']].map(function (x) { return '<button class="chip" type="button" data-s="' + x[0] + '" aria-pressed="' + (filter === x[0]) + '">' + x[1] + '</button>'; }).join('');
    [].forEach.call(document.querySelectorAll('#fl .chip'), function (c) { c.onclick = function () { filter = c.dataset.s; list(); }; });
    var q = sb.from('messages').select('*').order('created_at', { ascending: false }); if (filter !== 'all') q = q.eq('status', filter);
    var r = await q; if (r.error) { $('#rows').innerHTML = '<p class="err">' + esc(r.error.message) + '</p>'; return; }
    $('#rows').innerHTML = (r.data || []).map(function (m) {
      return '<a class="card row msg" href="#/pesan/' + m.id + '"><span class="c0"><b>' + esc(m.name) + '</b><small>' + esc(KIND[m.kind] || m.kind) + (m.subject ? ' &middot; ' + esc(m.subject) : '') + '</small></span><span class="c1">' + esc(when(m.created_at)) + '</span><span class="c2"><span class="pill ' + (m.status === 'new' ? 'pill--ok' : '') + '">' + esc(ST[m.status] || m.status) + '</span>' + (m.promo_code ? ' <span class="pill">' + esc(m.promo_code) + '</span>' : '') + '</span></a>';
    }).join('') || '<div class="empty"><p>Tidak ada pesan di kategori ini.</p></div>';
    badge();
  }

  async function detail(id) {
    var v = $('#view'), sb = A.sb(), q = await sb.from('messages').select('*').eq('id', id).single();
    if (q.error || !q.data) { v.innerHTML = '<p class="err">Pesan tidak ditemukan.</p><a href="#/pesan">&larr; Kembali</a>'; return; }
    var m = q.data, pay = m.payload || {};
    var rows = Object.keys(pay).map(function (k) { return '<dt>' + esc(PAY[k] || k) + '</dt><dd>' + esc(pay[k]) + '</dd>'; }).join('');
    var wa = digits(m.contact), reply = [];
    if (isMail(m.contact)) reply.push('<a class="btn btn--gold" href="mailto:' + esc(m.contact) + '?subject=' + encodeURIComponent('Re: ' + (m.subject || 'Pesan Anda di GoNEST')) + '">Balas lewat email</a>');
    else if (wa.length >= 9) reply.push('<a class="btn btn--gold" target="_blank" rel="noopener" href="https://wa.me/' + wa + '?text=' + encodeURIComponent('Halo ' + m.name + ', terima kasih sudah menghubungi GoNEST. ') + '">Balas lewat WhatsApp</a>');
    v.innerHTML = '<a class="crumb" href="#/pesan">&larr; Kotak masuk</a><h1>' + esc(m.name) + '</h1><div class="card msgd"><p class="muted">' + esc(KIND[m.kind] || m.kind) + ' &middot; ' + esc(when(m.created_at)) + ' &middot; bahasa ' + esc((m.lang || 'id').toUpperCase()) + '</p>' +
      '<dl><dt>Kontak</dt><dd>' + esc(m.contact) + '</dd>' + (m.subject ? '<dt>Subjek</dt><dd>' + esc(m.subject) + '</dd>' : '') + rows + (m.promo_code ? '<dt>Kode promo</dt><dd><b>' + esc(m.promo_code) + '</b></dd>' : '') + '</dl>' +
      (m.body ? '<h3 class="gt">Pesan</h3><p class="msgb">' + esc(m.body) + '</p>' : '') +
      '<div class="msgact">' + reply.join('') + '</div><h3 class="gt">Status</h3><div class="filters" id="sts"></div>' +
      '<div class="fld"><label for="note">Catatan internal (tidak terlihat pengunjung)</label><textarea id="note" rows="3">' + esc(m.note || '') + '</textarea></div><button class="btn btn--ghost btn--sm" id="sn" type="button">Simpan catatan</button> <button class="btn btn--ghost btn--sm btn--danger-o" id="dl" type="button">Hapus pesan</button></div>';
    $('#sts').innerHTML = Object.keys(ST).map(function (k) { return '<button class="chip" type="button" data-s="' + k + '" aria-pressed="' + (m.status === k) + '">' + ST[k] + '</button>'; }).join('');
    var upd = async function (patch, ok) {
      var u = await sb.from('messages').update(Object.assign({ handled_by: A.me().id, handled_at: new Date().toISOString() }, patch)).eq('id', id);
      if (u.error) A.toast(u.error.message, true); else { A.toast(ok); detail(id); badge(); }
    };
    [].forEach.call(document.querySelectorAll('#sts .chip'), function (c) { c.onclick = function () { upd({ status: c.dataset.s }, 'Status: ' + ST[c.dataset.s]); }; });
    $('#sn').onclick = function () { upd({ note: $('#note').value.trim() || null }, 'Catatan tersimpan'); };
    $('#dl').onclick = async function () { if (!confirm('Hapus pesan ini permanen?')) return; var d = await sb.from('messages').delete().eq('id', id); if (d.error) A.toast(d.error.message, true); else { A.toast('Dihapus'); location.hash = '#/pesan'; } };
  }


  /* ---------- Live chat ---------- */
  var poll = null;
  function stop() { if (poll) { clearInterval(poll); poll = null; } }
  window.addEventListener('hashchange', function () { if (!/^#\/chat/.test(location.hash)) stop(); });

  async function chatList() {
    stop();
    var v = $('#view'), sb = A.sb(), shown = '';
    v.innerHTML = '<h1>Live chat</h1><p class="muted">Percakapan dari tombol Live chat di situs. Halaman ini memuat ulang sendiri tiap beberapa detik.</p><div id="rows" class="rows"><p class="muted">Memuat…</p></div>';
    async function load() {
      var r = await sb.from('chat_threads').select('*').order('last_msg_at', { ascending: false }).limit(60);
      if (r.error) { $('#rows').innerHTML = '<p class="err">' + esc(r.error.message) + '</p>'; return; }
      var html = (r.data || []).map(function (t) {
        return '<a class="card row msg" href="#/chat/' + t.id + '"><span class="c0"><b>' + esc(t.name) + '</b><small>' + esc(t.last_text || '') + '</small></span><span class="c1">' + esc(when(t.last_msg_at)) + '</span><span class="c2">' + (t.unread_staff > 0 ? '<span class="pill pill--ok">' + t.unread_staff + ' baru</span>' : '') + (t.status === 'closed' ? ' <span class="pill">Ditutup</span>' : '') + '</span></a>';
      }).join('') || '<div class="empty"><p>Belum ada percakapan.</p></div>';
      if (html !== shown && $('#rows')) { shown = html; $('#rows').innerHTML = html; }
      badge();
    }
    await load(); poll = setInterval(function () { if (!document.hidden && /^#\/chat$/.test(location.hash)) load(); }, 5000);
  }

  async function chatThread(id) {
    stop();
    var v = $('#view'), sb = A.sb(), seenIds = {}, t0 = await sb.from('chat_threads').select('*').eq('id', id).single();
    if (t0.error || !t0.data) { v.innerHTML = '<p class="err">Percakapan tidak ditemukan.</p><a href="#/chat">&larr; Kembali</a>'; return; }
    var t = t0.data, wa = digits(t.contact), ext = [];
    if (isMail(t.contact)) ext.push('<a class="btn btn--ghost btn--sm" href="mailto:' + esc(t.contact) + '">Email pengunjung</a>');
    else if (wa.length >= 9) ext.push('<a class="btn btn--ghost btn--sm" target="_blank" rel="noopener" href="https://wa.me/' + wa + '">WhatsApp pengunjung</a>');
    v.innerHTML = '<a class="crumb" href="#/chat">&larr; Live chat</a><h1>' + esc(t.name) + '</h1><div class="card"><p class="muted">Mulai ' + esc(when(t.created_at)) + ' &middot; bahasa ' + esc((t.lang || 'id').toUpperCase()) + (t.contact ? ' &middot; ' + esc(t.contact) : '') + '</p><div class="msgact">' + ext.join(' ') + ' <button class="btn btn--ghost btn--sm" id="cl" type="button"></button></div>' +
      '<div class="lcl" id="lcl" aria-live="polite"></div><form id="lcf" class="lcf"><input id="lct" maxlength="2000" autocomplete="off" placeholder="Tulis balasan…" aria-label="Balasan"><button class="btn btn--gold btn--sm" type="submit">Kirim</button></form></div>';
    var log = $('#lcl'), closed = t.status === 'closed';
    var setClosed = function () { $('#cl').textContent = closed ? 'Buka kembali' : 'Tutup percakapan'; $('#lcf').style.display = closed ? 'none' : ''; };
    setClosed();
    async function load() {
      var r = await sb.from('chat_messages').select('*').eq('thread_id', id).order('created_at', { ascending: true }); if (r.error) return;
      var add = false;
      (r.data || []).forEach(function (m) { if (seenIds[m.id]) return; seenIds[m.id] = 1; add = true; var d = document.createElement('div'); d.className = 'lcm lcm--' + m.sender; d.innerHTML = '<span>' + esc(m.body).replace(/\n/g, '<br>') + '</span><small>' + (m.sender === 'staff' ? 'Admin' : esc(t.name)) + ' &middot; ' + esc(when(m.created_at)) + '</small>'; log.appendChild(d); });
      if (add) log.scrollTop = log.scrollHeight;
      if (add || t.unread_staff) { var u = await sb.from('chat_threads').update({ unread_staff: 0 }).eq('id', id); if (!u.error) { t.unread_staff = 0; badge(); } }
    }
    await load();
    poll = setInterval(function () { if (!document.hidden && location.hash === '#/chat/' + id) load(); }, 4000);
    $('#lcf').onsubmit = async function (e) {
      e.preventDefault(); var i = $('#lct'), body = i.value.trim(); if (!body) return; i.disabled = true;
      var r = await sb.from('chat_messages').insert({ thread_id: id, sender: 'staff', body: body, staff_id: A.me().id });
      if (r.error) A.toast(r.error.message, true);
      else { i.value = ''; await sb.from('chat_threads').update({ last_msg_at: new Date().toISOString(), last_text: body.slice(0, 120), unread_staff: 0 }).eq('id', id); await load(); }
      i.disabled = false; i.focus();
    };
    $('#cl').onclick = async function () { var u = await sb.from('chat_threads').update({ status: closed ? 'open' : 'closed' }).eq('id', id); if (u.error) A.toast(u.error.message, true); else { closed = !closed; setClosed(); A.toast(closed ? 'Percakapan ditutup' : 'Percakapan dibuka'); } };
  }

  var V = window.GNAdminViews; V.chat = function (id) { return id ? chatThread(id) : chatList(); }; V.inbox = function (id) { return id ? detail(id) : list(); }; V.badge = badge;
})();
