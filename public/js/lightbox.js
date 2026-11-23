/* GoNEST — lightbox foto: panah, Esc, geser jari, kunci scroll, fokus kembali ke pemicu. */
(function () {
  'use strict';
  var GN = window.GN, esc = GN.esc, st = null;
  function close() {
    if (!st) return; document.removeEventListener('keydown', st.key); st.root.remove(); document.documentElement.style.overflow = st.ov;
    if (st.from && st.from.focus) st.from.focus(); st = null;
  }
  function show(n) {
    var it = st.items[n]; st.n = n;
    st.root.querySelector('img').src = it.src; st.root.querySelector('img').alt = it.title || '';
    st.root.querySelector('.lb__cap').innerHTML = (it.title ? '<b>' + esc(it.title) + '</b>' : '') + (it.caption ? '<span>' + esc(it.caption) + '</span>' : '');
    st.root.querySelector('.lb__n').textContent = (n + 1) + ' / ' + st.items.length;
    [].forEach.call(st.root.querySelectorAll('.lb__a'), function (b) { b.hidden = st.items.length < 2; });
  }
  GN.lightbox = function (items, start, from) {
    if (!items || !items.length) return; close();
    var r = document.createElement('div'); r.className = 'lb'; r.setAttribute('role', 'dialog'); r.setAttribute('aria-modal', 'true'); r.setAttribute('aria-label', GN.s('zoom'));
    r.innerHTML = '<button class="lb__x" type="button" aria-label="' + esc(GN.s('close')) + '">&times;</button><button class="lb__a lb__p" type="button" aria-label="' + esc(GN.s('prev')) + '">&#8249;</button><figure><img alt=""><figcaption class="lb__cap"></figcaption></figure><button class="lb__a lb__nx" type="button" aria-label="' + esc(GN.s('next')) + '">&#8250;</button><span class="lb__n" aria-live="polite"></span>';
    document.body.appendChild(r);
    st = { root: r, items: items, n: start || 0, from: from || document.activeElement, ov: document.documentElement.style.overflow };
    document.documentElement.style.overflow = 'hidden';
    var go = function (d) { show((st.n + d + st.items.length) % st.items.length); };
    r.querySelector('.lb__x').onclick = close; r.querySelector('.lb__p').onclick = function () { go(-1); }; r.querySelector('.lb__nx').onclick = function () { go(1); };
    r.addEventListener('click', function (e) { if (e.target === r || e.target.tagName === 'FIGURE') close(); });
    st.key = function (e) { if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1); else if (e.key === 'Tab') { e.preventDefault(); r.querySelector('.lb__x').focus(); } };
    document.addEventListener('keydown', st.key);
    var x0 = null; r.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    r.addEventListener('touchend', function (e) { if (x0 == null) return; var d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 50) go(d < 0 ? 1 : -1); x0 = null; });
    show(st.n); r.querySelector('.lb__x').focus();
  };
  GN.lightboxFrom = function (list) { return list.map(function (g) { return { src: GN.img(g.image), title: GN.t(g.title), caption: GN.t(g.caption) }; }); };
})();
