/* GoNEST — kartu promo, tombol salin/klaim, dan popup promo (pemicu: jeda waktu atau persen gulir). */
(function () {
  'use strict';
  var GN = window.GN, esc = GN.esc, t = GN.t, $ = GN.$;
  function value(p) { return p.type === 'percent' ? Math.round(p.value) + GN.s('pctOff') : p.type === 'fixed' ? GN.money(p.value) + ' ' + GN.s('off').toLowerCase() : ''; }
  GN.promoCard = function (p, popup) {
    var until = p.ends_at ? '<p class="pr__u">' + esc(GN.s('until')) + ' ' + esc(GN.date(p.ends_at)) + '</p>' : '';
    return '<article class="card pr' + (popup ? ' pr--pop' : '') + '"><div class="pr__top">' + (value(p) ? '<span class="pr__v">' + esc(value(p)) + '</span>' : '') + '<h3>' + esc(t(p.title)) + '</h3></div>' +
      (t(p.description) ? '<p>' + esc(t(p.description)) + '</p>' : '') + until +
      '<div class="pr__code"><code>' + esc(p.code) + '</code><button class="btn btn--ghost btn--sm" type="button" data-copy="' + esc(p.code) + '">' + esc(GN.s('copy')) + '</button></div>' +
      '<a class="btn btn--gold btn--sm" href="' + esc(GN.wa(GN.s('helloPr') + p.code)) + '" target="_blank" rel="noopener">' + esc(GN.s('claim')) + '</a>' +
      (t(p.terms) ? '<details class="pr__t"><summary>' + esc(GN.s('terms')) + '</summary><p>' + esc(t(p.terms)) + '</p></details>' : '') + '</article>';
  };
  GN.bindCopy = function (root) {
    [].forEach.call((root || document).querySelectorAll('[data-copy]'), function (b) {
      if (b.__b) return; b.__b = 1;
      b.onclick = function () {
        var code = b.dataset.copy, ok = function () { var o = b.textContent; b.textContent = GN.s('copied'); setTimeout(function () { b.textContent = GN.s('copy'); }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(ok, ok); else { var ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); ok(); }
      };
    });
  };
  var shown = false;
  GN.promoPopup = function (list, cfg) {
    cfg = cfg || {}; if (shown || cfg.enabled === false) return;
    var p = (list || []).filter(function (x) { return x.show_popup; })[0]; if (!p) return;
    var key = 'gn_pop_' + p.id, ss = null;
    try { var last = +localStorage.getItem(key) || 0; if (last && Date.now() - last < (cfg.snooze_days == null ? 3 : cfg.snooze_days) * 864e5) return; if (cfg.once_per_session !== false && sessionStorage.getItem(key)) return; } catch (e) {}
    function open() {
      if (shown) return; shown = true; cleanup();
      var from = document.activeElement, o = document.createElement('div'); o.className = 'pop'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', t(p.title));
      o.innerHTML = '<div class="pop__box"><button class="pop__x" type="button" aria-label="' + esc(GN.s('close')) + '">&times;</button>' + GN.promoCard(p, true) + '</div>';
      document.body.appendChild(o); GN.bindCopy(o);
      var close = function () { o.remove(); document.removeEventListener('keydown', kd); try { localStorage.setItem(key, Date.now()); sessionStorage.setItem(key, '1'); } catch (e) {} if (from && from.focus) from.focus(); };
      var kd = function (e) { if (e.key === 'Escape') close(); }; document.addEventListener('keydown', kd);
      o.querySelector('.pop__x').onclick = close; o.addEventListener('click', function (e) { if (e.target === o) close(); }); o.querySelector('.pop__x').focus();
    }
    var tm = setTimeout(open, Math.max(3, +cfg.delay_seconds || 12) * 1000);
    var sc = function () { var h = document.documentElement; if ((h.scrollTop + innerHeight) / h.scrollHeight * 100 >= (+cfg.scroll_percent || 40) && h.scrollTop > 200) open(); };
    addEventListener('scroll', sc, { passive: true });
    function cleanup() { clearTimeout(tm); removeEventListener('scroll', sc); }
  };
})();
