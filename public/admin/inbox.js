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
  }
  setInterval(function () { if (!document.hidden && A.me()) badge(); }, 60000);

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

  var V = window.GNAdminViews; V.inbox = function (id) { return id ? detail(id) : list(); }; V.badge = badge;
})();
