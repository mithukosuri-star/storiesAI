/* storiesAI — scroll-driven particle sky. Modes change with each chapter. */
window.CStars = (function () {
  var cv, cx, W = 0, H = 0, dpr = 1, P = [], branches = [], mode = 0, awake = false, raf = null, t = 0, last = 0, inited = false;
  var sprites = {};
  var env = null, reducedMQL = null;
  var GOLD = [243, 211, 138], CREAM = [246, 238, 223], BLUE = [160, 160, 192], VIOLET = [212, 197, 240];

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function calmOn() {
    try {
      return !document.documentElement.classList.contains('force-motion') && !!(reducedMQL && reducedMQL.matches);
    } catch (e) { return false; }
  }
  function profileFor(setting) {
    if (!setting) return null;
    var data = window.CDATA || {};
    var id = setting.env || (data.ENV_BY_SCENE && data.ENV_BY_SCENE[setting.scene]) || 'default';
    return data.ENVIRONMENTS ? (data.ENVIRONMENTS[id] || data.ENVIRONMENTS.default) : null;
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildBranches();
  }
  function buildBranches() {
    branches = [];
    var bx = W * .78, by = H * .92, len = Math.min(H * .19, 190);
    function branch(x, y, ang, l, depth) {
      var x2 = x + Math.cos(ang) * l, y2 = y + Math.sin(ang) * l;
      branches.push([x, y, x2, y2]);
      if (depth <= 0) return;
      branch(x2, y2, ang - rnd(.28, .62), l * rnd(.62, .78), depth - 1);
      branch(x2, y2, ang + rnd(.28, .62), l * rnd(.62, .78), depth - 1);
    }
    branch(bx, by, -Math.PI / 2, len, 4);
  }
  /* one pre-rendered glow per colour: building a radial gradient for every
     bright star on every frame is what made the 2D sky stutter on phones */
  function sprite(c) {
    var k = c[0] + ',' + c[1] + ',' + c[2];
    if (sprites[k]) return sprites[k];
    var size = 64, g = document.createElement('canvas');
    g.width = g.height = size;
    var c2 = g.getContext('2d');
    if (!c2) { sprites[k] = null; return null; }
    var rg = c2.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    rg.addColorStop(0, 'rgba(' + k + ',.95)');
    rg.addColorStop(.28, 'rgba(' + k + ',.3)');
    rg.addColorStop(1, 'rgba(' + k + ',0)');
    c2.fillStyle = rg; c2.fillRect(0, 0, size, size);
    sprites[k] = g;
    return g;
  }

  function make() {
    P = [];
    var n = Math.min(1150, Math.max(420, Math.round(W * H / 1150)));
    for (var i = 0; i < n; i++) {
      var col = Math.random();
      P.push({
        i: i, bx: rnd(0, W), by: rnd(0, H), x: rnd(0, W), y: rnd(0, H), px: 0, py: 0,
        seed: Math.random(), a: rnd(0, Math.PI * 2), sp: rnd(.0004, .0022),
        r: rnd(.22, 1.05), bright: Math.random() > .93, tw: rnd(0, 6.283),
        c: col > .88 ? GOLD : col > .7 ? VIOLET : col > .45 ? BLUE : CREAM
      });
    }
  }
  function baseTarget(p, i, n) {
    var cX = W * .5, cY = H * .5, R = Math.min(W, H) * .46;
    switch (mode) {
      case 1: /* slow nebula drift */
        return [p.bx + Math.sin(t * .0003 + p.a) * 42, p.by + Math.cos(t * .00026 + p.a) * 32];
      case 2: /* spiral vortex */
        var ang = p.seed * 12.5 + t * .00022;
        var rr = 12 + (i / n) * R * 1.5;
        return [cX + Math.cos(ang) * rr, cY + Math.sin(ang) * rr * .72];
      case 3: /* luminous ring */
        var a3 = (i / n) * Math.PI * 2 + t * .00009;
        var r3 = R * (.72 + Math.sin(p.seed * 9) * .055);
        return [cX + Math.cos(a3) * r3, cY + Math.sin(a3) * r3 * .62];
      case 4: /* radial shooting burst */
        var a4 = p.a + t * .00006;
        var r4 = ((p.seed * R * 1.5 + t * .045) % (R * 1.5));
        return [cX + Math.cos(a4) * r4, cY + Math.sin(a4) * r4 * .78];
      case 5: /* winter tree of light */
        if (branches.length) {
          var seg = branches[i % branches.length], f = (i * .618 + t * .00012) % 1;
          return [seg[0] + (seg[2] - seg[0]) * f, seg[1] + (seg[3] - seg[1]) * f];
        }
        return [p.bx, p.by];
      case 6: /* soft wave */
        return [p.bx, cY + Math.sin((p.bx / W) * 7 + t * .0005) * H * .16 + (p.by - cY) * .55];
      case 7: /* constellation circle */
        var a7 = Math.floor(i / (n / 12)) * (Math.PI / 6) + t * .00005;
        var r7 = R * .62 + (p.seed - .5) * 34;
        return [cX + Math.cos(a7) * r7, cY + Math.sin(a7) * r7 * .72];
      case 8: /* warm gold rain */
        return [p.bx + Math.sin(t * .0004 + p.a) * 18, (p.by + t * .018 * (1 + p.seed)) % H];
      default: /* sparse starfield — slow but clearly alive */
        return [p.bx + Math.sin(t * .00034 + p.a) * 34 + Math.sin(t * .00011 + p.a * 2) * 14,
                p.by + Math.cos(t * .00028 + p.a) * 26];
    }
  }
  /* Apply the same environment profile to the 2D fallback, so a device without
     WebGL still gets cosmic drift, reef currents, cloud puffs and fireflies. */
  function target(p, i, n) {
    var q = baseTarget(p, i, n);
    var m = env && env.motion;
    if (!m) return q;
    if (m.drift) {
      q[0] += (Math.sin(t * .00023 + p.a) * 42 + Math.sin(t * .00011 + p.a * 2) * 18) * m.drift;
      q[1] += Math.cos(t * .00019 + p.a * 1.7) * 34 * m.drift;
    }
    if (m.sway) q[0] += Math.sin(t * .0008 + p.seed * 6.283) * m.sway * 36;
    if (m.rise) {
      q[1] -= t * .0035 * (0.5 + p.seed) * m.rise;
      q[1] = ((q[1] % H) + H) % H;              /* wrap from the bottom back up */
    }
    if (m.cluster) {
      var cell = Math.max(52, W * .085);
      if (p.seed < m.cluster) {                 /* noise threshold */
        var gx = Math.round(q[0] / cell) * cell;
        /* gather horizontally, then flatten towards one cloud height so the
           fallback puffs read as wide clouds instead of tall columns */
        var gy = H * (.24 + .38 * (0.5 + 0.5 * Math.sin(gx * .017 + p.a)));
        q[0] += (gx - q[0]) * .68;
        q[1] += (gy - q[1]) * .18;
      }
    }
    if (m.heightCap) {
      var floorY = H * .62;
      if (q[1] < floorY) q[1] = floorY + (q[1] - floorY) * .35;
    }
    return q;
  }
  function frame(ts) {
    if (forcePaused) { raf = null; return; }
    raf = requestAnimationFrame(frame);
    try { draw(ts); } catch (e) { /* one bad frame must not stop the sky */ }
  }

  function draw(ts) {
    var dt = Math.min(50, ts - last); last = ts;
    if (!calmOn()) t += dt;                     /* reduced motion holds the layout */
    cx.clearRect(0, 0, W, H);
    cx.globalCompositeOperation = 'lighter';
    var n = P.length;
    for (var i = 0; i < n; i++) {
      var p = P[i], q = target(p, i, n);
      p.px = p.x; p.py = p.y;
      p.x += (q[0] - p.x) * .045; p.y += (q[1] - p.y) * .045;
      var alpha = (awake ? .55 : .68) * (.22 + .78 * Math.abs(Math.sin(t * .0009 + p.tw)));
      if (env && env.motion && env.motion.firefly) {
        var blink = Math.abs(Math.sin(t * .001 * (0.35 + p.seed) + p.tw));
        alpha *= (1 - env.motion.firefly) + env.motion.firefly * (0.16 + 0.84 * blink);
      }
      if (p.bright) alpha = Math.min(1, alpha * 1.25);
      if (mode === 4 && p.bright) {
        cx.strokeStyle = 'rgba(' + p.c.join(',') + ',' + (alpha * .5) + ')';
        cx.lineWidth = .7; cx.beginPath(); cx.moveTo(p.px, p.py); cx.lineTo(p.x, p.y); cx.stroke();
      }
      if (mode === 5 && i % 7 === 0 && branches.length) {
        var s = branches[i % branches.length];
        cx.strokeStyle = 'rgba(243,211,138,' + (alpha * .16) + ')'; cx.lineWidth = .6;
        cx.beginPath(); cx.moveTo(s[0], s[1]); cx.lineTo(s[2], s[3]); cx.stroke();
      }
      var rr = p.bright ? p.r * 1.9 : p.r;
      if (p.bright) {
        var gr = rr * 7, spr = sprite(p.c);
        if (spr) {
          cx.globalAlpha = alpha;
          cx.drawImage(spr, p.x - gr, p.y - gr, gr * 2, gr * 2);
          cx.globalAlpha = 1;
        }
        /* four-point flare, like the reference bokeh */
        cx.strokeStyle = 'rgba(' + p.c.join(',') + ',' + (alpha * .3) + ')';
        cx.lineWidth = .6; cx.beginPath();
        cx.moveTo(p.x - gr * .82, p.y); cx.lineTo(p.x + gr * .82, p.y);
        cx.moveTo(p.x, p.y - gr * .82); cx.lineTo(p.x, p.y + gr * .82);
        cx.stroke();
      }
      cx.fillStyle = 'rgba(' + p.c.join(',') + ',' + alpha + ')';
      cx.beginPath(); cx.arc(p.x, p.y, rr, 0, 6.283); cx.fill();
    }
    cx.globalCompositeOperation = 'source-over';
  }
  function init() {
    if (inited) return;
    cv = document.getElementById('starfield'); if (!cv) return;
    cx = cv.getContext('2d'); if (!cx) return;
    try { reducedMQL = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null; } catch (e) {}
    inited = true;
    cv.style.display = 'block';
    resize(); make();
    window.addEventListener('resize', function () { resize(); make(); });
    window.addEventListener('orientationchange', function () { setTimeout(function () { resize(); make(); }, 240); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
      else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
    window.addEventListener('pageshow', function () {
      if (document.hidden) return;
      last = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    });
    last = performance.now(); raf = requestAnimationFrame(frame);
  }
  var forcePaused = false;
  return {
    init: init,
    /* same contract as the WebGL sky: a hidden tab, an open dialog or the reader
       should not keep repainting a starfield nobody is looking at */
    setPaused: function (v) {
      forcePaused = !!v;
      if (forcePaused) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
      else if (!raf && P.length) { last = performance.now(); raf = requestAnimationFrame(frame); }
    },
    setMode: function (m) { mode = parseInt(m, 10) || 0; },
    setAwake: function (a) { awake = !!a; },
    /* the same place profile that drives the WebGL world drives the 2D sky */
    setScene: function (setting) { env = profileFor(setting); return env ? env.id : ''; },
    scene: function () { return env ? env.id : ''; },
    mode: function () { return mode; },
    info: function () { return { running: !!raf, count: P.length, mode: mode, env: env ? env.id : '' }; }
  };
})();
