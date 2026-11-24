/* GoNEST Admin — editor Owner: section & teks, pengaturan situs. Form dibangun dari skema, kunci tak dikenal tetap terjaga. */
(function () {
  'use strict';
  var A = window.GNAdmin, esc = A.esc, $ = A.$, uid = 0;
  var el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  var clone = function (o) { return JSON.parse(JSON.stringify(o == null ? null : o)); };
  var PATHS = ['/', '/packages', '/vehicles', '/destinations', '/journal', '/contact', '/booking', '/faq', '/#paket', '/#kendaraan', '/#galeri', '/#jurnal', '/#kontak'];

  /* ---------- pembangun form ---------- */
  function lbl(def, id) { return def.label ? '<label for="' + id + '">' + esc(def.label) + (def.opt ? ' <small class="muted">(opsional)</small>' : '') + '</label>' : ''; }
  function help(def) { return def.help ? '<p class="help">' + esc(def.help) + '</p>' : ''; }

  function F(def, val) {
    var id = 'f' + (++uid), w = el('div', 'fld'), get, t = def.t;
    if (t === 'text' || t === 'long') {
      w.innerHTML = lbl(def, id) + (t === 'long' ? '<textarea id="' + id + '" rows="3"></textarea>' : '<input id="' + id + '"' + (def.ph ? ' placeholder="' + esc(def.ph) + '"' : '') + (def.list ? ' list="dl-paths"' : '') + '>') + help(def);
      var i = w.querySelector('#' + id); i.value = val == null ? '' : val; get = function () { return i.value.trim(); };
    } else if (t === 'i18n') {
      w.innerHTML = lbl(def, id + 'a') + '<div class="i18n">' + ['id', 'en'].map(function (l) {
        return '<div><span class="lg">' + l.toUpperCase() + '</span>' + (def.long ? '<textarea id="' + id + (l === 'id' ? 'a' : 'b') + '" rows="' + (def.rows || 3) + '"></textarea>' : '<input id="' + id + (l === 'id' ? 'a' : 'b') + '">') + '</div>';
      }).join('') + '</div>' + help(def);
      var a = w.querySelector('#' + id + 'a'), b = w.querySelector('#' + id + 'b'), v = val && typeof val === 'object' ? val : {};
      a.value = v.id || ''; b.value = v.en || ''; get = function () { return { id: a.value.trim(), en: b.value.trim() }; };
    } else if (t === 'num' || t === 'date') {
      w.innerHTML = lbl(def, id) + '<input id="' + id + '" type="' + (t === 'num' ? 'number' : 'date') + '"' + (t === 'num' ? ' inputmode="decimal" step="any"' + (def.min != null ? ' min="' + def.min + '"' : '') : '') + '>' + help(def);
      var ni = w.querySelector('input'); ni.value = val == null ? '' : String(val).slice(0, 10 * (t === 'date')) || (t === 'num' ? String(val) : '');
      get = function () { return ni.value === '' ? null : (t === 'num' ? Number(ni.value) : ni.value); };
    } else if (t === 'bool') {
      w.className = 'fld fld--bool'; w.innerHTML = '<label class="chk"><input type="checkbox" id="' + id + '"> <span>' + esc(def.label) + '</span></label>' + help(def);
      var c = w.querySelector('input'); c.checked = val !== false && !!(val === undefined ? def.def : val); get = function () { return c.checked; };
    } else if (t === 'select') {
      w.innerHTML = lbl(def, id) + '<select id="' + id + '">' + def.opts.map(function (o) { return '<option value="' + o[0] + '">' + esc(o[1]) + '</option>'; }).join('') + '</select>' + help(def);
      var s = w.querySelector('select'); s.value = val || def.def || def.opts[0][0]; get = function () { return s.value; };
    } else if (t === 'range') {
      w.innerHTML = lbl(def, id) + '<div class="rg"><input type="range" id="' + id + '" min="' + def.min + '" max="' + def.max + '" step="' + def.step + '"><output></output></div>' + help(def);
      var r = w.querySelector('input'), o = w.querySelector('output'); r.value = val == null ? def.def : val; o.textContent = r.value;
      r.oninput = function () { o.textContent = r.value; }; get = function () { return +r.value; };
    } else if (t === 'color') {
      w.innerHTML = lbl(def, id) + '<input type="color" id="' + id + '">' + help(def);
      var k = w.querySelector('input'); k.value = /^#[0-9a-f]{6}$/i.test(val || '') ? val : def.def; get = function () { return k.value.toUpperCase(); };
    } else if (t === 'image') {
      return imageField(def, val, w, id);
    } else if (t === 'link') {
      var g = group({ fields: [{ k: 'label', t: 'i18n', label: def.label || 'Teks tombol' }, { k: 'href', t: 'text', label: 'Tujuan tautan', list: true, ph: '/packages atau https://...' }] }, val);
      w.appendChild(g.el); get = g.get; w.className = 'fld fld--box';
    } else if (t === 'group') {
      var gg = group(def, val); if (def.label) w.innerHTML = '<h4 class="gt">' + esc(def.label) + '</h4>'; w.appendChild(gg.el); get = gg.get; w.className = 'fld fld--box';
    } else if (t === 'list') {
      return listField(def, val, w);
    }
    return { el: w, get: get };
  }

  function group(def, val) {
    var box = el('div', 'grp'), base = clone(val) || {}, parts = [];
    def.fields.forEach(function (f) { var p = F(f, base[f.k]); parts.push([f.k, p, f]); box.appendChild(p.el); });
    return { el: box, get: function () {
      var out = clone(base) || {};
      parts.forEach(function (p) { var v = p[1].get(); if (p[2].opt && (v === '' || v === null || (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).some(function (k) { return v[k] && (typeof v[k] !== 'object' || Object.keys(v[k]).some(function (z) { return v[k][z]; })); })))) { delete out[p[0]]; } else out[p[0]] = v; });
      return out; } };
  }

  function listField(def, val, w) {
    var items = [], host = el('div', 'rep'), add = el('button', 'btn btn--ghost btn--sm', '+ ' + esc(def.add || 'Tambah')); add.type = 'button';
    if (def.label) w.appendChild(el('h4', 'gt', esc(def.label)));
    w.appendChild(host); w.appendChild(add); w.className = 'fld fld--box';
    function draw() {
      host.innerHTML = '';
      items.forEach(function (it, n) {
        var row = el('div', 'rep__i'), bar = el('div', 'rep__bar');
        bar.innerHTML = '<b>' + esc(def.noun || 'Item') + ' ' + (n + 1) + '</b>';
        [['↑', 'Naik', -1], ['↓', 'Turun', 1], ['Hapus', 'Hapus', 0]].forEach(function (a) {
          var b = el('button', 'btn btn--ghost btn--sm' + (a[2] === 0 ? ' btn--danger-o' : ''), a[0]); b.type = 'button'; b.title = a[1]; b.setAttribute('aria-label', a[1] + ' ' + (n + 1));
          b.onclick = function () {
            if (a[2] === 0) { if (!confirm('Hapus ' + (def.noun || 'item') + ' ini?')) return; items.splice(n, 1); }
            else { var m = n + a[2]; if (m < 0 || m >= items.length) return; var tmp = items[n]; items[n] = items[m]; items[m] = tmp; }
            draw();
          }; bar.appendChild(b);
        });
        row.appendChild(bar); row.appendChild(it.el); host.appendChild(row);
      });
    }
    var mk = function (v) { return def.of ? F(def.of, v) : group({ fields: def.item }, v); };
    (Array.isArray(val) ? val : []).forEach(function (v) { items.push(mk(v)); });
    add.onclick = function () { items.push(mk(def.of ? (def.of.t === 'i18n' ? {} : '') : {})); draw(); };
    draw();
    return { el: w, get: function () { return items.map(function (i) { return i.get(); }); } };
  }

  /* ---------- gambar: perkecil di browser, simpan WebP ke Storage ---------- */
  /* Terima semua gambar yang bisa dibaca browser (JPG, PNG, WebP, GIF, AVIF, HEIC di Safari, dll).
     Diperkecil (sisi terpanjang maks. 'max' px), orientasi EXIF dihormati, lalu disimpan sebagai WebP
     (atau JPEG bila browser tidak bisa membuat WebP). Tidak memakai blob: URL karena dilarang oleh CSP admin. */
  async function decode(file) {
    if (window.createImageBitmap) { try { return await createImageBitmap(file); } catch (e) { /* lanjut ke cara lain */ } }
    var url = await new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = function () { rej(new Error('File tidak bisa dibaca')); }; r.readAsDataURL(file); });
    return await new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { rej(new Error('Format gambar ini tidak didukung browser. Simpan sebagai JPG atau PNG lalu coba lagi.')); }; i.src = url; });
  }
  async function prepare(file, max) {
    var img = await decode(file), w = img.width || img.naturalWidth, h = img.height || img.naturalHeight;
    if (!w || !h) throw new Error('Gambar kosong atau rusak');
    var k = Math.min(1, max / Math.max(w, h)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    var cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height); cx.drawImage(img, 0, 0, c.width, c.height);
    if (img.close) img.close();
    var out = function (type, q) { return new Promise(function (res) { c.toBlob(res, type, q); }); };
    var b = await out('image/webp', 0.82), ext = 'webp';
    if (!b || b.type !== 'image/webp') { b = await out('image/jpeg', 0.84); ext = 'jpg'; }
    if (!b) throw new Error('Gagal memproses gambar');
    return { blob: b, ext: ext, type: b.type };
  }
  async function uploadImage(file, dir, max) {
    if (!file) throw new Error('Tidak ada file');
    if (file.size > 25 * 1024 * 1024) throw new Error('File terlalu besar (maks. 25 MB).');
    var p = await prepare(file, max || 1600), path = (dir || 'site') + '/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + '.' + p.ext;
    var r = await A.sb().storage.from('media').upload(path, p.blob, { contentType: p.type, upsert: false });
    if (r.error) throw new Error('Gagal mengunggah: ' + r.error.message);
    return path;
  }
  function imageField(def, val, w, id) {
    var cur = val || '';
    w.className = 'fld fld--box'; w.innerHTML = lbl(def, id) + '<div class="img"><div class="img__pv"></div><div class="img__ctl"><input type="file" id="' + id + '" accept="image/*"><button type="button" class="btn btn--ghost btn--sm">Hapus gambar</button><p class="help">Semua format gambar diterima (JPG, PNG, WebP, dll). Otomatis diperkecil (maks. 1600 px) dan dikompres ke WebP.</p><p class="err" role="alert"></p></div></div>';
    var pv = w.querySelector('.img__pv'), inp = w.querySelector('input'), err = w.querySelector('.err');
    var show = function () { pv.innerHTML = cur ? '<img alt="" src="' + esc(/^(\/|https?:)/.test(cur) ? cur : '/api/image/' + cur) + '">' : '<span class="muted">Belum ada gambar</span>'; };
    show();
    w.querySelector('button').onclick = function () { cur = ''; show(); };
    inp.onchange = async function () {
      var f = inp.files[0]; if (!f) return; err.textContent = '';
      pv.innerHTML = '<span class="muted">Memproses & mengunggah…</span>';
      try { cur = await uploadImage(f, def.dir, def.max); } catch (e) { err.textContent = e.message; }
      show(); inp.value = '';
    };
    return { el: w, get: function () { return cur; } };
  }

  /* ---------- skema ---------- */
  var CTA = function (k, label, opt) { return { k: k, t: 'link', label: label, opt: opt }; };
  var HEAD = [
    { k: 'eyebrow', t: 'i18n', label: 'Eyebrow (teks kecil di atas judul)', opt: true },
    { k: 'heading', t: 'i18n', label: 'Judul' },
    { k: 'heading2', t: 'i18n', label: 'Judul baris ke-2 (miring, biru)', opt: true },
    { k: 'description', t: 'i18n', long: true, label: 'Deskripsi', opt: true },
  ];
  var SEC = {
    hero: HEAD.concat([CTA('cta1', 'Tombol utama'), CTA('cta2', 'Tombol kedua', true),
      { k: 'image', t: 'image', label: 'Foto hero', dir: 'site' }, { k: 'image_alt', t: 'i18n', label: 'Deskripsi foto (untuk pembaca layar)', opt: true }, { k: 'image_text', t: 'i18n', label: 'Teks kecil di foto', opt: true }]),
    text: HEAD.concat([CTA('cta1', 'Tombol utama', true), CTA('cta2', 'Tombol kedua', true)]),
    cta: HEAD.concat([CTA('cta1', 'Tombol utama'), CTA('cta2', 'Tombol kedua', true)]),
    list: HEAD.concat([{ k: 'items', t: 'list', label: 'Poin-poin', noun: 'Poin', add: 'Tambah poin', item: [{ k: 'title', t: 'i18n', label: 'Judul poin' }, { k: 'text', t: 'i18n', long: true, label: 'Penjelasan' }] }]),
  };
  var LINKS = [{ k: 'label', t: 'i18n', label: 'Teks' }, { k: 'href', t: 'text', label: 'Tautan', list: true }];
  var SET = [
    { key: 'brand', title: 'Logo & nama', fields: [
      { k: 'go', t: 'text', label: 'Kata depan logo (tipis)' }, { k: 'nest', t: 'text', label: 'Kata belakang logo (tebal)' },
      { k: 'tagline', t: 'i18n', label: 'Teks kecil di bawah logo', help: 'Lebar teks otomatis disesuaikan dengan lebar logo.' }] },
    { key: 'contact', title: 'Kontak', fields: [
      { k: 'whatsapp', t: 'text', label: 'Nomor WhatsApp', ph: '6281234567890', help: 'Format internasional tanpa + dan spasi.' }, { k: 'telegram', t: 'text', label: 'Username Telegram', ph: 'gonest_id', help: 'Tanpa @.' },
      { k: 'phone', t: 'text', label: 'Nomor tampilan', opt: true }, { k: 'email', t: 'text', label: 'Email', opt: true }, { k: 'instagram', t: 'text', label: 'Instagram (username atau URL)', opt: true },
      { k: 'address', t: 'i18n', label: 'Alamat', opt: true }, { k: 'hours', t: 'i18n', label: 'Jam layanan', opt: true }, { k: 'maps_url', t: 'text', label: 'Tautan Google Maps', opt: true }] },
    { key: 'nav', title: 'Menu navigasi (header)', fields: [
      { k: 'items', t: 'list', label: 'Menu', noun: 'Menu', add: 'Tambah menu', item: [{ k: 'label', t: 'i18n', label: 'Teks' }, { k: 'href', t: 'text', label: 'Tautan', list: true }, { k: 'visible', t: 'bool', label: 'Tampilkan', def: true }] },
      { k: 'cta', t: 'link', label: 'Tombol di header' }] },
    { key: 'footer', title: 'Footer', fields: [
      { k: 'about', t: 'i18n', long: true, label: 'Tentang singkat' },
      { k: 'columns', t: 'list', label: 'Kolom tautan', noun: 'Kolom', add: 'Tambah kolom', item: [{ k: 'title', t: 'i18n', label: 'Judul kolom' }, { k: 'links', t: 'list', label: 'Tautan', noun: 'Tautan', add: 'Tambah tautan', item: LINKS }] },
      { k: 'copyright', t: 'i18n', label: 'Teks hak cipta' }] },
    { key: 'theme', title: 'Warna & animasi latar', fields: [
      { k: 'palette', t: 'group', label: 'Palet', fields: [{ k: 'golden', t: 'color', label: 'Golden', def: '#F9D601' }, { k: 'ultramarine', t: 'color', label: 'Ultramarine', def: '#3670FF' }, { k: 'gray', t: 'color', label: 'Bright Gray', def: '#EFEFEF' }, { k: 'black', t: 'color', label: 'Chinese Black', def: '#171717' }] },
      { k: 'ambient', t: 'group', label: 'Animasi latar', fields: [
        { k: 'enabled', t: 'bool', label: 'Aktifkan animasi latar', def: true },
        { k: 'mode', t: 'select', label: 'Musim', opts: [['auto', 'Otomatis (acak per hari)'], ['leaves', 'Daun gugur'], ['rain', 'Hujan'], ['snow', 'Salju'], ['off', 'Mati']], help: 'Pratinjau tanpa menyimpan: tambahkan ?ambient=snow di akhir alamat situs.' },
        { k: 'intensity', t: 'range', label: 'Kepadatan', min: 0.2, max: 1.5, step: 0.1, def: 0.6 },
        { k: 'tint', t: 'bool', label: 'Beri rona warna lembut pada latar', def: true }] }] },
    { key: 'chat', title: 'Tombol chat', fields: [
      { k: 'enabled', t: 'bool', label: 'Tampilkan tombol chat', def: true },
      { k: 'whatsapp', t: 'group', label: 'WhatsApp', fields: [{ k: 'enabled', t: 'bool', label: 'Aktif', def: true }, { k: 'label', t: 'i18n', label: 'Teks tombol' }] },
      { k: 'telegram', t: 'group', label: 'Telegram', fields: [{ k: 'enabled', t: 'bool', label: 'Aktif', def: true }, { k: 'label', t: 'i18n', label: 'Teks tombol' }] },
      { k: 'live', t: 'group', label: 'Live chat (percakapan langsung di situs)', fields: [
        { k: 'enabled', t: 'bool', label: 'Aktif', def: true }, { k: 'label', t: 'i18n', label: 'Teks tombol' },
        { k: 'welcome', t: 'i18n', long: true, label: 'Sapaan saat admin online' }, { k: 'offline', t: 'i18n', long: true, label: 'Pesan saat admin offline' },
        { k: 'start_hour', t: 'num', label: 'Jam online mulai (WIB, 0-23)', def: 8 }, { k: 'end_hour', t: 'num', label: 'Jam online selesai (WIB, 1-24)', def: 21 }] }] },
  ];

  function pathsList() { if (!$('#dl-paths')) { var d = el('datalist'); d.id = 'dl-paths'; d.innerHTML = PATHS.map(function (p) { return '<option value="' + p + '">'; }).join(''); document.body.appendChild(d); } }
  function fail(e) { A.toast(e.message || 'Gagal menyimpan', true); }

  /* Riwayat versi: 30 versi terakhir tiap baris disimpan otomatis oleh database; Owner bisa memulihkan. */
  function historyBox(table, key, restore) {
    var box = el('div', 'hist'), btn = el('button', 'btn btn--ghost btn--sm', 'Riwayat versi'); btn.type = 'button'; var out = el('div', 'hist__l'); box.appendChild(btn); box.appendChild(out);
    btn.onclick = async function () {
      if (out.innerHTML) { out.innerHTML = ''; return; }
      out.innerHTML = '<p class="muted">Memuat…</p>';
      var r = await A.sb().from('revisions').select('*').eq('table_name', table).eq('row_key', key).order('changed_at', { ascending: false });
      if (r.error) { out.innerHTML = '<p class="err">' + esc(r.error.message) + '</p>'; return; }
      out.innerHTML = (r.data || []).length ? '' : '<p class="muted">Belum ada versi lama. Versi tersimpan setiap kali kamu menyimpan perubahan.</p>';
      (r.data || []).forEach(function (rev) {
        var row = el('div', 'hist__i'), b = el('button', 'btn btn--ghost btn--sm', 'Pulihkan'); b.type = 'button';
        row.innerHTML = '<span>' + esc(new Date(rev.changed_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })) + '</span>'; row.appendChild(b);
        b.onclick = async function () { if (!confirm('Pulihkan versi ini? Isi saat ini akan diganti (dan tetap tersimpan di riwayat).')) return; var u = await restore(rev.data); if (u && u.error) fail(u.error); else { A.toast('Versi dipulihkan'); } };
        out.appendChild(row);
      });
    };
    return box;
  }

  /* ---------- tampilan: daftar & editor section ---------- */
  async function viewSection(id) {
    pathsList(); var v = $('#view'), sb = A.sb();
    if (!id) {
      v.innerHTML = '<h1>Section & teks</h1><p class="muted">Pilih bagian halaman yang ingin diubah. Perubahan tampil di situs dalam sekitar 1-2 menit.</p><div id="sl" class="slist"><p class="muted">Memuat…</p></div>';
      var r = await sb.from('sections').select('*').order('page').order('sort');
      if (r.error) { $('#sl').innerHTML = '<p class="err">' + esc(r.error.message) + '</p>'; return; }
      $('#sl').innerHTML = (r.data || []).map(function (s) {
        var f = s.fields || {}, t = (f.heading && (f.heading.id || f.heading.en)) || s.id;
        return '<a class="card sitem" href="#/section/' + esc(s.id) + '"><span><b>' + esc(t) + '</b><small>' + esc(s.id) + ' &middot; ' + esc(s.kind) + '</small></span><span class="pill ' + (s.visible ? 'pill--ok' : '') + '">' + (s.visible ? 'Tampil' : 'Disembunyikan') + '</span></a>';
      }).join('') || '<p class="muted">Belum ada section. Jalankan 002_seed.sql.</p>';
      return;
    }
    var q = await sb.from('sections').select('*').eq('id', id).single();
    if (q.error || !q.data) { v.innerHTML = '<p class="err">Section tidak ditemukan.</p><a href="#/section">&larr; Kembali</a>'; return; }
    var s = q.data, form = group({ fields: SEC[s.kind] || SEC.text }, s.fields);
    v.innerHTML = '<a class="crumb" href="#/section">&larr; Semua section</a><h1>' + esc(s.id) + '</h1><p class="muted">Jenis: ' + esc(s.kind) + '. Isi dua bahasa; bila salah satu kosong, situs memakai bahasa Indonesia.</p>';
    var card = el('div', 'card'); card.appendChild(form.el);
    var vis = F({ t: 'bool', label: 'Tampilkan section ini di situs', def: true }, s.visible); card.appendChild(vis.el);
    var save = el('button', 'btn btn--gold', 'Simpan perubahan'); save.type = 'button'; card.appendChild(save);
    var vw = el('a', 'btn btn--ghost', 'Lihat situs'); vw.href = '/'; vw.target = '_blank'; vw.rel = 'noopener'; vw.style.marginLeft = '8px'; card.appendChild(vw);
    card.appendChild(historyBox('sections', id, function (d) { return sb.from('sections').update({ fields: d.fields, visible: d.visible }).eq('id', id).then(function (u) { if (!u.error) viewSection(id); return u; }); }));
    v.appendChild(card);
    save.onclick = async function () {
      save.disabled = true; save.textContent = 'Menyimpan…';
      var u = await sb.from('sections').update({ fields: form.get(), visible: vis.get() }).eq('id', id);
      save.disabled = false; save.textContent = 'Simpan perubahan';
      if (u.error) fail(u.error); else A.toast('Tersimpan');
    };
  }

  /* ---------- pengaturan situs ---------- */
  function clean(key, val) {
    if (key === 'contact') {
      val.whatsapp = (val.whatsapp || '').replace(/\D/g, '');
      if (val.whatsapp && !/^\d{8,15}$/.test(val.whatsapp)) throw new Error('Nomor WhatsApp harus 8-15 digit, tanpa tanda +.');
      val.telegram = (val.telegram || '').replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '');
      if (val.telegram && !/^[A-Za-z0-9_]{4,32}$/.test(val.telegram)) throw new Error('Username Telegram 4-32 karakter (huruf, angka, garis bawah).');
    }
    if (key === 'brand' && (!val.go || !val.nest)) throw new Error('Isi kedua kata logo.');
    return val;
  }
  async function viewSettings() {
    pathsList(); var v = $('#view'), sb = A.sb();
    v.innerHTML = '<h1>Pengaturan situs</h1><p class="muted">Logo, kontak, menu, footer, warna, dan tombol chat. Tiap bagian disimpan sendiri.</p><div id="st"><p class="muted">Memuat…</p></div>';
    var r = await sb.from('site_settings').select('*');
    if (r.error) { $('#st').innerHTML = '<p class="err">' + esc(r.error.message) + '</p>'; return; }
    var by = {}; (r.data || []).forEach(function (x) { by[x.key] = x.value; });
    var host = $('#st'); host.innerHTML = '';
    SET.forEach(function (d, n) {
      var det = el('details', 'card acc'); if (n === 0) det.open = true;
      det.appendChild(el('summary', '', esc(d.title)));
      var form = group({ fields: d.fields }, by[d.key]); det.appendChild(form.el);
      var b = el('button', 'btn btn--gold', 'Simpan ' + esc(d.title.toLowerCase())); b.type = 'button'; det.appendChild(b);
      det.appendChild(historyBox('site_settings', d.key, function (rv) { return sb.from('site_settings').upsert({ key: d.key, value: rv.value }).then(function (u) { if (!u.error) viewSettings(); return u; }); }));
      b.onclick = async function () {
        var val; try { val = clean(d.key, form.get()); } catch (e) { return fail(e); }
        b.disabled = true; var u = await sb.from('site_settings').upsert({ key: d.key, value: val }); b.disabled = false;
        if (u.error) fail(u.error); else A.toast('Tersimpan');
      };
      host.appendChild(det);
    });
  }

  window.GNForm = { upload: uploadImage, F: F, group: group, el: el, clone: clone };
  window.GNAdminViews = { section: viewSection, settings: viewSettings };
})();
