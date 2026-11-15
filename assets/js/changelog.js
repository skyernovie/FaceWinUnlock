(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  var canvas = document.getElementById('ascii-bg');
  var meta = document.getElementById('theme-color');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY = 'fwu-theme';

  /* ---------- 主题：默认按时间，19:00–07:00 夜间 ---------- */
  function autoTheme() {
    var h = new Date().getHours();
    return (h >= 19 || h < 7) ? 'dark' : 'light';
  }
  function manualTheme() {
    try { return sessionStorage.getItem(KEY); } catch (e) { return null; }
  }
  function setTheme(mode) {
    var dark = mode === 'dark';
    root.setAttribute('data-theme', mode);
    canvas.classList.toggle('is-on', dark);
    if (meta) meta.setAttribute('content', dark ? '#050a15' : '#f3ede3');
    if (btn) {
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      btn.setAttribute('aria-label', dark ? '切换到日间模式' : '切换到夜间模式');
      btn.title = dark ? '切换到日间模式' : '切换到夜间模式';
    }
    if (dark) start(); else stop();
  }

  /* ---------- ASCII 渐变背景（与首页同参） ---------- */
  var COLORS = ['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8'];
  var CHARS = ' =+xX0S8#@';
  var CELL = 18, DENSITY = 0.8, GLYPH = 0.85, FLICKER = 0.2;
  var SOFT = 0.5, FLOW = 0.5, SPEED = 1, GRAIN = 0.08, SCRAMBLE = 0.1;
  var ctx = canvas.getContext('2d');
  var stops = COLORS.map(function (hex) {
    var n = parseInt(hex.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  });
  var dpr = 1, w = 0, h = 0, cols = 0, rows = 0;
  var running = false, rafId = 0, startedAt = 0, lastFrame = 0;
  var pointer = { x: 0, y: 0, on: false };
  var waves = [];

  var grain = document.createElement('canvas');
  grain.width = grain.height = 96;
  (function () {
    var g = grain.getContext('2d');
    var img = g.createImageData(96, 96);
    for (var p = 0; p < img.data.length; p += 4) {
      var v = 150 + Math.random() * 105;
      img.data[p] = img.data[p + 1] = img.data[p + 2] = v;
      img.data[p + 3] = Math.random() * 80;
    }
    g.putImageData(img, 0, 0);
  })();
  var grainPattern = ctx.createPattern(grain, 'repeat');

  function mix(t) {
    t = Math.max(0, Math.min(1, t)) * (stops.length - 1);
    var i = Math.min(stops.length - 2, Math.floor(t));
    var f = t - i, a = stops[i], b = stops[i + 1];
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * f) + ',' +
      Math.round(a[1] + (b[1] - a[1]) * f) + ',' +
      Math.round(a[2] + (b[2] - a[2]) * f) + ')';
  }
  function rnd(i, j, seed) {
    var v = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
    return v - Math.floor(v);
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / CELL) + 1;
    rows = Math.ceil(h / CELL) + 1;
  }

  function draw(t, now) {
    var intro = Math.min(1, t / 1.1);
    var hz = 0.58 + Math.sin(t * 0.18 * SPEED) * 0.012;
    var pointerR = SCRAMBLE * Math.min(w, h);

    ctx.clearRect(0, 0, w, h);
    ctx.font = '500 13px "SFMono-Regular", Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var k = 0; k < waves.length; k++) waves[k].r = (now - waves[k].born) * 0.85;

    for (var j = 0; j < rows; j++) {
      var v = (j * CELL + CELL / 2) / h;
      var sy = j * CELL + CELL / 2;
      for (var i = 0; i < cols; i++) {
        if (rnd(i, j, 1) > DENSITY) continue;
        var sx = i * CELL + CELL / 2;
        var u = sx / w;
        var d = v - hz;
        var wave = Math.sin(u * 6.2 + t * (0.55 + FLOW) * SPEED + j * 0.22) * 0.5 + 0.5;
        var bright = Math.exp(-(d * d) / (0.012 + SOFT * 0.05)) * (0.55 + wave * 0.45);
        bright += Math.exp(-Math.pow(d - 0.36, 2) / 0.1) * 0.26;
        bright += (rnd(i, j, 2) - 0.5) * FLICKER * 0.3;
        bright = Math.max(0, Math.min(1, bright * intro));

        if (pointer.on) {
          var dx = sx - pointer.x, dy = sy - pointer.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < pointerR) {
            ctx.globalAlpha = GLYPH * (0.45 + (1 - dist / pointerR) * 0.55) * intro;
            ctx.fillStyle = 'rgb(246,248,255)';
            ctx.fillText(CHARS.charAt(Math.floor(rnd(i, j, Math.floor(t * 14) + 3) * CHARS.length)), sx, sy);
            continue;
          }
        }
        var hit = false;
        for (var k2 = 0; k2 < waves.length; k2++) {
          var wx = sx - waves[k2].x, wy = sy - waves[k2].y;
          var wd = Math.sqrt(wx * wx + wy * wy);
          if (Math.abs(wd - waves[k2].r) < 26) { hit = true; break; }
        }
        if (hit) {
          ctx.globalAlpha = GLYPH * intro;
          ctx.fillStyle = 'rgb(246,248,255)';
          ctx.fillText(CHARS.charAt(Math.floor(rnd(i, j, Math.floor(t * 16)) * CHARS.length)), sx, sy);
          continue;
        }
        var ch = CHARS.charAt(Math.round(bright * (CHARS.length - 1)));
        if (ch === ' ') continue;
        ctx.fillStyle = mix(0.18 + d * 0.75 + wave * 0.16);
        ctx.globalAlpha = Math.min(1, GLYPH * (0.28 + bright * 0.72) * intro);
        ctx.fillText(ch, sx, sy);
      }
    }

    if (GRAIN > 0) {
      ctx.save();
      ctx.globalAlpha = GRAIN;
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(-Math.floor(Math.random() * 96), -Math.floor(Math.random() * 96));
      ctx.fillStyle = grainPattern;
      ctx.fillRect(0, 0, w + 96, h + 96);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    if (now - lastFrame < 32) return;
    lastFrame = now;
    for (var i = waves.length - 1; i >= 0; i--) {
      if (now - waves[i].born > 2600) waves.splice(i, 1);
    }
    draw((now - startedAt) / 1000, now);
  }
  function start() {
    resize();
    startedAt = performance.now();
    lastFrame = 0;
    if (still) { draw(2.6, performance.now()); return; }
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    waves.length = 0;
    pointer.on = false;
  }

  setTheme(manualTheme() || autoTheme());

  /* ---------- 贡献者头像组：点击散开 / 再点收回 ---------- */
  (function () {
    var PEOPLE = [
      { login: 'zs1083339604' },
      { login: 'devcme' },
      { login: 'Ming-QWQ520' },
      { login: 'tztztzy' },
      { login: 'Xiao-yu233' },
      { login: 'zhhnsghy' },
      { login: 'skyernovie' },
      { login: 'ZHCOOL520' }
    ];
    var MAX = 4;
    var canHover = window.matchMedia('(hover: hover)').matches;

    [].slice.call(document.querySelectorAll('.contrib')).forEach(function (group) {
      PEOPLE.forEach(function (p, i) {
        var a = document.createElement('a');
        a.className = 'cav';
        a.style.setProperty('--i', i);
        a.href = 'https://github.com/' + p.login;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.title = '在 GitHub 打开 @' + p.login;
        a.setAttribute('aria-label', p.login);
        a.tabIndex = -1;

        var img = document.createElement('img');
        img.src = '../assets/avatars/' + p.login + '.png';
        img.alt = '';
        img.loading = 'lazy';
        img.width = 42;
        img.height = 42;
        a.appendChild(img);

        var name = document.createElement('span');
        name.className = 'cav__name';
        name.textContent = p.login;
        a.appendChild(name);

        group.appendChild(a);
      });

      var more = document.createElement('span');
      more.className = 'cav cav--more';
      more.hidden = true;
      var num = document.createElement('span');
      num.textContent = '+0';
      more.appendChild(num);
      group.appendChild(more);

      var list = [].slice.call(group.querySelectorAll('.cav[href]'));
      var shown = list;
      if (list.length > MAX) {
        var rest = list.slice(MAX - 1);
        rest.forEach(function (a) {
          a.classList.add('cav--extra');
          a.tabIndex = -1;
        });
        num.textContent = '+' + rest.length;
        more.hidden = false;
        shown = list.slice(0, MAX - 1);
      }
      more.style.setProperty('--i', shown.length);
      group.style.setProperty('--n', list.length);

      group.setAttribute('role', 'button');
      group.setAttribute('aria-expanded', 'false');
      group.setAttribute('aria-label', '贡献者：悬停展开，展开后点击头像进入主页');
      group.tabIndex = 0;

      var open = false;
      function setOpen(v) {
        if (open === v) return;
        open = v;
        group.classList.toggle('is-open', open);
        group.setAttribute('aria-expanded', String(open));
        shown.forEach(function (a) { a.tabIndex = open ? 0 : -1; });
      }
      group._close = function () { setOpen(false); };

      if (canHover) {
        group.addEventListener('pointerenter', function () { setOpen(true); });
        group.addEventListener('pointerleave', function () { setOpen(false); });
      } else {
        group.addEventListener('click', function (e) {
          if (open && e.target.closest('.cav[href]')) return;
          e.preventDefault();
          setOpen(!open);
        });
      }
      group.addEventListener('focusin', function () { setOpen(true); });
      group.addEventListener('focusout', function (e) {
        if (!group.contains(e.relatedTarget)) setOpen(false);
      });
      group.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { setOpen(false); return; }
        if (e.target !== group) return;
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          setOpen(!open);
        }
      });
    });

    document.addEventListener('click', function (e) {
      [].slice.call(document.querySelectorAll('.contrib.is-open')).forEach(function (g) {
        if (!g.contains(e.target)) g._close();
      });
    });
  })();

  /* ---------- 导航吸顶：滚动后加底色与细线 ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('is-stuck', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (btn) {
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(next);
      try { sessionStorage.setItem(KEY, next); } catch (e) {}
    });
  }
  setInterval(function () {
    if (manualTheme()) return;
    var mode = autoTheme();
    if (mode !== root.getAttribute('data-theme')) setTheme(mode);
  }, 60000);

  window.addEventListener('resize', function () {
    if (root.getAttribute('data-theme') !== 'dark') return;
    resize();
    if (still) draw(2.6, performance.now());
  });
  window.addEventListener('pointermove', function (e) {
    if (!running) return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.on = true;
  }, { passive: true });
  window.addEventListener('pointerdown', function (e) {
    if (!running) return;
    waves.push({ x: e.clientX, y: e.clientY, born: performance.now(), r: 0 });
  }, { passive: true });
  window.addEventListener('blur', function () { pointer.on = false; });
  document.addEventListener('visibilitychange', function () {
    if (root.getAttribute('data-theme') !== 'dark' || still) return;
    if (document.hidden) {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    } else {
      startedAt = performance.now();
      running = true;
      rafId = requestAnimationFrame(frame);
    }
  });
})();
