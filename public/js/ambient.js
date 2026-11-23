/* GoNEST — latar musim yang halus (daun, hujan, salju). Canvas ringan, berhenti saat tab tersembunyi,
   mati otomatis bila pengguna memilih "kurangi gerakan". Mode: auto (acak per hari) | leaves | rain | snow | off. */
(function () {
  'use strict';
  var MODES = ['leaves', 'rain', 'snow'];
  var ASSETS = {
    leaves: ['leaf-maple', 'leaf-oak', 'leaf-ginkgo', 'leaf-willow'],
    snow: ['flake-1', 'flake-2', 'flake-3']
  };
  var TINT = { leaves: ['#FFF8DA', '#FFFFFF'], rain: ['#E9EEF5', '#F6F8FB'], snow: ['#EEF4FF', '#FFFFFF'] };

  function dayPick() {                         // pilihan stabil per hari (waktu lokal pengunjung)
    var d = new Date(), n = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
    n = Math.imul(n ^ (n >>> 15), 2246822519) >>> 0;
    return MODES[n % MODES.length];
  }
  function resolve(cfg) {
    var q = (location.search.match(/[?&]ambient=([a-z]+)/) || [])[1];
    var m = q || (cfg && cfg.mode) || 'auto';
    if (cfg && cfg.enabled === false && !q) return 'off';
    if (m === 'auto') return dayPick();
    return MODES.indexOf(m) >= 0 || m === 'off' ? m : 'off';
  }
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  var state = { cv: null, ctx: null, parts: [], mode: 'off', raf: 0, last: 0, w: 0, h: 0, dpr: 1, imgs: [], k: 0.6 };

  function load(names) {
    return Promise.all(names.map(function (n) {
      return new Promise(function (res) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = '/assets/ambient/' + n + '.svg'; });
    })).then(function (a) { return a.filter(Boolean); });
  }
  function count() {
    var area = state.w * state.h / 1e6, small = state.w < 700;
    var base = state.mode === 'rain' ? 90 : state.mode === 'snow' ? 34 : 16;
    return Math.max(6, Math.round(base * Math.min(area * 1.1, 1.8) * state.k * (small ? 0.65 : 1)));
  }
  function spawn(p, top) {
    var m = state.mode, W = state.w, H = state.h;
    if (m === 'leaves') {
      p.s = rnd(20, 46); p.x = rnd(-20, W + 20); p.y = top ? rnd(-H * 0.2, -p.s) : rnd(-p.s, H);
      p.vy = rnd(28, 62); p.amp = rnd(22, 60); p.ph = rnd(0, 6.28); p.sw = rnd(0.5, 1.1);
      p.rot = rnd(0, 6.28); p.vr = rnd(-0.6, 0.6); p.fl = rnd(0, 6.28); p.vf = rnd(0.9, 2.2); p.img = state.imgs[(Math.random() * state.imgs.length) | 0]; p.a = rnd(0.55, 0.9); p.x0 = p.x; p.t = 0;
    } else if (m === 'snow') {
      p.s = rnd(9, 26); p.x = rnd(-10, W + 10); p.y = top ? rnd(-H * 0.2, -p.s) : rnd(-p.s, H);
      p.vy = rnd(16, 42); p.amp = rnd(8, 26); p.ph = rnd(0, 6.28); p.sw = rnd(0.3, 0.8);
      p.rot = rnd(0, 6.28); p.vr = rnd(-0.5, 0.5); p.img = state.imgs[(Math.random() * state.imgs.length) | 0]; p.a = rnd(0.5, 0.95); p.x0 = p.x; p.t = 0;
    } else {
      p.len = rnd(12, 30); p.x = rnd(-60, W + 60); p.y = top ? rnd(-H * 0.3, 0) : rnd(-30, H);
      p.vy = rnd(620, 980); p.a = rnd(0.28, 0.55); p.wd = rnd(0.8, 1.5);
    }
  }
  function fit() {
    var cv = state.cv; state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.w = innerWidth; state.h = innerHeight;
    cv.width = Math.round(state.w * state.dpr); cv.height = Math.round(state.h * state.dpr);
    cv.style.width = state.w + 'px'; cv.style.height = state.h + 'px';
    state.ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    var n = count(); while (state.parts.length < n) { var p = {}; spawn(p, false); state.parts.push(p); }
    state.parts.length = Math.min(state.parts.length, n);
  }
  function frame(ts) {
    state.raf = requestAnimationFrame(frame);
    var dt = Math.min((ts - (state.last || ts)) / 1000, 0.05); state.last = ts;
    var c = state.ctx, m = state.mode, W = state.w, H = state.h, i, p;
    c.clearRect(0, 0, W, H);
    if (m === 'rain') {
      c.lineCap = 'round'; c.strokeStyle = '#4A5A73';
      for (i = 0; i < state.parts.length; i++) {
        p = state.parts[i]; p.y += p.vy * dt; p.x -= p.vy * dt * 0.16;
        if (p.y > H + 30) spawn(p, true);
        c.globalAlpha = p.a; c.lineWidth = p.wd; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.len * 0.16, p.y - p.len); c.stroke();
      }
      c.globalAlpha = 1; return;
    }
    for (i = 0; i < state.parts.length; i++) {
      p = state.parts[i]; p.t += dt; p.y += p.vy * dt;
      p.x = p.x0 + Math.sin(p.t * p.sw * 2 + p.ph) * p.amp; p.rot += p.vr * dt;
      if (p.y > H + p.s) spawn(p, true);
      if (!p.img) continue;
      c.save(); c.globalAlpha = p.a; c.translate(p.x, p.y); c.rotate(p.rot + Math.sin(p.t * p.sw * 2 + p.ph) * 0.5);
      if (m === 'leaves') { p.fl += p.vf * dt; c.scale(Math.max(Math.abs(Math.cos(p.fl)), 0.12), 1); }   // putaran 3D seperti koin di air
      c.drawImage(p.img, -p.s / 2, -p.s / 2, p.s, p.s); c.restore();
    }
  }
  function stop() { cancelAnimationFrame(state.raf); state.raf = 0; state.last = 0; }
  function start() { if (!state.raf && state.mode !== 'off') state.raf = requestAnimationFrame(frame); }

  function tint(mode, on) {
    var el = document.getElementById('gn-tint');
    if (!el) { el = document.createElement('div'); el.id = 'gn-tint'; el.setAttribute('aria-hidden', 'true'); document.body.prepend(el); }
    var t = TINT[mode];
    el.style.background = (on !== false && t) ? 'linear-gradient(180deg,' + t[0] + ' 0%,' + t[1] + ' 70%)' : 'transparent';
    document.documentElement.setAttribute('data-ambient', mode);
  }

  function init(cfg) {
    var mode = resolve(cfg || {});
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) mode = 'off';
    state.k = Math.min(Math.max(cfg && cfg.intensity != null ? +cfg.intensity : 0.6, 0.1), 1.5);
    stop(); state.mode = mode; state.parts = [];
    tint(mode, !cfg || cfg.tint !== false);
    if (mode === 'off') { if (state.cv) state.cv.style.display = 'none'; return; }
    if (!state.cv) {
      var cv = document.createElement('canvas'); cv.id = 'gn-ambient'; cv.setAttribute('aria-hidden', 'true');
      document.body.prepend(cv); state.cv = cv; state.ctx = cv.getContext('2d');
      addEventListener('resize', function () { if (state.mode !== 'off') fit(); });
      document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    }
    state.cv.style.display = '';
    (ASSETS[mode] ? load(ASSETS[mode]) : Promise.resolve([])).then(function (imgs) {
      state.imgs = imgs; fit(); start();
    });
  }
  window.GN = window.GN || {}; window.GN.ambient = init;
})();
