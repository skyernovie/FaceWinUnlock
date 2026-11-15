(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';

  /* ---------- 日间 / 夜间 + ASCII 渐变背景 ---------- */
  (function () {
    var root = document.documentElement;
    var btn = document.getElementById('theme-toggle');
    var canvas = document.getElementById('ascii-bg');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!canvas) return;
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var KEY = 'fwu-theme';

    /* 参数对齐 GradientASCII：shape=horizon，cell=18 */
    var COLORS = ['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8'];
    var CHARS = ' =+xX0S8#@';
    var CELL = 18, DENSITY = 0.8, GLYPH = 0.85, GLOW = 0.2;
    var FLICKER = 0.2, SOFT = 0.5, FLOW = 0.5, SPEED = 1;
    var GRAIN = 0.08, SCRAMBLE = 0.1;

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

      for (var k = 0; k < waves.length; k++) {
        waves[k].r = (now - waves[k].born) * 0.85;
      }

      for (var j = 0; j < rows; j++) {
        var v = (j * CELL + CELL / 2) / h;
        var sy = j * CELL + CELL / 2;
        for (var i = 0; i < cols; i++) {
          if (rnd(i, j, 1) > DENSITY) continue;
          var u = (i * CELL + CELL / 2) / w;
          var sx = i * CELL + CELL / 2;
          var d = v - hz;
          var wave = Math.sin(u * 6.2 + t * (0.55 + FLOW) * SPEED + j * 0.22) * 0.5 + 0.5;
          var bright = Math.exp(-(d * d) / (0.012 + SOFT * 0.05)) * (0.55 + wave * 0.45);
          bright += Math.exp(-Math.pow(d - 0.36, 2) / 0.1) * 0.26;
          bright += (rnd(i, j, 2) - 0.5) * FLICKER * 0.3;
          bright = Math.max(0, Math.min(1, bright * intro));

          /* 鼠标附近：字符乱码 + 提亮 */
          if (pointer.on) {
            var dx = sx - pointer.x, dy = sy - pointer.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < pointerR) {
              var near = 1 - dist / pointerR;
              ctx.globalAlpha = GLYPH * (0.45 + near * 0.55) * intro;
              ctx.fillStyle = 'rgb(246,248,255)';
              ctx.fillText(CHARS.charAt(Math.floor(rnd(i, j, Math.floor(t * 14) + 3) * CHARS.length)), sx, sy);
              continue;
            }
          }

          /* 点击涟漪：波峰处的字符被打散 */
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
          ctx.globalAlpha = Math.min(1, GLYPH * (0.28 + bright * 0.72) * (1 + GLOW * 0.6) * intro);
          ctx.fillText(ch, sx, sy);
        }
      }

      /* 颗粒 */
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

    function autoTheme() {
      var h = new Date().getHours();
      return (h >= 19 || h < 7) ? 'dark' : 'light';   // 19:00–07:00 夜间
    }
    function manualTheme() {
      try { return sessionStorage.getItem(KEY); } catch (e) { return null; }
    }

    /* 默认跟随时间自动切换；手动切换只在本次会话内覆盖 */
    setTheme(manualTheme() || autoTheme());

    if (btn) {
      btn.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(next);
        try { sessionStorage.setItem(KEY, next); } catch (e) {}
      });
    }

    /* 页面长时间停留时也跟着时间走 */
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

  /* ---------- 字符拆分 ---------- */
  var heroTitle = document.getElementById('hero-title');
  if (heroTitle) {
    var text = heroTitle.textContent.trim();
    var html = '';
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (c === ' ') { html += ' '; continue; }
      if (c === '。') { html += '<span class="ch seal-dot">' + c + '</span>'; continue; }
      html += '<span class="ch">' + c + '</span>';
    }
    heroTitle.innerHTML = html;
  }

  /* ---------- 头像组：点击散开 / 再点收回 ---------- */
  (function () {
    var group = document.getElementById('pgroup');
    if (!group) return;
    var MAX = 4;                                   // 最多显示 4 个圆
    var more = group.querySelector('.pav--more');
    var list = [].slice.call(group.querySelectorAll('.pav[href]'));
    var shown = list;

    if (list.length > MAX) {
      var rest = list.slice(MAX - 1);
      rest.forEach(function (a) { a.hidden = true; a.tabIndex = -1; });
      more.querySelector('.pav__more-num').textContent = '+' + rest.length;
      more.hidden = false;
      more.title = rest.map(function (a) { return a.getAttribute('aria-label'); }).join(' / ');
      shown = list.slice(0, MAX - 1);
    }
    group.style.setProperty('--n', shown.length);

    var open = false;
    function setOpen(next) {
      if (open === next) return;
      open = next;
      group.classList.toggle('is-open', open);
      group.setAttribute('aria-expanded', open ? 'true' : 'false');
      shown.forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    }

    /* 悬停自动展开，移出收回 */
    group.addEventListener('mouseenter', function () { setOpen(true); });
    group.addEventListener('mouseleave', function () {
      if (group.contains(document.activeElement)) return;    // 键盘焦点仍在组内时保持展开
      setOpen(false);
    });
    group.addEventListener('focusin', function () { setOpen(true); });
    group.addEventListener('focusout', function (e) {
      if (e.relatedTarget && group.contains(e.relatedTarget)) return;
      setOpen(false);
    });

    group.addEventListener('click', function (e) {
      if (e.target.closest('.pav[href]')) return;            // 展开后点头像 / 名字 = 直达平台
      e.preventDefault();
      setOpen(true);                                         // 触屏无悬停：首点展开
    });

    document.addEventListener('click', function (e) {
      if (open && !group.contains(e.target)) setOpen(false); // 触屏点空白处收回
    });

    group.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.target !== group) return;                        // 不劫持头像链接的按键
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setOpen(true);
      }
    });
  })();

  /* ---------- 下载区头像组：点击散开 / 再点收回 ---------- */
  (function () {
    var group = document.getElementById('dl-agroup');
    if (!group) return;
    /* 贡献者（头像取自 GitHub） */
    var PEOPLE = [
      'zs1083339604', 'devcme', 'Ming-QWQ520', 'tztztzy',
      'Xiao-yu233', 'zhhnsghy', 'skyernovie', 'ZHCOOL520'
    ];
    var MAX = 4;
    var more = group.querySelector('.agroup__av--more');

    PEOPLE.forEach(function (login, i) {
      var a = document.createElement('a');
      a.className = 'agroup__av';
      a.style.setProperty('--i', i);
      a.href = 'https://github.com/' + login;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = '在 GitHub 打开 @' + login;
      a.setAttribute('aria-label', login);
      a.tabIndex = -1;

      var img = document.createElement('img');
      img.src = './assets/avatars/' + login + '.png';
      img.alt = '';
      img.width = 46;
      img.height = 46;
      a.appendChild(img);

      var nm = document.createElement('span');
      nm.className = 'agroup__name';
      nm.textContent = login;
      a.appendChild(nm);

      group.insertBefore(a, more);
    });

    var list = [].slice.call(group.querySelectorAll('.agroup__av[href]'));
    var shown = list;

    if (list.length > MAX) {
      var rest = list.slice(MAX - 1);
      rest.forEach(function (a) {
        a.classList.add('agroup__av--extra');
        a.tabIndex = -1;
      });
      more.querySelector('span').textContent = '+' + rest.length;
      more.hidden = false;
      shown = list.slice(0, MAX - 1);
    }
    more.style.setProperty('--i', shown.length);
    group.style.setProperty('--n', list.length);

    var open = false;
    function setOpen(next) {
      if (open === next) return;
      open = next;
      group.classList.toggle('is-open', open);
      group.setAttribute('aria-expanded', open ? 'true' : 'false');
      shown.forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    }

    group.addEventListener('click', function (e) {
      if (open && e.target.closest('.agroup__av[href]')) return;  // 展开后点头像 / 名字直达平台
      e.preventDefault();
      setOpen(!open);
    });
    document.addEventListener('click', function (e) {
      if (open && !group.contains(e.target)) setOpen(false);
    });
    group.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.target !== group) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setOpen(!open);
      }
    });
  })();

  /* ---------- 无 GSAP 兜底 ---------- */
  if (!hasGSAP || reduce) {
    return;
  }

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  /* ---------- 滚动进度墨线 ---------- */
  var bar = document.getElementById('scroll-ink');
  window.addEventListener('scroll', function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = 'scaleX(' + p + ')';
  }, { passive: true });

  /* ---------- 首屏入场 ---------- */
  var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.fromTo('.nav__brand', { y: -18, opacity: 0 }, { y: 0, opacity: 1, duration: .8 })
    .fromTo('.nav__links > *', { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .07 }, '-=.5')
    .fromTo('.hero__eyebrow', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .7 }, '-=.35')
    .fromTo('#hero-title .ch', { yPercent: 118, opacity: 0, rotateX: -62 }, {
      yPercent: 0, opacity: 1, rotateX: 0,
      duration: 1.05, stagger: .055, ease: 'power4.out',
      transformOrigin: '50% 100%'
    }, '-=.45')
    .fromTo('#hero-rule', { scaleX: 0 }, { scaleX: 1, duration: .9, ease: 'power2.inOut' }, '-=.75')
    .fromTo('.hero__lede', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .8 }, '-=.6')
    .fromTo('.hero__acts > *', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .08 }, '-=.55');

  /* 兜底：低帧率设备上 2.4s 后强制收尾，避免首屏停在半透明态 */
  setTimeout(function () {
    if (tl.progress() < 1) tl.progress(1);
  }, 2400);

  /* ---------- 通用滚动浮现 ---------- */
  gsap.utils.toArray('.rv').forEach(function (el) {
    gsap.fromTo(el, { y: 26, opacity: 0 }, {
      y: 0, opacity: 1, duration: .95, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* ---------- 笔刷线条绘制 ---------- */
  gsap.utils.toArray('.brush path').forEach(function (p) {
    var len = p.getTotalLength ? p.getTotalLength() : 320;
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(p, {
      strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut',
      scrollTrigger: { trigger: p.closest('.sec-head, .idea') || p, start: 'top 85%', once: true }
    });
  });

  /* ---------- 功能横向滚动画廊 ---------- */
  var track = document.getElementById('feat-track');
  var featSection = document.querySelector('.features');
  var mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', function () {
    var getDist = function () {
      return Math.max(0, track.scrollWidth - window.innerWidth + 80);
    };
    var tween = gsap.to(track, {
      x: function () { return -getDist(); },
      ease: 'none',
      scrollTrigger: {
        trigger: featSection,
        start: 'top top',
        end: function () { return '+=' + getDist(); },
        pin: true,
        scrub: .8,
        invalidateOnRefresh: true,
        anticipatePin: 1
      }
    });
    return function () { tween.kill(); };
  });

  /* ---------- 数字滚动 ---------- */
  gsap.utils.toArray('.count').forEach(function (n) {
    var target = parseFloat(n.getAttribute('data-to')) || 0;
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.5, ease: 'power2.out',
      scrollTrigger: { trigger: n, start: 'top 88%', once: true },
      onUpdate: function () { n.textContent = Math.round(obj.v); }
    });
  });

  /* ---------- 墨滴切换：点击导航 → 墨团吞屏 → 落点 ---------- */
  var wipe = document.getElementById('ink-wipe');
  var logo = document.getElementById('wipe-logo');
  var logoText = logo.querySelector('span');
  var running = false;

  /* 各章节转场时横向显示的字 */
  var WIPE_TEXT = {
    idea: '平等享有',
    features: '实用为主',
    stats: '实事求是',
    download: '抬头即开',
    top: 'FACE'
  };

  function inkWipeTo(targetId, x, y) {
    if (running) return;
    running = true;
    logoText.textContent = WIPE_TEXT[targetId] || 'FACE';
    var size = Math.hypot(window.innerWidth, window.innerHeight) * 2.1;
    gsap.set(wipe, {
      width: size, height: size,
      x: x - size / 2, y: y - size / 2,
      scale: 0, opacity: 1
    });
    gsap.set(logo, { opacity: 0, scale: .92 });

    var tl2 = gsap.timeline({
      onComplete: function () { running = false; }
    });
    tl2.to(wipe, {
      scale: 1, duration: .62,
      ease: 'power3.inOut'
    })
      .to(logo, { opacity: 1, scale: 1, duration: .3, ease: 'power2.out' }, '-=.3')
      .add(function () {
        var el = document.getElementById(targetId);
        if (el) {
          var top = el.getBoundingClientRect().top + window.scrollY;
          window.scrollTo(0, targetId === 'top' ? 0 : top);
        }
      })
      .to(logo, { opacity: 0, scale: 1.04, duration: .26, ease: 'power2.in' }, '+=.16')
      .to(wipe, { scale: 0, opacity: 0, duration: .55, ease: 'power3.inOut' }, '-=.1');
  }

  document.querySelectorAll('[data-nav]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('data-nav');
      if (!id) return;
      e.preventDefault();
      var r = a.getBoundingClientRect();
      inkWipeTo(id, r.left + r.width / 2, r.top + r.height / 2);
    });
  });
})();
