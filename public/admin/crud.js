/* GoNEST Admin — CRUD konten (paket, kendaraan + jadwal terpakai, promo, artikel, galeri, destinasi). Dipakai Owner dan Admin umum. */
(function () {
  'use strict';
  var A = window.GNAdmin, FM = window.GNForm, esc = A.esc, $ = A.$, el = FM.el;
  var T = function (v) { return v && typeof v === 'object' ? (v.id || v.en || '') : (v || ''); };
  var rp = function (n) { return n == null ? '-' : 'Rp ' + new Intl.NumberFormat('id-ID').format(n); };
  var pill = function (txt, ok) { return '<span class="pill ' + (ok ? 'pill--ok' : '') + '">' + esc(txt) + '</span>'; };
  var STATUS = [['draft', 'Draf (tidak tampil)'], ['published', 'Terbit']];
  var slugify = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60); };
  var SLUG = { k: 'slug', t: 'text', label: 'Alamat (slug)', ph: 'otomatis dari judul', help: 'Huruf kecil, angka, dan tanda hubung. Dipakai di alamat halaman.' };
  var SORT = { k: 'sort', t: 'num', label: 'Urutan (kecil tampil lebih dulu)' };
  var I18 = function (k, label, o) { return Object.assign({ k: k, t: 'i18n', label: label }, o || {}); };

  var CFG = {
    packages: { title: 'Paket trip', one: 'paket', order: 'sort', dir: 'packages',
      cols: [['Paket', function (r) { return '<b>' + esc(T(r.title)) + '</b><small>' + esc(r.kind) + ' &middot; ' + (r.duration_days || 1) + ' hari</small>'; }], ['Harga', function (r) { return rp(r.price_from); }], ['Status', function (r) { return pill(r.status === 'published' ? 'Terbit' : 'Draf', r.status === 'published'); }]],
      slugFrom: function (v) { return T(v.title); },
      fields: [I18('title', 'Nama paket'), SLUG, I18('summary', 'Ringkasan singkat', { long: true }),
        { k: 'kind', t: 'select', label: 'Jenis', opts: [['open', 'Open trip'], ['private', 'Private'], ['family', 'Keluarga'], ['custom', 'Custom']] },
        { k: 'duration_days', t: 'num', label: 'Lama (hari)', min: 1 }, { k: 'price_from', t: 'num', label: 'Harga mulai dari (Rp)', min: 0 }, I18('price_note', 'Catatan harga', { opt: true }),
        { k: 'cover', t: 'image', label: 'Foto sampul', dir: 'packages' },
        { k: 'highlights', t: 'list', label: 'Sorotan', noun: 'Sorotan', add: 'Tambah sorotan', of: { t: 'i18n' } },
        { k: 'itinerary', t: 'list', label: 'Rencana perjalanan (per hari)', noun: 'Hari', add: 'Tambah hari', item: [I18('title', 'Judul hari'), I18('text', 'Kegiatan', { long: true })] },
        { k: 'included', t: 'list', label: 'Sudah termasuk', noun: 'Item', add: 'Tambah', of: { t: 'i18n' } },
        { k: 'excluded', t: 'list', label: 'Belum termasuk', noun: 'Item', add: 'Tambah', of: { t: 'i18n' } },
        { k: 'status', t: 'select', label: 'Status', opts: STATUS }, SORT] },
    vehicles: { title: 'Kendaraan', one: 'kendaraan', order: 'sort', dir: 'vehicles', blocks: true,
      cols: [['Kendaraan', function (r) { return '<b>' + esc(r.name) + '</b><small>' + esc(r.kind) + ' &middot; ' + r.seats + ' kursi</small>'; }], ['Harga', function (r) { return rp(r.price_from); }],
        ['Ketersediaan', function (r) { return pill({ available: 'Tersedia', limited: 'Terbatas', booked: 'Penuh', maintenance: 'Perawatan' }[r.status] || r.status, r.status === 'available') + (r.active ? '' : ' ' + pill('Disembunyikan')); }]],
      slugFrom: function (v) { return v.name; },
      fields: [{ k: 'name', t: 'text', label: 'Nama kendaraan' }, SLUG,
        { k: 'kind', t: 'select', label: 'Jenis', opts: [['mpv', 'MPV'], ['suv', 'SUV'], ['van', 'Van'], ['bus', 'Bus'], ['sedan', 'Sedan'], ['luxury', 'Mewah']] },
        { k: 'seats', t: 'num', label: 'Jumlah kursi', min: 1 }, { k: 'luggage', t: 'num', label: 'Kapasitas koper', min: 0 }, { k: 'price_from', t: 'num', label: 'Harga mulai dari (Rp/hari)', min: 0 }, I18('price_note', 'Catatan harga', { opt: true }),
        I18('description', 'Deskripsi', { long: true, opt: true }), { k: 'photo', t: 'image', label: 'Foto', dir: 'vehicles' },
        { k: 'features', t: 'list', label: 'Fasilitas', noun: 'Fasilitas', add: 'Tambah fasilitas', of: { t: 'text' } },
        { k: 'status', t: 'select', label: 'Status ketersediaan (manual)', opts: [['available', 'Tersedia'], ['limited', 'Terbatas'], ['booked', 'Penuh'], ['maintenance', 'Perawatan']], help: 'Tampil di situs. Tanggal terpakai di bawah ikut dipakai untuk cek ketersediaan per tanggal.' },
        { k: 'available_from', t: 'date', label: 'Tersedia mulai (bila penuh/perawatan)', opt: true }, I18('status_note', 'Catatan status', { opt: true }),
        { k: 'active', t: 'bool', label: 'Tampilkan di situs', def: true }, SORT] },
    promos: { title: 'Promo & kode', one: 'promo', order: 'created_at.desc',
      cols: [['Promo', function (r) { return '<b>' + esc(r.code) + '</b><small>' + esc(T(r.title)) + '</small>'; }], ['Pemakaian', function (r) { return (r.used || 0) + (r.quota != null ? ' / ' + r.quota : ' / tanpa batas'); }], ['Status', function (r) { return pill(r.active ? 'Aktif' : 'Nonaktif', r.active); }]],
      fields: [{ k: 'code', t: 'text', label: 'Kode promo', ph: 'GONEST10', help: 'Huruf besar/angka, 2-32 karakter.' }, I18('title', 'Judul promo'), I18('description', 'Deskripsi', { long: true, opt: true }), I18('terms', 'Syarat & ketentuan', { long: true, opt: true }),
        { k: 'type', t: 'select', label: 'Jenis', opts: [['percent', 'Diskon persen'], ['fixed', 'Potongan rupiah'], ['perk', 'Bonus/keuntungan']] },
        { k: 'value', t: 'num', label: 'Nilai (persen atau rupiah)', min: 0 }, { k: 'starts_at', t: 'date', label: 'Mulai', opt: true }, { k: 'ends_at', t: 'date', label: 'Berakhir (sampai akhir hari)', opt: true },
        { k: 'quota', t: 'num', label: 'Kuota (kosong = tanpa batas)', min: 0 }, { k: 'image', t: 'image', label: 'Gambar promo', dir: 'promos' },
        { k: 'show_popup', t: 'bool', label: 'Tampilkan sebagai popup di situs', def: false }, { k: 'active', t: 'bool', label: 'Aktif', def: true }] },
    articles: { title: 'Artikel', one: 'artikel', order: 'created_at.desc', dir: 'articles',
      cols: [['Artikel', function (r) { return '<b>' + esc(T(r.title)) + '</b><small>' + esc(r.category || '') + '</small>'; }], ['Status', function (r) { return pill(r.status === 'published' ? 'Terbit' : 'Draf', r.status === 'published'); }]],
      slugFrom: function (v) { return T(v.title); },
      fields: [I18('title', 'Judul'), SLUG, { k: 'category', t: 'text', label: 'Kategori', opt: true }, I18('excerpt', 'Ringkasan', { long: true }), { k: 'cover', t: 'image', label: 'Foto sampul', dir: 'articles' },
        I18('body', 'Isi artikel', { long: true, rows: 12, help: 'Mendukung: ## Judul bagian, **tebal**, *miring*, daftar dengan tanda "- ", dan tautan [teks](https://...). Pisahkan paragraf dengan baris kosong.' }),
        { k: 'tags', t: 'list', label: 'Tag', noun: 'Tag', add: 'Tambah tag', of: { t: 'text' } }, { k: 'status', t: 'select', label: 'Status', opts: STATUS }] },
    destinations: { title: 'Destinasi', one: 'destinasi', order: 'sort', dir: 'destinations',
      cols: [['Destinasi', function (r) { return '<b>' + esc(r.name) + '</b><small>' + esc(r.region || '') + '</small>'; }], ['Status', function (r) { return pill(r.active === false ? 'Disembunyikan' : 'Tampil', r.active !== false); }]],
      slugFrom: function (v) { return v.name; },
      fields: [{ k: 'name', t: 'text', label: 'Nama destinasi' }, SLUG, { k: 'region', t: 'text', label: 'Wilayah', opt: true }, I18('tagline', 'Kalimat singkat', { opt: true }), I18('description', 'Deskripsi', { long: true, opt: true }),
        { k: 'cover', t: 'image', label: 'Foto sampul', dir: 'destinations' }, { k: 'active', t: 'bool', label: 'Tampilkan di situs', def: true }, SORT] },
    gallery_items: { title: 'Galeri', one: 'foto', order: 'sort', dir: 'gallery', bulk: true,
      cols: [['Foto', function (r) { return '<span class="thumb">' + (r.image ? '<img alt="" src="/api/image/' + esc(r.image) + '">' : '') + '</span><b>' + esc(T(r.title) || '(tanpa judul)') + '</b><small>' + esc(r.category || '') + '</small>'; }], ['Status', function (r) { return pill(r.active === false ? 'Disembunyikan' : 'Tampil', r.active !== false); }]],
      fields: [{ k: 'image', t: 'image', label: 'Foto', dir: 'gallery' }, I18('title', 'Judul', { opt: true }), I18('caption', 'Keterangan', { long: true, opt: true }),
        { k: 'location', t: 'text', label: 'Lokasi', opt: true }, { k: 'category', t: 'text', label: 'Kategori / destinasi', help: 'Dipakai sebagai indeks di halaman galeri (mis. Bromo, Bali).' }, { k: 'active', t: 'bool', label: 'Tampilkan di situs', def: true }, SORT] },
  };

  function fail(e) { A.toast((e && e.message) || 'Gagal menyimpan', true); }
  function beforeSave(t, v, isNew) {
    if (t === 'promos') { v.code = String(v.code || '').trim().toUpperCase(); if (!/^[A-Z0-9_-]{2,32}$/.test(v.code)) throw new Error('Kode promo 2-32 karakter: huruf, angka, - atau _.'); if (v.ends_at && v.ends_at.length === 10) v.ends_at += 'T23:59:59+07:00'; if (v.starts_at && v.starts_at.length === 10) v.starts_at += 'T00:00:00+07:00'; }
    if (t === 'articles' && v.status === 'published' && !v.published_at) v.published_at = new Date().toISOString();
    if (t === 'gallery_items' && !v.image) throw new Error('Unggah foto terlebih dulu.');
    if (CFG[t].slugFrom) { if (!v.slug) v.slug = slugify(CFG[t].slugFrom(v)); else v.slug = slugify(v.slug); if (!v.slug) throw new Error('Isi nama/judul atau slug.'); }
    if (t === 'packages' && !T(v.title)) throw new Error('Isi nama paket.');
    if (t === 'vehicles' && (!v.name || !v.seats)) throw new Error('Isi nama dan jumlah kursi.');
    if ((t === 'articles' && !T(v.title)) || (t === 'destinations' && !v.name)) throw new Error('Isi judul/nama.');
    if (t === 'promos' && !T(v.title)) throw new Error('Isi judul promo.');
    return v;
  }
  function sortOf(sb, t, q) {
    var o = CFG[t].order; if (o.indexOf('.desc') > 0) return q.order(o.split('.')[0], { ascending: false });
    return q.order(o).order('created_at');
  }

  async function list(t) {
    var c = CFG[t], v = $('#view'), sb = A.sb();
    v.innerHTML = '<div class="bar"><h1>' + esc(c.title) + '</h1><span class="grow"></span>' + (c.bulk ? '<label class="btn btn--ghost" for="bulk">Unggah banyak foto</label><input id="bulk" type="file" accept="image/*" multiple hidden>' : '') + '<a class="btn btn--gold" href="#/c/' + t + '/new">+ Tambah ' + esc(c.one) + '</a></div><p class="err" id="bulkerr" role="alert"></p><div id="rows" class="rows"><p class="muted">Memuat…</p></div>';
    var r = await sortOf(sb, t, sb.from(t).select('*'));
    if (r.error) { $('#rows').innerHTML = '<p class="err">' + esc(r.error.message) + '</p>'; return; }
    $('#rows').innerHTML = (r.data || []).map(function (row) {
      return '<a class="card row" href="#/c/' + t + '/' + row.id + '">' + c.cols.map(function (k, i) { return '<span class="c' + i + '">' + k[1](row) + '</span>'; }).join('') + '</a>';
    }).join('') || '<div class="empty"><p>Belum ada data. Klik "Tambah ' + esc(c.one) + '".</p></div>';
    var b = $('#bulk'); if (b) b.onchange = async function () {
      var files = [].slice.call(b.files), n = 0, err = $('#bulkerr'); err.textContent = '';
      for (var i = 0; i < files.length; i++) {
        try {
          var up = await FM.upload(files[i], 'gallery'); var ins = await sb.from(t).insert({ image: up, title: {}, caption: {}, category: 'umum', sort: 100 + i, active: true }); if (ins.error) throw new Error(ins.error.message); n++;
        } catch (e) { err.textContent = 'Foto ' + (i + 1) + ': ' + e.message; }
      }
      if (n) A.toast(n + ' foto ditambahkan'); list(t);
    };
  }

  async function blocksPanel(host, vid) {
    var sb = A.sb(), p = el('div', 'card'); p.style.marginTop = '16px';
    p.innerHTML = '<h3 style="margin-top:14px">Tanggal terpakai</h3><p class="muted">Rentang tanggal kendaraan tidak tersedia (sudah dipesan, servis, dll). Dipakai untuk cek ketersediaan per tanggal di situs.</p><div id="bl"></div><div class="blk"><div><label for="b1">Mulai</label><input id="b1" type="date"></div><div><label for="b2">Sampai</label><input id="b2" type="date"></div><div class="grow"><label for="b3">Catatan</label><input id="b3" placeholder="mis. Sewa Pak Budi"></div><button class="btn btn--gold btn--sm" id="b4" type="button">Tambah</button></div><p class="err" id="b5" role="alert"></p>';
    host.appendChild(p);
    async function draw() {
      var r = await sb.from('vehicle_blocks').select('*').eq('vehicle_id', vid).order('start_date');
      $('#bl', p).innerHTML = (r.data || []).map(function (b) { return '<div class="blrow"><span><b>' + esc(b.start_date) + '</b> s/d <b>' + esc(b.end_date) + '</b> <small class="muted">' + esc(b.note || '') + '</small></span><button class="btn btn--ghost btn--sm btn--danger-o" data-id="' + b.id + '" type="button">Hapus</button></div>'; }).join('') || '<p class="muted">Belum ada.</p>';
      [].forEach.call(p.querySelectorAll('#bl button'), function (x) { x.onclick = async function () { var d = await sb.from('vehicle_blocks').delete().eq('id', x.dataset.id); if (d.error) fail(d.error); else draw(); }; });
    }
    $('#b4', p).onclick = async function () {
      var a = $('#b1', p).value, b = $('#b2', p).value, e = $('#b5', p); e.textContent = '';
      if (!a || !b) { e.textContent = 'Isi tanggal mulai dan sampai.'; return; } if (b < a) { e.textContent = 'Tanggal sampai tidak boleh sebelum mulai.'; return; }
      var i = await sb.from('vehicle_blocks').insert({ vehicle_id: vid, start_date: a, end_date: b, note: $('#b3', p).value.trim() || null });
      if (i.error) { e.textContent = i.error.message; return; } $('#b1', p).value = $('#b2', p).value = $('#b3', p).value = ''; draw();
    };
    draw();
  }

  async function edit(t, id) {
    var c = CFG[t], v = $('#view'), sb = A.sb(), isNew = id === 'new', row = {};
    if (!isNew) { var q = await sb.from(t).select('*').eq('id', id).single(); if (q.error || !q.data) { v.innerHTML = '<p class="err">Data tidak ditemukan.</p><a href="#/c/' + t + '">&larr; Kembali</a>'; return; } row = q.data; }
    var form = FM.group({ fields: c.fields }, row);
    v.innerHTML = '<a class="crumb" href="#/c/' + t + '">&larr; ' + esc(c.title) + '</a><h1>' + (isNew ? 'Tambah ' : 'Ubah ') + esc(c.one) + '</h1>';
    var card = el('div', 'card'); card.appendChild(form.el);
    var save = el('button', 'btn btn--gold', isNew ? 'Simpan ' + c.one : 'Simpan perubahan'); save.type = 'button'; card.appendChild(save);
    if (!isNew) { var del = el('button', 'btn btn--ghost btn--danger-o', 'Hapus'); del.type = 'button'; del.style.marginLeft = '8px'; card.appendChild(del);
      del.onclick = async function () { if (!confirm('Hapus ' + c.one + ' ini? Tindakan ini tidak bisa dibatalkan.')) return; var d = await sb.from(t).delete().eq('id', id); if (d.error) fail(d.error); else { A.toast('Dihapus'); location.hash = '#/c/' + t; } }; }
    v.appendChild(card);
    save.onclick = async function () {
      var val; try { val = beforeSave(t, form.get(), isNew); } catch (e) { return fail(e); }
      save.disabled = true; var r = isNew ? await sb.from(t).insert(val).select().single() : await sb.from(t).update(val).eq('id', id); save.disabled = false;
      if (r.error) return fail(/duplicate|unique/i.test(r.error.message) ? { message: 'Slug/kode sudah dipakai. Ganti dengan yang lain.' } : r.error);
      A.toast('Tersimpan'); if (isNew && r.data && r.data.id) location.hash = '#/c/' + t + '/' + r.data.id;
    };
    if (!isNew && c.blocks) blocksPanel(v, id);
  }

  window.GNAdminViews.crud = function (t, id) { if (!CFG[t]) { $('#view').innerHTML = '<p class="err">Halaman tidak dikenal.</p>'; return; } return id ? edit(t, id) : list(t); };
})();
