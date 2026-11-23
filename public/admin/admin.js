/* GoNEST Admin — Tahap 1: login 2 peran, ringkasan, pengguna, akun. Modul lain menyusul (Tahap 2-4). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var sb = null, me = null;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  function toast(msg, bad) {
    var t = $('#toast'); t.textContent = msg; t.className = 'toast on' + (bad ? ' bad' : '');
    clearTimeout(toast.x); toast.x = setTimeout(function () { t.className = 'toast'; }, 3200);
  }
  function show(id) { ['boot', 'login', 'app'].forEach(function (k) { $('#' + k).hidden = k !== id; }); }

  async function token() {
    var r = await sb.auth.getSession();
    return r.data.session ? r.data.session.access_token : null;
  }
  async function api(path, opts) {
    opts = opts || {};
    var t = await token();
    var res = await fetch(path, {
      method: opts.method || 'GET',
      headers: Object.assign({ authorization: 'Bearer ' + t }, opts.body ? { 'content-type': 'application/json' } : {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    var j = null; try { j = await res.json(); } catch (e) { /* kosong */ }
    if (!res.ok || !j || j.ok === false) throw new Error((j && j.error) || 'Permintaan gagal (' + res.status + ')');
    return j;
  }

  /* ---------- menu ---------- */
  function navItems() {
    var owner = me.role === 'owner';
    var a = [{ h: '#/ringkasan', t: 'Ringkasan' }];
    if (owner) a.push({ g: 'Tampilan (Owner)' }, { h: '#/section', t: 'Section & teks' }, { h: '#/pengaturan', t: 'Pengaturan situs' });
    a.push({ g: 'Konten' }, { t: 'Paket trip', soon: 'T3' }, { t: 'Kendaraan', soon: 'T3' }, { t: 'Promo & kode', soon: 'T3' }, { t: 'Artikel', soon: 'T3' }, { t: 'Galeri', soon: 'T3' });
    a.push({ g: 'Komunikasi' }, { t: 'Kotak pesan', soon: 'T4' });
    a.push({ g: 'Sistem' });
    if (owner) a.push({ h: '#/pengguna', t: 'Pengguna' });
    a.push({ h: '#/akun', t: 'Akun saya' });
    return a;
  }
  function renderNav() {
    var cur = (location.hash || '#/ringkasan').split('/').slice(0, 2).join('/');
    $('#nav').innerHTML = navItems().map(function (i) {
      if (i.g) return '<h4>' + esc(i.g) + '</h4>';
      if (i.soon) return '<a class="soon" aria-disabled="true">' + esc(i.t) + '<small>Tahap ' + esc(i.soon.slice(1)) + '</small></a>';
      return '<a href="' + i.h + '"' + (cur === i.h ? ' aria-current="page"' : '') + '>' + esc(i.t) + '</a>';
    }).join('');
  }

  /* ---------- halaman ---------- */
  async function viewHome() {
    var v = $('#view');
    v.innerHTML = '<h1>Ringkasan</h1><p class="muted">Halo, ' + esc(me.name || me.email) + '. Kamu masuk sebagai <b>' + (me.role === 'owner' ? 'Owner' : 'Admin umum') + '</b>.</p><div class="grid" id="stats"></div><div class="note">Tahap 1 aktif: login, peran, dan manajemen pengguna. Editor konten dan tampilan menyusul di tahap berikutnya.</div>';
    var items = [['articles', 'Artikel'], ['packages', 'Paket trip'], ['vehicles', 'Kendaraan'], ['promos', 'Promo'], ['messages', 'Pesan masuk']];
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var r = await sb.from(items[i][0]).select('id', { count: 'exact', head: true });
      html += '<div class="card stat"><b>' + (r.error ? '–' : r.count) + '</b><span>' + items[i][1] + (r.error ? ' (gagal dibaca)' : '') + '</span></div>';
    }
    $('#stats').innerHTML = html;
  }

  function randomPassword() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', out = '', a = new Uint32Array(16);
    crypto.getRandomValues(a); for (var i = 0; i < a.length; i++) out += chars[a[i] % chars.length];
    return out;
  }

  async function viewUsers() {
    var v = $('#view');
    v.innerHTML = '<h1>Pengguna</h1><p class="muted">Owner mengatur siapa yang boleh masuk. Admin umum bisa mengelola konten (paket, kendaraan, promo, artikel, galeri, pesan), tetapi tidak bisa mengubah tampilan situs.</p>' +
      '<div class="card" style="margin:18px 0"><h3 style="font-family:var(--font-text)">Tambah pengguna</h3><form id="uf" class="form-grid" novalidate>' +
      '<div><label for="ue">Email</label><input id="ue" type="email" required></div><div><label for="un">Nama</label><input id="un" required></div>' +
      '<div><label for="ur">Peran</label><select id="ur"><option value="admin">Admin umum</option><option value="owner">Owner</option></select></div>' +
      '<div><label for="up">Kata sandi awal (min. 10 karakter)</label><input id="up" type="text" autocomplete="off"></div></form>' +
      '<div class="acts" style="margin-top:14px"><button class="btn btn--sm btn--ghost" id="gen" type="button">Buat kata sandi acak</button><button class="btn btn--gold btn--sm" id="add" type="button">Tambah</button></div><p id="ufe" class="err" role="alert"></p></div>' +
      '<div class="card"><div class="tblwrap"><table class="tbl"><thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Status</th><th></th></tr></thead><tbody id="ub"><tr><td colspan="5">Memuat…</td></tr></tbody></table></div></div>';
    $('#gen').onclick = function () { $('#up').value = randomPassword(); };
    $('#add').onclick = async function () {
      $('#ufe').textContent = '';
      try {
        await api('/api/admin/users', { method: 'POST', body: { email: $('#ue').value, name: $('#un').value, role: $('#ur').value, password: $('#up').value } });
        toast('Pengguna ditambahkan. Berikan kata sandi awal kepadanya.'); viewUsers();
      } catch (e) { $('#ufe').textContent = e.message; }
    };
    async function load() {
      var j = await api('/api/admin/users');
      $('#ub').innerHTML = j.data.map(function (u) {
        var self = u.id === me.id;
        return '<tr><td>' + esc(u.name) + (self ? ' <span class="pill">Kamu</span>' : '') + '</td><td>' + esc(u.email) + '</td><td>' + (u.role === 'owner' ? 'Owner' : 'Admin umum') + '</td>' +
          '<td><span class="pill ' + (u.active ? 'pill--ok' : 'pill--err') + '">' + (u.active ? 'Aktif' : 'Nonaktif') + '</span></td><td><div class="acts">' +
          (self ? '' : '<button class="btn btn--ghost" data-a="toggle" data-id="' + u.id + '" data-v="' + (u.active ? '0' : '1') + '">' + (u.active ? 'Nonaktifkan' : 'Aktifkan') + '</button>' +
            '<button class="btn btn--ghost" data-a="role" data-id="' + u.id + '" data-v="' + (u.role === 'owner' ? 'admin' : 'owner') + '">Jadikan ' + (u.role === 'owner' ? 'Admin umum' : 'Owner') + '</button>' +
            '<button class="btn btn--ghost" data-a="pw" data-id="' + u.id + '">Reset sandi</button>' +
            '<button class="btn btn--danger" data-a="del" data-id="' + u.id + '">Hapus</button>') + '</div></td></tr>';
      }).join('');
    }
    $('#ub').onclick = async function (e) {
      var b = e.target.closest('button[data-a]'); if (!b) return;
      var id = b.dataset.id, a = b.dataset.a;
      try {
        if (a === 'toggle') await api('/api/admin/users', { method: 'PATCH', body: { id: id, active: b.dataset.v === '1' } });
        if (a === 'role') { if (!confirm('Ubah peran pengguna ini?')) return; await api('/api/admin/users', { method: 'PATCH', body: { id: id, role: b.dataset.v } }); }
        if (a === 'pw') { var p = prompt('Kata sandi baru (min. 10 karakter):', randomPassword()); if (!p) return; await api('/api/admin/users', { method: 'PATCH', body: { id: id, password: p } }); toast('Kata sandi diganti. Sampaikan ke pengguna.'); }
        if (a === 'del') { if (!confirm('Hapus pengguna ini secara permanen?')) return; await api('/api/admin/users?id=' + id, { method: 'DELETE' }); }
        await load(); if (a !== 'pw') toast('Tersimpan');
      } catch (err) { toast(err.message, true); }
    };
    try { await load(); } catch (e) { $('#ub').innerHTML = '<tr><td colspan="5" class="err">' + esc(e.message) + '</td></tr>'; }
  }

  function viewAccount() {
    $('#view').innerHTML = '<h1>Akun saya</h1><div class="card" style="max-width:480px;margin-top:16px"><p><b>' + esc(me.name || '') + '</b><br><span class="muted">' + esc(me.email) + ' · ' + (me.role === 'owner' ? 'Owner' : 'Admin umum') + '</span></p>' +
      '<label for="np">Kata sandi baru (min. 10 karakter)</label><input id="np" type="password" autocomplete="new-password"><label for="np2">Ulangi kata sandi baru</label><input id="np2" type="password" autocomplete="new-password">' +
      '<p id="npe" class="err" role="alert"></p><button class="btn btn--gold" id="npb">Ganti kata sandi</button></div>';
    $('#npb').onclick = async function () {
      var a = $('#np').value, b = $('#np2').value, e = $('#npe'); e.textContent = '';
      if (a.length < 10) { e.textContent = 'Minimal 10 karakter.'; return; }
      if (a !== b) { e.textContent = 'Kedua kata sandi tidak sama.'; return; }
      var r = await sb.auth.updateUser({ password: a });
      if (r.error) { e.textContent = r.error.message; return; }
      $('#np').value = $('#np2').value = ''; toast('Kata sandi diganti');
    };
  }

  function route() {
    var h = location.hash || '#/ringkasan';
    var base = h.split('/').slice(0, 2).join('/');
    if ((h === '#/pengguna' || base === '#/section' || base === '#/pengaturan') && me.role !== 'owner') h = '#/ringkasan';
    if (!/^#\/(ringkasan|pengguna|akun|section|pengaturan)(\/[A-Za-z0-9._-]+)?$/.test(h)) h = '#/ringkasan';
    base = h.split('/').slice(0, 2).join('/');
    renderNav(); $('#side').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
    var ext = window.GNAdminViews || {};
    var f = { '#/ringkasan': viewHome, '#/pengguna': viewUsers, '#/akun': viewAccount, '#/section': function () { return ext.section(h.split('/')[2]); }, '#/pengaturan': function () { return ext.settings(); } }[base];
    Promise.resolve(f()).catch(function (e) { $('#view').innerHTML = '<p class="err">' + esc(e.message) + '</p>'; });
    document.title = 'Admin — GoNEST';
  }

  window.GNAdmin = { sb: function () { return sb; }, esc: esc, $: $, toast: toast };

  /* ---------- sesi ---------- */
  async function enter() {
    try { var j = await api('/api/admin/me'); me = j.profile; }
    catch (e) { await sb.auth.signOut(); $('#loginErr').textContent = e.message; show('login'); return; }
    $('#who').textContent = me.email; show('app'); route();
  }

  async function boot() {
    try {
      var c = await (await fetch('/api/config')).json();
      if (!c.ok) throw new Error('Server belum dikonfigurasi. Periksa variabel lingkungan Cloudflare.');
      sb = window.supabase.createClient(c.supabaseUrl, c.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
    } catch (e) { show('login'); $('#loginErr').textContent = e.message; return; }
    var s = await sb.auth.getSession();
    if (s.data.session) await enter(); else show('login');
  }

  $('#loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var err = $('#loginErr'), btn = $('#loginBtn'); err.textContent = '';
    if (!sb) { err.textContent = 'Server belum siap.'; return; }
    btn.disabled = true; btn.textContent = 'Memeriksa…';
    var r = await sb.auth.signInWithPassword({ email: $('#em').value.trim(), password: $('#pw').value });
    btn.disabled = false; btn.textContent = 'Masuk';
    if (r.error) { err.textContent = 'Email atau kata sandi salah.'; return; }
    $('#pw').value = ''; await enter();
  });
  $('#logout').onclick = async function () { await sb.auth.signOut(); me = null; show('login'); };
  $('#menuBtn').onclick = function () { var s = $('#side'); var o = s.classList.toggle('open'); this.setAttribute('aria-expanded', o); };
  window.addEventListener('hashchange', function () { if (me) route(); });
  boot();
})();
