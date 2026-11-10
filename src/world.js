/* storiesAI — the flying particle world.
   A tiny hand-written WebGL renderer (no libraries) that draws:
     · an aurora sky dome with stars, milky way and layered hill silhouettes
     · a forest of particle conifers, a golden dust path, a hot-air balloon
     · set pieces along the flight: a spiral vortex, a tree of light,
       rising lanterns, a ring of shooting stars, a village and a castle
   The camera flies down a winding path as the page scrolls, exactly like
   the reference experience. Falls back to the 2D sky (CStars) without WebGL. */
window.CWorld = (function () {
  var gl = null, cv = null, ok = false, dead = false, t0 = 0, time = 0, prog = 0, progT = 0;
  var W = 1, H = 1, dpr = 1, raf = null, paused = false;
  var progs = {}, bufs = {}, sky = null, quad = null;
  var moodTint = [0.55, 0.45, 0.95], flash = 0, nextFlash = 6;

  /* ---- re-dressing the world -------------------------------------------
     Every story setting owns a sky palette and a horizon. Tapping one in the
     builder eases the live sky towards it (`setScene`); nothing is rebuilt and
     no extra draw call is made — the transition is a handful of uniforms, so
     the phone budget does not move. ------------------------------------- */
  var SKY_BASE = {
    top: [0.015, 0.012, 0.055], bot: [0.065, 0.045, 0.175], acc: null,
    hillA: [0.035, 0.022, 0.014], hillF: [3.1, 7.3, 13.7], hillP: [0.0, 1.2, 2.4],
    base: -0.020, teeth: [0.0, 7.0], ground: [0.020, 0.017, 0.052], name: ''
  };
  var HORIZONS = {
    forest:   { a: [0.058, 0.050, 0.030], f: [5.3, 11.7, 21.9], p: [0.0, 1.7, 4.1], base: -0.032, teeth: [0.30, 9.0], ground: [0.012, 0.026, 0.021] },
    castle:   { a: [0.030, 0.026, 0.012], f: [2.3, 5.1, 9.7],   p: [0.6, 2.2, 3.4], base: -0.030, teeth: [1.00, 6.0], ground: [0.020, 0.017, 0.040] },
    city:     { a: [0.020, 0.013, 0.008], f: [2.9, 6.7, 12.9],  p: [0.3, 1.1, 2.9], base: -0.028, teeth: [1.35, 10.0], ground: [0.023, 0.019, 0.041] },
    mountain: { a: [0.078, 0.036, 0.016], f: [1.7, 4.3, 8.9],   p: [0.0, 0.9, 2.1], base: -0.030, teeth: [0.0, 7.0], ground: [0.018, 0.020, 0.048] },
    sea:      { a: [0.006, 0.003, 0.002], f: [2.1, 5.3, 9.1],   p: [0.0, 1.4, 2.6], base: -0.011, teeth: [0.0, 7.0], ground: [0.010, 0.028, 0.044] },
    farm:     { a: [0.026, 0.018, 0.010], f: [2.2, 4.9, 9.4],   p: [0.2, 1.6, 3.1], base: -0.028, teeth: [0.0, 7.0], ground: [0.026, 0.020, 0.030] },
    space:    { a: [0.000, 0.000, 0.000], f: [1.7, 3.1, 5.3],   p: [0.0, 0.0, 0.0], base: -2.000, teeth: [0.0, 7.0], ground: [0.014, 0.012, 0.040] }
  };
  HORIZONS.island = { a: [0.010, 0.005, 0.003], f: [2.4, 5.9, 11.3], p: [0.8, 2.1, 3.9], base: -0.012, teeth: [0.0, 7.0], ground: [0.011, 0.026, 0.040] };
  HORIZONS.glacier = { a: [0.070, 0.034, 0.020], f: [1.9, 5.1, 10.3], p: [0.4, 1.3, 2.7], base: -0.030, teeth: [0.0, 7.0], ground: [0.020, 0.026, 0.052] };

  function hexRGB(h) {
    h = String(h || '#ffffff').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (!isFinite(n)) n = 0xffffff;
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function skyCopy(o) {
    return { top: o.top.slice(), bot: o.bot.slice(), acc: o.acc ? o.acc.slice() : null,
      hillA: o.hillA.slice(), hillF: o.hillF.slice(), hillP: o.hillP.slice(),
      base: o.base, teeth: o.teeth.slice(), ground: o.ground.slice(), name: o.name || '' };
  }
  function skyLerp(dst, a, b, t) {
    var cols = ['top', 'bot', 'hillA', 'hillF', 'hillP', 'ground'], i, j;
    for (i = 0; i < cols.length; i++) {
      var d = dst[cols[i]], x = a[cols[i]], y = b[cols[i]];
      for (j = 0; j < 3; j++) d[j] = x[j] + (y[j] - x[j]) * t;
    }
    dst.base += (b.base - a.base) * t;
    for (i = 0; i < 2; i++) dst.teeth[i] += (b.teeth[i] - a.teeth[i]) * t;
    var aa = a.acc || moodTint, bb = b.acc || moodTint;
    if (!dst.acc) dst.acc = [0, 0, 0];
    for (i = 0; i < 3; i++) dst.acc[i] = aa[i] + (bb[i] - aa[i]) * t;
    dst.name = b.name;
  }

  /* ---- environmental motion state ---------------------------------------
     The four named profiles live in data.js (CDATA.ENVIRONMENTS); this module
     only eases their numbers. Everything here is a uniform, so switching a
     place never rebuilds a buffer or adds a draw call. */
  var MOTION_KEYS = ['drift', 'rise', 'sway', 'cluster', 'heightCap', 'flight', 'firefly', 'nebula', 'band', 'floor'];
  var MOTION_BASE = { drift: 0, rise: 0, sway: 0, cluster: 0, heightCap: 0,
    flight: 1, firefly: 0, nebula: 0, band: 24, floor: -2 };
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
  function motionCopy(o) {
    var r = {};
    MOTION_KEYS.forEach(function (k) { r[k] = num(o[k], MOTION_BASE[k]); });
    return r;
  }
  function motionLerp(dst, a, b, t) {
    MOTION_KEYS.forEach(function (k) { dst[k] = a[k] + (b[k] - a[k]) * t; });
  }
  function motionFromProfile(env) {
    var m = (env && env.motion) || {}, r = {};
    MOTION_KEYS.forEach(function (k) { r[k] = num(m[k], MOTION_BASE[k]); });
    return r;
  }

  var skyNow = skyCopy(SKY_BASE), skyGoal = skyCopy(SKY_BASE), skyFrom = skyCopy(SKY_BASE);
  var motNow = motionCopy(MOTION_BASE), motGoal = motionCopy(MOTION_BASE), motFrom = motionCopy(MOTION_BASE);
  var worldName = '', easeT0 = 0, EASE_MS = 1000;
  var reducedMQL = null;
  try { reducedMQL = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null; } catch (e) {}
  function calmMotion() {
    try {
      return !document.documentElement.classList.contains('force-motion') && !!(reducedMQL && reducedMQL.matches);
    } catch (e) { return false; }
  }
  function beginEase() {
    skyFrom = skyCopy(skyNow);
    motFrom = motionCopy(motNow);
    easeT0 = performance.now();
  }

  var LOW = false;   /* lighter particle budget on phones / weak GPUs */
  var reason = '', rendererName = '', lastNow = 0, fps = 0, ftSum = 0, ftN = 0, quality = 0, slowStreak = 0;

  /* ---------------------------------------------------------------- math */
  function persp(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
    return out;
  }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function lookAt(out, eye, ctr, up) {
    var z = norm([eye[0] - ctr[0], eye[1] - ctr[1], eye[2] - ctr[2]]);
    var x = norm(cross(up, z));
    var y = cross(z, x);
    out[0] = x[0]; out[1] = y[0]; out[2] = z[0]; out[3] = 0;
    out[4] = x[1]; out[5] = y[1]; out[6] = z[1]; out[7] = 0;
    out[8] = x[2]; out[9] = y[2]; out[10] = z[2]; out[11] = 0;
    out[12] = -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]);
    out[13] = -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]);
    out[14] = -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]);
    out[15] = 1;
    return out;
  }

  /* --------------------------------------------------------------- build */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  var P = [], C = [], S = [], SE = [];       /* shared arrays, split into chunks below */
  function add(x, y, z, r, g, b, size) {
    P.push(x, y, z); C.push(r, g, b); S.push(size); SE.push(Math.random());
  }
  function addc(x, y, z, col, size) { add(x, y, z, col[0], col[1], col[2], size); }

  var GOLD = [1.00, 0.83, 0.55], GOLD2 = [1.0, 0.93, 0.72], CREAM = [1.0, 0.96, 0.88];
  var ICE = [0.66, 0.72, 1.0], VIOLET = [0.72, 0.62, 1.0], TEAL = [0.55, 0.9, 0.85];
  var WARM = [1.0, 0.72, 0.42];

  /* ground height along the flight path (gentle hills) */
  function hillX(z) { return 5.2 * Math.sin(z * 0.031) + 2.4 * Math.sin(z * 0.071 + 1.1); }
  function groundY(x, z) {
    return 2.1 * Math.sin(z * 0.026) + 1.1 * Math.sin(z * 0.062 + 2) +
      0.6 * Math.sin(x * 0.21 + z * 0.07) + 0.35 * Math.sin(z * 0.13 - x * 0.11);
  }

  function conifer(x, z, h, tone) {
    var base = groundY(x, z), trunk = h * 0.13;
    /* trunk: a thin bright line of points */
    for (var i = 0; i < h * 7; i++) {
      var t = i / (h * 7);
      add(x + rnd(-0.05, 0.05), base + t * h, z + rnd(-0.05, 0.05), GOLD[0] * .7, GOLD[1] * .62, GOLD[2] * .45, rnd(.5, 1.1));
    }
    /* tiers of branches, each a cone shell with a spiky lower edge */
    var tiers = (LOW ? 4 : 6) + Math.round(h * (LOW ? .34 : .55));
    for (var k = 0; k < tiers; k++) {
      var f = (k + 1) / tiers;                       /* 0 bottom → 1 top */
      var y0 = base + trunk + (h - trunk) * f * 0.92;
      var radius = (1 - f) * h * 0.235 + 0.10;
      var n = Math.round(radius * (LOW ? 70 : 120) + (LOW ? 14 : 26));
      for (var j = 0; j < n; j++) {
        var a = Math.random() * 6.28318;
        var rr = radius * (0.55 + Math.pow(Math.random(), 0.6) * 0.55);
        var droop = -Math.pow(rr / (radius + 0.001), 2) * radius * 0.62;
        var shade = 0.55 + 0.45 * (1 - rr / (radius + 0.001));
        var col = tone === 'warm' ? [ICE[0] * shade + .18, ICE[1] * shade + .1, ICE[2] * shade]
          : [ICE[0] * shade, ICE[1] * shade, ICE[2] * shade * 1.02];
        if (Math.random() > .965) col = GOLD2;                       /* a few gold sparks */
        add(x + Math.cos(a) * rr, y0 + droop + rnd(-.06, .06), z + Math.sin(a) * rr, col[0], col[1], col[2], rnd(.45, 1.25));
      }
    }
    /* the tip */
    for (var m = 0; m < 14; m++) add(x + rnd(-.1, .1), base + h + rnd(-.2, .2), z + rnd(-.1, .1), CREAM[0], CREAM[1], CREAM[2], rnd(.6, 1.6));
  }

  function goldenPath() {
    for (var z = 6; z > -250; z -= 0.16) {
      var cx = hillX(z) * 0.55;
      var spread = 0.5 + Math.abs(z) * 0.004;
      var n = LOW ? 2 : 3;
      for (var i = 0; i < n; i++) {
        var x = cx + (Math.random() - 0.5) * spread * 2.0;
        var y = groundY(x, z) + 0.04 + Math.pow(Math.random(), 3) * 1.4;
        var col = Math.random() > .7 ? GOLD2 : GOLD;
        add(x, y, z + rnd(-.1, .1), col[0], col[1], col[2], rnd(.5, 1.5));
      }
    }
    /* the dense glowing carpet under the camera */
    for (var k = 0; k < (LOW ? 1200 : 2600); k++) {
      var zz = rnd(14, -80);
      var xx = hillX(zz) * 0.55 + (Math.random() - .5) * (1.1 + Math.abs(zz) * .045);
      add(xx, groundY(xx, zz) + rnd(0, .35), zz, GOLD[0], GOLD[1] * rnd(.95, 1.05), GOLD[2] * .9, rnd(.3, 1.0));
    }
  }

  function forest() {
    var spots = [
      [-19, -22, 17], [-27, -40, 20], [-16, -58, 22], [-31, -74, 18], [-20, -92, 24],
      [18, -28, 16], [26, -48, 21], [17, -66, 19], [30, -84, 23], [21, -102, 20],
      [-38, -34, 15], [-44, -62, 17], [38, -40, 16], [45, -76, 18], [-34, -110, 16],
      [36, -118, 17], [-48, -100, 14], [50, -96, 15], [-24, -126, 21], [22, -130, 20]
    ];
    if (LOW) spots = spots.filter(function (_, i) { return i % 2 === 0; });
    spots.forEach(function (s, i) {
      conifer(s[0] + rnd(-1.5, 1.5), s[1], s[2], i % 4 === 0 ? 'warm' : 'cool');
    });
    /* the wall of trees far ahead, like the reference horizon */
    for (var i = 0; i < (LOW ? 12 : 26); i++) {
      var z = -150 - Math.random() * 90;
      var x = (Math.random() - .5) * 120;
      conifer(x, z, rnd(14, 26), 'cool');
    }
  }

  function balloon(x, y, z) {
    /* envelope: a lattice of dots on an ellipsoid */
    for (var i = 0; i < (LOW ? 900 : 2200); i++) {
      var u = Math.random() * Math.PI * 2, v = Math.acos(2 * Math.random() - 1);
      var rx = 1.05, ry = 1.3;
      var px = Math.sin(v) * Math.cos(u) * rx, py = Math.cos(v) * ry, pz = Math.sin(v) * Math.sin(u) * rx;
      if (Math.random() > .45) { px *= .55; pz *= .55; py *= .96; }  /* gores / folds */
      var col = Math.random() > .5 ? VIOLET : GOLD;
      add(x + px, y + py, z + pz, col[0], col[1], col[2], rnd(.4, 1.0));
    }
    /* basket + ropes */
    for (var k = 0; k < 120; k++) {
      var a = Math.random() * 6.283;
      add(x + Math.cos(a) * .22, y - 1.85 + rnd(0, .3), z + Math.sin(a) * .22, GOLD[0], GOLD[1], GOLD[2], .9);
    }
    for (var r = 0; r < 90; r++) {
      var f = r / 90;
      add(x + rnd(-.34, .34), y - 1.35 - f * .5, z + rnd(-.34, .34), GOLD[0] * .8, GOLD[1] * .8, GOLD[2] * .7, .55);
    }
  }

  function castle(x, z, scale) {
    var base = groundY(x, z);
    function tower(cx, cz, w, h) {
      for (var i = 0; i < h * 46; i++) {
        var f = Math.random();
        var a = Math.random() * 6.283;
        var rr = w * (0.5 + Math.random() * 0.5);
        var col = Math.random() > .55 ? WARM : GOLD;
        add(cx + Math.cos(a) * rr, base + f * h, cz + Math.sin(a) * rr, col[0], col[1], col[2], rnd(.5, 1.5));
      }
      /* crenellations */
      for (var k = 0; k < 26; k++) {
        var a2 = k / 26 * 6.283;
        add(cx + Math.cos(a2) * w, base + h + rnd(0, .5), cz + Math.sin(a2) * w, CREAM[0], CREAM[1], CREAM[2], 1.2);
      }
    }
    tower(x, z, 2.1 * scale, 9 * scale);
    tower(x - 4 * scale, z - 5 * scale, 1.5 * scale, 6.4 * scale);
    tower(x + 4.4 * scale, z - 6 * scale, 1.6 * scale, 7.2 * scale);
    /* the long wall with windows */
    for (var i = 0; i < 900; i++) {
      var f2 = Math.random();
      add(x + rnd(-4.4, 4.6) * scale, base + f2 * 3.4 * scale, z + rnd(-.4, .4) * scale,
        WARM[0] * .9, WARM[1] * .8, WARM[2] * .7, rnd(.4, 1.0));
    }
  }

  function spiralVortex(cx, cy, cz) {
    for (var i = 0; i < (LOW ? 4200 : 11000); i++) {
      var f = i / 9000;
      var a = f * 30 + Math.random() * .4;
      var r = 1.2 + f * 26;
      var y = (f - .5) * 34;
      var col = Math.random() > .7 ? GOLD : (Math.random() > .5 ? VIOLET : ICE);
      add(cx + Math.cos(a) * r * rnd(.94, 1.06), cy + y * rnd(.96, 1.04), cz + Math.sin(a) * r * rnd(.94, 1.06),
        col[0], col[1], col[2], rnd(.4, 1.3));
    }
  }

  function treeOfLight(x, z, h) {
    var base = groundY(x, z);
    function branch(bx, by, bz, dx, dy, dz, len, depth) {
      var n = Math.round(len * 16);
      for (var i = 0; i < n; i++) {
        var f = i / n;
        var col = depth > 3 ? GOLD2 : (depth > 2 ? GOLD : [0.72, 0.78, 1.0]);
        add(bx + dx * len * f + rnd(-.1, .1), by + dy * len * f + rnd(-.1, .1), bz + dz * len * f + rnd(-.1, .1),
          col[0], col[1], col[2], rnd(.5, 1.5) * (0.6 + depth * .12));
      }
      if (depth <= 0) return;
      var ex = bx + dx * len, ey = by + dy * len, ez = bz + dz * len;
      for (var k = 0; k < 2; k++) {
        var sp = rnd(.35, .7), ang = Math.random() * 6.283;
        var nx = dx + Math.cos(ang) * sp, ny = dy + rnd(.1, .5), nz = dz + Math.sin(ang) * sp;
        var l = Math.hypot(nx, ny, nz) || 1;
        branch(ex, ey, ez, nx / l, ny / l, nz / l, len * rnd(.6, .78), depth - 1);
      }
    }
    branch(x, base, z, 0, 1, 0, h * .38, 4);
  }

  function lanterns(x, z, count) {
    for (var i = 0; i < count; i++) {
      var lx = x + rnd(-11, 11), lz = z + rnd(-16, 16), ly = groundY(lx, lz) + rnd(1.2, 11);
      var col = Math.random() > .35 ? WARM : GOLD2;
      for (var k = 0; k < 40; k++) {
        add(lx + rnd(-.16, .16), ly + rnd(-.2, .2), lz + rnd(-.16, .16), col[0], col[1], col[2], rnd(.5, 1.4));
      }
      for (var h = 0; h < 16; h++) add(lx + rnd(-.03, .03), ly - .3 - h * .09, lz, GOLD[0] * .5, GOLD[1] * .45, GOLD[2] * .4, .4);
    }
  }

  function ringOfStars(cx, cy, cz, r) {
    for (var i = 0; i < (LOW ? 1800 : 5200); i++) {
      var a = Math.random() * 6.283;
      var rr = r * (1 + rnd(-.05, .05));
      var col = Math.random() > .5 ? CREAM : ICE;
      add(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .62 + rnd(-.4, .4), cz + Math.sin(a) * rr * .25 + rnd(-.4, .4),
        col[0], col[1], col[2], rnd(.5, 1.6));
    }
    /* the long streaks that make it read as shooting stars */
    for (var k = 0; k < 34; k++) {
      var a2 = k / 34 * 6.283;
      for (var j = 0; j < 26; j++) {
        var f = j / 26;
        var ang = a2 + f * .34;
        var rr2 = r * (1 + f * .1);
        add(cx + Math.cos(ang) * rr2, cy + Math.sin(ang) * rr2 * .62, cz + Math.sin(ang) * rr2 * .25,
          CREAM[0], CREAM[1], CREAM[2], (1 - f) * 1.9 + .4);
      }
    }
  }

  function groundCover() {
    for (var i = 0; i < (LOW ? 4200 : 11000); i++) {
      var z = rnd(16, -260), x = rnd(-70, 70);
      var y = groundY(x, z) + Math.pow(Math.random(), 2.2) * 2.2;
      var near = 1 - Math.min(1, Math.abs(x - hillX(z) * .55) / 26);
      var col = Math.random() > .45 ? GOLD : (Math.random() > .5 ? ICE : VIOLET);
      var dim = near > .5 ? 1.15 : .68;
      add(x, y, z, col[0] * dim, col[1] * dim, col[2] * dim, rnd(.30, 1.05));
    }
  }


  function dust() {
    for (var i = 0; i < (LOW ? 1200 : 3200); i++) {
      var z = rnd(20, -300), x = rnd(-40, 40), y = rnd(-2, 30);
      var col = Math.random() > .6 ? VIOLET : ICE;
      add(x, y, z, col[0] * .7, col[1] * .7, col[2] * .9, rnd(.3, 1.0));
    }
  }

  function buildWorld() {
    goldenPath();
    forest();
    balloon(hillX(-64) + 9.5, groundY(hillX(-64) + 9.5, -64) + 9.5, -64);
    balloon(hillX(-132) - 12, groundY(hillX(-132) - 12, -132) + 13, -134);
    castle(hillX(-292) + 3, -292, 1.7);
    spiralVortex(hillX(-96) - 8, groundY(hillX(-96), -96) + 22, -104);
    treeOfLight(hillX(-158) + 9, -158, 30);
    lanterns(hillX(-205), -205, 30);
    ringOfStars(hillX(-248), groundY(hillX(-248), -248) + 22, -252, 15);
    dust();
    groundCover();
  }

  /* ------------------------------------------------------------------ book
     The reference experience's signature moment: an open book made of dust that
     gathers out of a cloud, turns a page as you scroll and dissolves back into
     stars when you leave the prologue. All of the movement lives in the vertex
     shader — the CPU only sends a frame (position, basis, scale) and two
     weights, so a phone pays almost nothing for it. */
  var book = null, bookP = null;

  /* sample a string from a 2D canvas so the pages carry real letterforms */
  function bookType(text, size, italic) {
    var out = [];
    try {
      var c = document.createElement('canvas');
      c.width = 288; c.height = 96;
      var x = c.getContext('2d');
      if (!x || !x.getImageData) return out;
      x.clearRect(0, 0, c.width, c.height);
      x.fillStyle = '#fff';
      x.font = (italic ? 'italic ' : '') + size + 'px Georgia, "Times New Roman", serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(text, c.width / 2, c.height / 2);
      var data = x.getImageData(0, 0, c.width, c.height).data;
      for (var yy = 0; yy < c.height; yy += 2) {
        for (var xx = 0; xx < c.width; xx += 2) {
          if (data[(yy * c.width + xx) * 4 + 3] > 120) out.push(xx / c.width, yy / c.height);
        }
      }
    } catch (e) {}
    return out;
  }

  function buildBook() {
    var side = [], uv = [], col = [], sz = [], sd = [], tr = [];
    function pt(s, u, v, c, size, turn) {
      side.push(s); uv.push(u, v); col.push(c[0], c[1], c[2]);
      sz.push(size); sd.push(Math.random()); tr.push(turn || 0);
    }
    var PAPER = [0.60, 0.58, 0.70], INK = [0.80, 0.76, 0.66];
    var GOLD = [1.0, 0.84, 0.52], CREAM = [1.0, 0.95, 0.86];

    /* paper: barely-there dust, so the writing reads instead of the noise */
    var cols = LOW ? 13 : 19, rows = LOW ? 17 : 27;
    for (var s1 = -1; s1 <= 1; s1 += 2) {
      for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
          var u = (i + Math.random()) / cols;
          var v = (j + Math.random()) / rows;
          var edge = Math.min(u, 1 - u);
          var dim = 0.10 + 0.30 * Math.min(1, edge * 5.0) * (0.6 + Math.random() * 0.8);
          pt(s1, u, v, [PAPER[0] * dim, PAPER[1] * dim, PAPER[2] * dim], rnd(0.3, 0.55), s1 > 0 ? 1 : 0);
        }
      }
    }

    /* the handwriting: rows of dots, ragged endings, a first-line indent */
    var lines = LOW ? 13 : 20;
    for (var s2 = -1; s2 <= 1; s2 += 2) {
      for (var l = 0; l < lines; l++) {
        var v0 = 0.27 + (l / lines) * 0.55;
        var start = 0.11 + (l === 0 ? 0.05 : 0) + rnd(0, 0.012);
        var end = 0.88 - Math.random() * 0.2;
        var n = LOW ? 26 : 38;
        for (var k = 0; k < n; k++) {
          var u2 = start + (end - start) * (k / n) + rnd(-0.006, 0.006);
          var ink = 0.62 + Math.random() * 0.42;
          pt(s2, u2, v0 + rnd(-0.007, 0.007), [INK[0] * ink, INK[1] * ink, INK[2] * ink], rnd(0.28, 0.52), s2 > 0 ? 1 : 0);
        }
      }
    }

    /* the illuminated drop cap: a ring with a tail, drawn in particles so it
       reads on every device (sampled type below is the bonus) */
    var capU = 0.20, capV = 0.245, capRu = 0.072, capRv = 0.082;
    for (var a1 = 0; a1 < 96; a1++) {
      var th = (a1 / 96) * Math.PI * 2;
      pt(-1, capU + Math.cos(th) * capRu, capV + Math.sin(th) * capRv, GOLD, rnd(0.7, 1.15), 0);
      if (a1 % 3 === 0) pt(-1, capU + Math.cos(th) * capRu * 0.8, capV + Math.sin(th) * capRv * 0.8, GOLD, rnd(0.35, 0.6), 0);
    }
    for (var tq = 0; tq < 26; tq++) {
      var fq = tq / 26;
      pt(-1, capU + 0.015 + fq * 0.082, capV + 0.045 + fq * 0.07, GOLD, rnd(0.6, 1.0), 0);
    }
    /* the chapter ornament: a gold rule with tapered ends */
    for (var r2 = -16; r2 <= 16; r2++) {
      var f2 = Math.abs(r2) / 16;
      pt(1, 0.5 + r2 * 0.0105, 0.225, GOLD, 0.55 * (1 - f2 * 0.55), 1);
      if (r2 % 4 === 0) pt(1, 0.5 + r2 * 0.0105, 0.232, [1.0, 0.9, 0.65], 0.45, 1);
    }
    /* real letterforms sampled from a canvas, when the browser gives us one */
    var head = bookType('Capitolo primo', 17, false);
    for (var hi = 0; hi < head.length; hi += 2) pt(1, 0.17 + head[hi] * 0.68, 0.145 + head[hi + 1] * 0.075, GOLD, rnd(0.5, 0.9), 1);
    var n1 = bookType('12', 13, false), n2 = bookType('13', 13, false);
    for (var q1 = 0; q1 < n1.length; q1 += 2) pt(-1, 0.46 + n1[q1] * 0.1, 0.9 + n1[q1 + 1] * 0.03, CREAM, 0.5, 0);
    for (var q2 = 0; q2 < n2.length; q2 += 2) pt(1, 0.46 + n2[q2] * 0.1, 0.9 + n2[q2 + 1] * 0.03, CREAM, 0.5, 1);

    /* rules under the headings and the bright seam of the spine */
    for (var r = 0; r < 46; r++) {
      pt(1, 0.22 + (r / 45) * 0.5, 0.225, GOLD, 0.42, 1);
      pt(-1, 0.22 + (r / 45) * 0.5, 0.855, [0.55, 0.5, 0.42], 0.4, 0);
    }
    var seams = LOW ? 44 : 84;
    for (var sp = 0; sp <= seams; sp++) {
      pt(-1, 0.003, sp / seams, GOLD, rnd(0.35, 0.75), 0);
      pt(1, 0.003, sp / seams, GOLD, rnd(0.35, 0.75), 1);
    }

    function buf(arr, n) {
      var b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
      return { b: b, size: n, count: arr.length / n };
    }
    return {
      count: side.length,
      side: buf(side, 1), uv: buf(uv, 2), col: buf(col, 3),
      size: buf(sz, 1), seed: buf(sd, 1), turn: buf(tr, 1)
    };
  }

  /* ------------------------------------------------------------- shaders */
  var VERT = [
    'attribute vec3 aPos; attribute vec3 aCol; attribute float aSize; attribute float aSeed;',
    'uniform mat4 uProj; uniform mat4 uView; uniform float uTime; uniform float uPixel; uniform float uAlpha; uniform float uSizeMax;',
    'uniform float uMotion; uniform float uDrift; uniform float uRise; uniform float uSway;',
    'uniform float uCluster; uniform float uHeightCap; uniform float uBand; uniform float uFloor; uniform float uFirefly;',
    'varying vec3 vCol; varying float vA;',
    'float vhash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }',
    'float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);',
    '  return mix(mix(vhash(i),vhash(i+vec2(1.0,0.0)),u.x), mix(vhash(i+vec2(0.0,1.0)),vhash(i+vec2(1.0,1.0)),u.x), u.y); }',
    'void main(){',
    '  vec3 p = aPos;',
    '  float mt = uTime * uMotion;',
    '  float seed = aSeed * 6.2831853;',
    '  /* baseline idle breath, faded out when the cosmic drift takes over */',
    '  p.x += sin(mt*0.55 + seed)*0.10*(1.0-uDrift);',
    '  p.y += cos(mt*0.42 + seed)*0.09*(1.0-uDrift);',
    '  p.z += sin(mt*0.33 + seed)*0.08*(1.0-uDrift);',
    '  /* cosmic drift: slow, multi-directional, gravity-free */',
    '  p.x += (sin(mt*0.23 + seed) + 0.45*cos(mt*0.11 + aSeed*12.566))*0.85*uDrift;',
    '  p.y += (cos(mt*0.19 + seed*1.7) + 0.50*sin(mt*0.13 + aSeed*3.1))*0.85*uDrift;',
    '  p.z += (sin(mt*0.17 + seed*0.6) + 0.60*cos(mt*0.09 + aSeed*6.283))*0.85*uDrift;',
    '  /* reef current: horizontal sine sway acting on the plankton */',
    '  p.x += sin(mt*(0.55 + aSeed*0.55) + seed)*uSway;',
    '  p.z += cos(mt*(0.37 + aSeed*0.42) + aSeed*3.1)*uSway*0.35;',
    '  /* reef rise: invert the idle Y motion into a slow upward current */',
    '  float riseFade = 1.0;',
    '  if (uRise > 0.0001) {',
    '    float span = max(1.0, uBand);',
    '    float h = mod((p.y - uFloor) + mt*uRise, span);',
    '    p.y = uFloor + h;',
    '    riseFade = smoothstep(0.0,0.10,h/span)*(1.0-smoothstep(0.86,1.0,h/span));',
    '  }',
    '  /* cloud puffs: a spatial noise threshold gathers points into dense,',
    '     localized clusters, then flattens each cluster towards a shared',
    '     horizontal plane so it reads as a cloud rather than a column */',
    '  if (uCluster > 0.0001) {',
    '    float n = vnoise(p.xz*0.11 + vec2(2.3, 5.7))*0.75',
    '            + vnoise(p.xz*0.037 + vec2(9.1, 1.3))*0.25;',
    '    float puff = smoothstep(1.0 - uCluster, 1.0 - uCluster + 0.18, n);',
    '    vec2 cell = floor(p.xz/7.0);',
    '    vec2 cc = (cell + 0.5)*7.0;',
    '    float cy = uFloor + 2.0 + 8.0*vnoise(cell*0.23 + vec2(0.7, 4.2));',
    '    p.xz = mix(p.xz, cc, puff*0.62);',
    '    p.y = mix(p.y, cy + (p.y - cy)*0.18, puff);',
    '  }',
    '  /* firefly canopy: softly compress high points below the dropped ceiling */',
    '  if (uHeightCap > 0.0001) {',
    '    float rel = p.y - uFloor;',
    '    if (rel > 0.0) p.y = uFloor + uHeightCap*(1.0 - exp(-rel/uHeightCap));',
    '  }',
    '  vec4 mv = uView * vec4(p,1.0);',
    '  float d = -mv.z;',
    '  gl_Position = uProj * mv;',
    '  float tw = 0.62 + 0.38*sin(uTime*(0.7+aSeed*2.3)+aSeed*40.0);',
    '  /* firefly blink: absolute time-based sine, one phase per vertex */',
    '  float blink = 1.0;',
    '  if (uFirefly > 0.0001) {',
    '    float firefly = abs(sin(uTime * aSeed));',
    '    blink = mix(1.0, 0.16 + 0.84*firefly, uFirefly * uMotion);',
    '  }',
    '  gl_PointSize = clamp(aSize * uPixel * tw * (105.0/max(d,0.45)), 0.9, uSizeMax*uPixel);',
    '  vCol = aCol;',
    '  vA = uAlpha * smoothstep(0.6,4.0,d) * (1.0 - smoothstep(190.0,320.0,d)) * (0.55+0.45*tw) * blink * riseFade;',
    '}'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'varying vec3 vCol; varying float vA;',
    'void main(){',
    '  vec2 q = gl_PointCoord - 0.5;',
    '  float d = length(q);',
    '  float core = exp(-d*d*32.0);',
    '  float halo = exp(-d*6.5)*0.20;',
    '  float a = (core*0.95+halo*0.55)*smoothstep(0.5,0.38,d)*vA;',
    '  if(a < 0.004) discard;',
    '  gl_FragColor = vec4(mix(vCol, vec3(1.0), core*0.22), a);',
    '}'
  ].join('\n');

  /* the book: parametric pages, a hinged page turn, edge dust, assemble morph */
  var BOOK_V = [
    'attribute float aSide; attribute vec2 aUV; attribute vec3 aCol; attribute float aSize; attribute float aSeed; attribute float aTurn;',
    'uniform mat4 uProj; uniform mat4 uView;',
    'uniform vec3 uBookPos; uniform vec3 uBookRight; uniform vec3 uBookUp; uniform vec3 uBookZ;',
    'uniform float uBookScale; uniform float uTime; uniform float uPixel; uniform float uAlpha; uniform float uSizeMax;',
    'uniform float uAssemble; uniform float uTurn;',
    'varying vec3 vCol; varying float vA;',
    'void main(){',
    '  float u = aUV.x, v = aUV.y;',
    '  vec3 p = vec3(aSide * u * 1.12, (0.5 - v) * 1.15, 0.0);',
    '  float ang = uTurn * 3.14159 * aTurn;',
    '  float ca = cos(ang), sa = sin(ang);',
    '  p = vec3(p.x * ca - p.z * sa, p.y, p.x * sa + p.z * ca);',
    '  float bow = sin(u * 3.14159);',
    '  p.z += bow * 0.055 + sin(ang) * u * 0.20 * aTurn;',
    '  p.z += sin(uTime * 0.7 + v * 2.0 + aSide) * 0.012;',
    '  p.y += sin(uTime * 0.5 + aSide * 0.6 + u * 1.4) * 0.010;',
    '  float dust = aTurn * sin(ang) * smoothstep(0.45, 1.0, u);',
    '  p += vec3(sin(aSeed*41.0 + uTime*2.1), cos(aSeed*27.0 + uTime*1.6), sin(aSeed*19.0 + uTime*2.7)) * dust * 0.10;',
    '  float t = clamp((uAssemble - aSeed * 0.42) / 0.58, 0.0, 1.0);',
    '  t = t * t * (3.0 - 2.0 * t);',
    '  vec3 cloud = vec3((fract(aSeed*91.7)-0.5)*6.0, (fract(aSeed*47.3)-0.5)*3.4, (fract(aSeed*13.9)-0.5)*3.2);',
    '  p = mix(cloud, p, t);',
    '  vec3 world = uBookPos + (uBookRight * p.x + uBookUp * p.y + uBookZ * p.z) * uBookScale;',
    '  vec4 mv = uView * vec4(world, 1.0);',
    '  gl_Position = uProj * mv;',
    '  float d = max(0.5, -mv.z);',
    '  float tw = 0.62 + 0.38 * sin(uTime * (0.8 + aSeed * 2.4) + aSeed * 39.0);',
    '  vCol = mix(aCol, vec3(1.0, 0.86, 0.52), dust * 0.85);',
    '  vA = uAlpha * tw * (0.55 + 0.45 * t) * (1.0 - dust * 0.3 * aSeed);',
    '  gl_PointSize = clamp(aSize * uPixel * uBookScale * 2.6 * (7.5 / d), 0.9, uSizeMax * uPixel);',
    '}'
  ].join('\n');

  /* full-screen sky: gradient, aurora veils, milky way, hill silhouettes */
  var SKY_V = 'attribute vec2 aP; varying vec2 vP; void main(){ vP = aP; gl_Position = vec4(aP,0.999,1.0); }';
  /* The sky is a full-screen fragment shader, and about eight noise look-ups
     per pixel is nothing for a laptop GPU and far too much for a phone one —
     it was the reason the phone crawled while the laptop sailed. `low` builds a
     phone variant: 2 octaves instead of 5, no second fbm pass, two shooting
     stars. It also fixes the moon: `pow(md, 1600.0)` overflows to Inf on GPUs
     whose "highp" is really medium (most Adreno/Mali parts), which is what
     painted that huge white blob over the hero. */
  function skyFragment(low) {
    var OCT = low ? 2 : 5;             /* aurora octaves */
    var RAYS = low ? 'fbm' : 'fbm3';   /* ray-detail pass */
    var STARS = low ? 2 : 3;           /* shooting stars */
    var o = [];
    var add = function (l) { o.push(l); };
    add('precision highp float;');
    add('varying vec2 vP;');
    add('uniform vec2 uRes; uniform float uTime; uniform vec3 uFwd,uRight,uUp; uniform float uTanHalf,uAspect;');
    add('uniform vec3 uTop,uBot,uHor,uAcc,uMoon; uniform float uFlash; uniform float uNebula; uniform vec2 uRes2;');
    /* the horizon belongs to the story setting: three sine harmonics, a blocky
       term for crenellations and city roofs, and the ground tint. All of it is
       uniform state, so re-dressing the world costs no extra shader work. */
    add('uniform vec3 uHillA,uHillF,uHillP,uGroundCol; uniform float uHillBase; uniform vec2 uTeeth;');
    add('float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }');
    add('float noise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);');
    add('  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }');
    add('float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<' + OCT + ';i++){ v+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return v; }');
    add('float fbm3(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<3;i++){ v+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return v; }');
    /* a vibrant three-octave gas cloud: the moon's replacement for Outer Space */
    add('vec3 nebulaColor(vec2 p){');
    add('  float n1 = fbm3(p);');
    add('  float n2 = fbm3(p*1.9 + vec2(3.7,1.1));');
    add('  float n3 = fbm3(p*0.7 - vec2(1.4,2.8));');
    add('  vec3 c1 = vec3(0.58,0.10,0.92);');
    add('  vec3 c2 = vec3(0.08,0.58,0.98);');
    add('  vec3 c3 = vec3(1.00,0.25,0.58);');
    add('  vec3 c4 = vec3(1.00,0.72,0.28);');
    add('  vec3 c = mix(c1, c2, smoothstep(0.22,0.78,n1));');
    add('  c = mix(c, c3, smoothstep(0.32,0.86,n2)*0.78);');
    add('  c += c4 * pow(smoothstep(0.55,1.0,n3), 2.0) * 0.62;');
    add('  return c;');
    add('}');
    add('void main(){');
    add('  vec2 ndc = vP;');
    add('  vec3 dir = normalize(uFwd + uRight*(ndc.x*uTanHalf*uAspect) + uUp*(ndc.y*uTanHalf));');
    add('  float h = dir.y;');
    add('  vec3 col = mix(uBot, uTop, smoothstep(-0.05,0.62,h));');
    add('  col += uHor * exp(-abs(h-0.01)*13.0) * 0.34;');
    add('  float ang = atan(dir.z, dir.x);');
    add('  float n = fbm(vec2(ang*2.4 + uTime*0.012, h*4.6 - uTime*0.02));');
    add('  float rays = 0.6 + 0.8*' + RAYS + '(vec2(ang*15.0 + uTime*0.03, h*1.5 + uTime*0.01));');
    add('  float veils = pow(n,3.0)*rays*smoothstep(0.06,0.3,h)*(1.0-smoothstep(0.32,0.78,h));');
    add('  col += mix(uHor,uAcc,0.55) * veils * 0.55;');
    add('  float via = exp(-pow(dot(dir, normalize(vec3(0.18,0.77,0.6)))/0.14, 2.0));');
    if (low) add('  via *= 0.95;');
    else add('  via *= 0.5 + 0.9*fbm3(vec2(ang*3.0,h*6.0));');
    add('  col += mix(uAcc, vec3(0.92,0.9,1.0), 0.6) * via * smoothstep(0.08,0.4,h) * 0.10;');
    add('  vec2 sc = vec2(ang*38.0, h*70.0);');
    add('  float st = step(0.9975, hash(floor(sc)));');
    add('  float tw = 0.55+0.45*sin(uTime*2.0 + hash(floor(sc))*40.0);');
    add('  col += vec3(st*tw*0.85) * smoothstep(0.04,0.5,h);');
    add('  float hz = uHillBase + uHillA.x*sin(ang*uHillF.x+uHillP.x) + uHillA.y*sin(ang*uHillF.y+uHillP.y) + uHillA.z*sin(ang*uHillF.z+uHillP.z);');
    add('  hz += uTeeth.x * 0.026 * step(0.5, fract(ang*uTeeth.y));');
    add('  float ground = 1.0 - smoothstep(hz-0.012, hz+0.012, h);');
    add('  vec3 g = uGroundCol + uHor*0.05;');
    add('  col = mix(col, g, ground);');
    add('  col += vec3(0.55,0.6,1.0) * uFlash * 0.35 * (1.0-ground);');
    /* the moon: measured as an angular distance, never as a huge power.
       uNebula morphs this exact disc + glow into a coloured gas cloud. */
    add('  float mdist = length(dir - normalize(uMoon));');
    add('  float disc = 1.0 - smoothstep(0.0155, 0.0210, mdist);');
    add('  float glowM = exp(-800.0*mdist*mdist)*0.35 + exp(-60.0*mdist*mdist)*0.09;');
    add('  vec3 moonCol = vec3(1.0,0.97,0.88) * (disc * 2.2 + glowM);');
    add('  vec3 nebCol = vec3(0.0);');
    add('  if (uNebula > 0.001) {');
    add('    vec2 np = vec2(ang*2.2, h*3.4) + vec2(uTime*0.012, -uTime*0.008);');
    add('    float cloud = fbm3(np*1.7) * fbm3(np*3.4 + vec2(2.0,1.0));');
    add('    float mask = exp(-mdist*mdist*3.5) * (1.0 - smoothstep(0.18,1.0,mdist));');
    add('    nebCol = nebulaColor(np*1.5) * (0.25 + 1.7*cloud) * mask * 1.6;');
    add('  }');
    add('  col += mix(moonCol, nebCol, uNebula) * smoothstep(0.02,0.2,h);');
    add('  for (int i=0;i<' + STARS + ';i++){');
    add('    float fi = float(i);');
    add('    float t = fract(uTime*0.055 + fi*0.37);');
    add('    vec2 a = vec2(-1.35 + fi*1.1, 1.15 - fi*0.45);');
    add('    vec2 b = vec2(a.x + 0.42, a.y - 0.30);');
    add('    vec2 p = mix(a, b, t);');
    add('    vec2 pa = ndc - p, ba = b - a;');
    add('    float hh = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);');
    add('    float dline = length(pa - ba*hh);');
    add('    float streak = (1.0 - smoothstep(0.0, 0.004, dline)) * (1.0 - smoothstep(0.55, 1.0, hh)) * (1.0 - smoothstep(0.0,0.35,abs(hh-1.0)));');
    add('    col += vec3(0.95,0.92,1.0) * streak * 0.85 * (0.35 + 0.65*sin(t*3.14159));');
    add('  }');
    add('  col += (hash(gl_FragCoord.xy)-0.5)*(1.0/255.0);');
    add('  gl_FragColor = vec4(col,1.0);');
    add('}');
    return o.join('\n');
  }

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('shader', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  function program(vs, fs, attribs) {
    var p = gl.createProgram();
    var v = shader(gl.VERTEX_SHADER, vs), f = shader(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    gl.attachShader(p, v); gl.attachShader(p, f);
    attribs.forEach(function (a, i) { gl.bindAttribLocation(p, i, a); });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn('link', gl.getProgramInfoLog(p)); return null; }
    var o = { p: p, u: {}, a: {} };
    ['uProj', 'uView', 'uTime', 'uPixel', 'uAlpha', 'uSizeMax',
      'uBookPos', 'uBookRight', 'uBookUp', 'uBookZ', 'uBookScale', 'uAssemble', 'uTurn',
      'uMotion', 'uDrift', 'uRise', 'uSway', 'uCluster', 'uHeightCap', 'uBand', 'uFloor', 'uFirefly'
    ].forEach(function (n) { o.u[n] = gl.getUniformLocation(p, n); });
    ['uRes', 'uFwd', 'uRight', 'uUp', 'uTanHalf', 'uAspect', 'uTop', 'uBot', 'uHor', 'uAcc', 'uFlash', 'uMoon', 'uNebula', 'uRes2',
      'uHillA', 'uHillF', 'uHillP', 'uHillBase', 'uTeeth', 'uGroundCol'].forEach(function (n) { o.u[n] = gl.getUniformLocation(p, n); });
    attribs.forEach(function (n) { o.a[n] = gl.getAttribLocation(p, n); });
    return o;
  }

  function makeBuffer(data, size) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return { b: b, size: size, count: data.length / size };
  }

  function splitChunks(limit) {
    /* keep every draw small enough for any driver, one buffer per 60k points */
    var total = S.length, step = 60000, out = [];
    for (var s = 0; s < total; s += step) {
      var e = Math.min(total, s + step), n = e - s;
      var pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n), sd = new Float32Array(n);
      for (var i = 0; i < n; i++) {
        pos[i * 3] = P[(s + i) * 3]; pos[i * 3 + 1] = P[(s + i) * 3 + 1]; pos[i * 3 + 2] = P[(s + i) * 3 + 2];
        col[i * 3] = C[(s + i) * 3]; col[i * 3 + 1] = C[(s + i) * 3 + 1]; col[i * 3 + 2] = C[(s + i) * 3 + 2];
        sz[i] = S[s + i]; sd[i] = SE[s + i];
      }
      out.push({
        pos: makeBuffer(pos, 3), col: makeBuffer(col, 3), size: makeBuffer(sz, 1), seed: makeBuffer(sd, 1),
        count: n
      });
    }
    return out;
  }

  /* ------------------------------------------------------------ lifecycle */
  /* Hand the sky over to the animated 2D canvas. Reached when the GPU says no
     (no context, lost context, a render that throws) or when the device simply
     cannot hold the flight — a moving sky is always better than a stuck one. */
  function handOver(why) {
    if (dead) return;
    dead = true; paused = true;
    reason = why || reason || 'fallback';
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    document.body.classList.remove('has-world');
    try { if (window.CStars) window.CStars.init(); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent('cworld:fallback', { detail: { reason: reason } })); } catch (e) {}
  }

  function resize() {
    if (!gl || dead) return;
    dpr = Math.min(window.devicePixelRatio || 1, LOW ? 0.85 : 1.6);
    if (quality > 0) dpr = Math.max(0.6, dpr * 0.72);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    gl.viewport(0, 0, cv.width, cv.height);
  }

  function camera() {
    /* the cloud-castle profile raises `flight` slightly, so the same scroll
       covers more Z and the camera keeps soaring through the puffs */
    var z = -1.5 - prog * 300 * motNow.flight;
    var x = hillX(z) * 0.62;
    var y = groundY(x, z) + 3.6 + (calmMotion() ? 0 : Math.sin(time * .7) * .06);
    var zAhead = z - 30;
    var xA = hillX(zAhead) * 0.62;
    var eye = [x, y, z];
    var ctr = [xA, groundY(xA, zAhead) + 4.1, zAhead];
    return { eye: eye, ctr: ctr };
  }

  var lastDraw = 0;
  function render() {
    if (!gl || paused || dead) return;
    /* a phone does not need 60 frames of drifting sky: half the frames, half
       the battery, and the watchdog gets an honest frame rate to judge */
    var nowMs = performance.now();
    if (LOW && nowMs - lastDraw < 30) { raf = requestAnimationFrame(render); return; }
    lastDraw = nowMs;
    /* a throw inside a rAF callback would kill the loop for good and leave the
       sky frozen — catch it and fall back instead */
    try { frame(); } catch (e) { handOver('render error'); return; }
    if (!dead && !paused) raf = requestAnimationFrame(render);
  }

  function frame() {
    var now = performance.now();
    time = (now - t0) / 1000;
    var motionOn = !calmMotion();
    var animTime = motionOn ? time : 0;
    var step = Math.min(3, Math.max(.4, (now - lastNow) / 16.67));   /* frames elapsed */
    prog += (progT - prog) * Math.min(1, 0.075 * step);

    /* ease the palette, horizon and environmental motion over exactly 1.0 s */
    if (easeT0) {
      var et = Math.min(1, (now - easeT0) / EASE_MS);
      var ee = et * et * (3 - 2 * et);
      skyLerp(skyNow, skyFrom, skyGoal, ee);
      motionLerp(motNow, motFrom, motGoal, ee);
      if (et >= 1) easeT0 = 0;
    } else if (!worldName) {
      /* the plain night keeps following the selected mood tint */
      skyGoal.acc = moodTint.slice();
      skyNow.acc = moodTint.slice();
    }

    /* adaptive quality: a phone that cannot hold the flight gets a smaller
       render target first, and then the cheaper 2D sky */
    if (lastNow) {
      var dtf = now - lastNow;
      if (dtf > 0 && dtf < 500) { ftSum += dtf; ftN++; }
      if (ftN >= (LOW ? 20 : 45)) {
        fps = Math.round(1000 / (ftSum / ftN));
        ftSum = 0; ftN = 0;
        if (time > 1.2) {
          /* phones are judged at ~1s: the old two-window rule let a device that
             hovers around 25fps stutter forever without ever being rescued */
          if (fps < (LOW ? 26 : 24)) {
            slowStreak++;
            if (slowStreak >= (LOW ? 1 : 2)) {
              slowStreak = 0;
              if (quality === 0) { quality = 1; resize(); }
              else { handOver('slow gpu ' + fps + 'fps'); return; }
            }
          } else slowStreak = 0;
        }
      }
    }
    lastNow = now;

    /* an occasional far-away lightning, like the reference sky. Reduced motion
       holds the static environment: no flash, no drift, no blink. */
    if (motionOn && time > nextFlash) { flash = 1; nextFlash = time + rnd(7, 18); }
    flash *= Math.pow(0.94, step);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.02, 0.015, 0.06, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var cam = camera();
    var view = new Float32Array(16), proj = new Float32Array(16);
    var fov = 1.02 + Math.sin(prog * 9) * 0.04;
    lookAt(view, cam.eye, cam.ctr, [0, 1, 0]);
    persp(proj, fov, W / Math.max(1, H), 0.1, 420);

    var fwd = norm([cam.ctr[0] - cam.eye[0], cam.ctr[1] - cam.eye[1], cam.ctr[2] - cam.eye[2]]);
    var right = norm(cross(fwd, [0, 1, 0]));
    var up = cross(right, fwd);

    /* sky */
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
    gl.useProgram(sky.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(sky.a.aP);
    gl.vertexAttribPointer(sky.a.aP, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(sky.u.uRes, W, H);
    gl.uniform1f(sky.u.uTime, animTime);
    gl.uniform3fv(sky.u.uFwd, fwd); gl.uniform3fv(sky.u.uRight, right); gl.uniform3fv(sky.u.uUp, up);
    gl.uniform1f(sky.u.uTanHalf, Math.tan(fov / 2)); gl.uniform1f(sky.u.uAspect, W / Math.max(1, H));
    var skAcc = skyNow.acc || moodTint;
    gl.uniform3f(sky.u.uTop, skyNow.top[0], skyNow.top[1], skyNow.top[2]);
    gl.uniform3f(sky.u.uBot, skyNow.bot[0], skyNow.bot[1], skyNow.bot[2]);
    gl.uniform3f(sky.u.uHor, skAcc[0] * .30, skAcc[1] * .27, skAcc[2] * .42);
    gl.uniform3f(sky.u.uAcc, skAcc[0], skAcc[1], skAcc[2]);
    if (sky.u.uHillA) {
      gl.uniform3f(sky.u.uHillA, skyNow.hillA[0], skyNow.hillA[1], skyNow.hillA[2]);
      gl.uniform3f(sky.u.uHillF, skyNow.hillF[0], skyNow.hillF[1], skyNow.hillF[2]);
      gl.uniform3f(sky.u.uHillP, skyNow.hillP[0], skyNow.hillP[1], skyNow.hillP[2]);
      gl.uniform1f(sky.u.uHillBase, skyNow.base);
      gl.uniform2f(sky.u.uTeeth, skyNow.teeth[0], skyNow.teeth[1]);
      gl.uniform3f(sky.u.uGroundCol, skyNow.ground[0], skyNow.ground[1], skyNow.ground[2]);
    }
    gl.uniform1f(sky.u.uFlash, flash);
    gl.uniform1f(sky.u.uNebula, motNow.nebula);
    gl.uniform2f(sky.u.uRes2, W, H);
    var md = norm([-0.34, 0.40, -0.86]);
    gl.uniform3fv(sky.u.uMoon, md);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    /* points */
    gl.enable(gl.DEPTH_TEST); gl.depthMask(false);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(world.p);
    gl.uniformMatrix4fv(world.u.uProj, false, proj);
    gl.uniformMatrix4fv(world.u.uView, false, view);
    gl.uniform1f(world.u.uTime, animTime);
    gl.uniform1f(world.u.uPixel, dpr);
    gl.uniform1f(world.u.uAlpha, 0.18 + 0.80 * Math.min(1, Math.max(0, prog * 7 - 0.15)));
    gl.uniform1f(world.u.uSizeMax, LOW ? 7.0 : 13.0);
    gl.uniform1f(world.u.uMotion, motionOn ? 1.0 : 0.0);
    gl.uniform1f(world.u.uDrift, motNow.drift);
    gl.uniform1f(world.u.uRise, motNow.rise);
    gl.uniform1f(world.u.uSway, motNow.sway);
    gl.uniform1f(world.u.uCluster, motNow.cluster);
    gl.uniform1f(world.u.uHeightCap, motNow.heightCap);
    gl.uniform1f(world.u.uBand, motNow.band);
    gl.uniform1f(world.u.uFloor, motNow.floor);
    gl.uniform1f(world.u.uFirefly, motNow.firefly);

    chunks.forEach(function (c) {
      bindAttr(world, 'aPos', c.pos, 3);
      bindAttr(world, 'aCol', c.col, 3);
      bindAttr(world, 'aSize', c.size, 1);
      bindAttr(world, 'aSeed', c.seed, 1);
      gl.drawArrays(gl.POINTS, 0, c.count);
    });

    /* ---- the prologue book: gathers on entry, turns a page with the scroll,
       dissolves into dust once you leave the first screen ---- */
    if (bookP && book && book.count) {
      var appear = Math.min(1, Math.max(0, (time - 0.35) / 1.7));
      appear = appear * appear * (3 - 2 * appear);
      var leave = Math.max(0, Math.min(1, (prog - 0.058) / 0.035));
      var fade = appear * (1 - Math.max(0, (leave - 0.7) / 0.3));
      if (fade > 0.004) {
        var bDist = LOW ? 7.4 : 7.8, bDrop = LOW ? 2.20 : 1.90, bScale = LOW ? 1.15 : 2.60;
        var bp = [cam.eye[0] + fwd[0] * bDist - up[0] * bDrop,
                  cam.eye[1] + fwd[1] * bDist - up[1] * bDrop,
                  cam.eye[2] + fwd[2] * bDist - up[2] * bDrop];
        var bz0 = [-fwd[0], -fwd[1], -fwd[2]];
        var bu = norm([up[0] + bz0[0] * 0.34, up[1] + bz0[1] * 0.34, up[2] + bz0[2] * 0.34]);
        var br = norm(cross(bu, bz0));
        var bz = norm(cross(br, bu));
        gl.useProgram(bookP.p);
        gl.uniformMatrix4fv(bookP.u.uProj, false, proj);
        gl.uniformMatrix4fv(bookP.u.uView, false, view);
        gl.uniform1f(bookP.u.uTime, animTime);
        gl.uniform1f(bookP.u.uPixel, dpr);
        gl.uniform1f(bookP.u.uSizeMax, LOW ? 6.0 : 8.0);
        gl.uniform1f(bookP.u.uAlpha, 0.82 * fade);
        gl.uniform3fv(bookP.u.uBookPos, bp);
        gl.uniform3fv(bookP.u.uBookRight, br);
        gl.uniform3fv(bookP.u.uBookUp, bu);
        gl.uniform3fv(bookP.u.uBookZ, bz);
        gl.uniform1f(bookP.u.uBookScale, bScale);
        gl.uniform1f(bookP.u.uAssemble, appear * (1 - leave));
        gl.uniform1f(bookP.u.uTurn, Math.max(0, Math.min(1, prog / 0.055)));
        bindAttr(bookP, 'aSide', book.side, 1);
        bindAttr(bookP, 'aUV', book.uv, 2);
        bindAttr(bookP, 'aCol', book.col, 3);
        bindAttr(bookP, 'aSize', book.size, 1);
        bindAttr(bookP, 'aSeed', book.seed, 1);
        bindAttr(bookP, 'aTurn', book.turn, 1);
        gl.drawArrays(gl.POINTS, 0, book.count);
      }
    }
  }

  function bindAttr(prog, name, buf, size) {
    var loc = prog.a[name];
    if (loc == null || loc < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.b);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }

  var chunks = [], world = null;
  function buffersFrom(pos, col, sz, sd, limit) {
    var n = sz.length, step = limit || 60000, out = [];
    for (var s0 = 0; s0 < n; s0 += step) {
      var e = Math.min(n, s0 + step), m = e - s0;
      var a = new Float32Array(m * 3), b = new Float32Array(m * 3), c = new Float32Array(m), d = new Float32Array(m);
      for (var i = 0; i < m; i++) {
        a[i*3] = pos[(s0+i)*3]; a[i*3+1] = pos[(s0+i)*3+1]; a[i*3+2] = pos[(s0+i)*3+2];
        b[i*3] = col[(s0+i)*3]; b[i*3+1] = col[(s0+i)*3+1]; b[i*3+2] = col[(s0+i)*3+2];
        c[i] = sz[s0+i]; d[i] = sd[s0+i];
      }
      out.push({ pos: makeBuffer(a,3), col: makeBuffer(b,3), size: makeBuffer(c,1), seed: makeBuffer(d,1), count: m });
    }
    return out;
  }

  function init(canvas) {
    cv = canvas || document.getElementById('world');
    if (!cv) return false;
    /* Some Android builds refuse the 'high-performance' hint or fail the very
       first attempt: try progressively more conservative options before giving
       up on WebGL. A refused context used to leave phones with a black sky. */
    if (cv.addEventListener) cv.addEventListener('webglcontextcreationerror', function (e) {
      reason = (e && e.statusMessage) || 'context creation failed';
    }, false);
    var attempts = [
      { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' },
      { antialias: false, alpha: false },
      { antialias: false, alpha: false, failIfMajorPerformanceCaveat: false }
    ];
    for (var ci = 0; ci < attempts.length && !gl; ci++) {
      try { gl = cv.getContext('webgl', attempts[ci]) || cv.getContext('experimental-webgl', attempts[ci]); } catch (e) { gl = null; }
    }
    if (!gl) { reason = reason || 'no webgl'; return false; }
    try { rendererName = String(gl.getParameter(gl.RENDERER) || ''); } catch (e) {}

    var cores = navigator.hardwareConcurrency || 8;
    var coarsePtr = false;
    try { coarsePtr = !!(window.matchMedia && window.matchMedia('(pointer:coarse)').matches); } catch (e) {}
    /* phones and tablets get the light shader + light budget; a normal desktop
       keeps the full one (a slow desktop is caught by the watchdog instead) */
    LOW = coarsePtr || window.innerWidth < 820 || cores <= 2;

    sky = program(SKY_V, skyFragment(LOW), ['aP']);
    world = program(VERT, FRAG, ['aPos', 'aCol', 'aSize', 'aSeed']);
    if (!sky || !world) { reason = 'shader compile failed'; return false; }

    quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    buildWorld();
    chunks = splitChunks();
    bookP = program(BOOK_V, FRAG, ['aSide', 'aUV', 'aCol', 'aSize', 'aSeed', 'aTurn']);
    try { book = bookP ? buildBook() : null; } catch (e) { book = null; }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', function () { setTimeout(resize, 240); });
    document.addEventListener('visibilitychange', function () {
      paused = document.hidden;
      if (!paused && !dead) {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        t0 = performance.now() - time * 1000;
        render();
      }
    });
    /* Phones drop the WebGL context when the tab is backgrounded, the PWA is
       swiped away or memory gets tight. Without this the canvas froze on its
       last frame (or went black) until a reload — the "nothing animates on my
       phone" report. Fall back to the animated 2D sky instead. */
    cv.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      handOver('webgl context lost');
    }, false);
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted || dead) return;
      paused = document.hidden;
      t0 = performance.now() - time * 1000;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (!paused) render();
    });
    t0 = performance.now();
    ok = true;
    render();
    return true;
  }

  function info() {
    return {
      up: !!ok && !dead, dead: dead, reason: reason,
      fps: fps, quality: quality, points: Math.round(S.length / 3), low: LOW, cap: LOW ? 30 : 60,
      book: book ? book.count : 0, world: worldName,
      dpr: Math.round(dpr * 100) / 100, renderer: rendererName
    };
  }

  return {
    init: init,
    supported: function () { return ok; },
    setProgress: function (p) { progT = Math.max(0, Math.min(1, p)); },
    setMood: function (m) {
      if (m === 'adventurous') moodTint = [0.95, 0.72, 0.32];
      else if (m === 'magical') moodTint = [0.66, 0.55, 1.0];
      else if (m === 'relaxing') moodTint = [0.45, 0.85, 0.78];
      else moodTint = [0.62, 0.5, 0.95];
    },
    count: function () { return S.length; },
    stop: function (why) { handOver(why || 'stopped'); },
    dispose: function () {
      try {
        dead = true; paused = true;
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        var ext = gl && gl.getExtension && gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      } catch (e) {}
    },
    /* A modal, the reader or a hidden tab are moments when nobody is looking at
       the sky. Freezing the render loop there is free battery — 95k points at
       60 fps is otherwise pure waste behind a blurred dialog. */
    setPaused: function (v) {
      var want = !!v;
      if (want === paused) return;
      paused = want || document.hidden;
      if (paused) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
      else if (!dead) { t0 = performance.now() - time * 1000; render(); }
    },
    turn: function () { return Math.max(0, Math.min(1, prog / 0.055)); },
    /* re-dress the sky for a story setting: {sky:[top,bottom], accent, scene}.
       The environment profile in data.js owns the horizon geometry and the
       movement uniforms; `beginEase` gives all of it a 1.0 s transition. */
    setScene: function (setting) {
      if (!setting) {
        skyGoal = skyCopy(SKY_BASE);
        skyGoal.acc = moodTint.slice();
        motGoal = motionCopy(MOTION_BASE);
        worldName = '';
        beginEase();
        return '';
      }
      var data = window.CDATA || {};
      var envId = setting.env || (data.ENV_BY_SCENE && data.ENV_BY_SCENE[setting.scene]) || 'default';
      var env = data.ENVIRONMENTS ? (data.ENVIRONMENTS[envId] || data.ENVIRONMENTS.default) : null;
      var hz = (env && env.ground) || HORIZONS[setting.scene] || HORIZONS.forest;
      var t = hexRGB(setting.sky && setting.sky[0]), b = hexRGB(setting.sky && setting.sky[1]), a = hexRGB(setting.accent);
      skyGoal = {
        top: [t[0] * 0.55, t[1] * 0.55, t[2] * 0.55],
        bot: [b[0] * 0.82, b[1] * 0.82, b[2] * 0.82],
        acc: [a[0] * 0.95, a[1] * 0.95, a[2] * 0.95],
        hillA: hz.a.slice(), hillF: hz.f.slice(), hillP: hz.p.slice(),
        base: hz.base, teeth: hz.teeth.slice(), ground: hz.ground.slice(),
        name: setting.id || ''
      };
      motGoal = motionFromProfile(env);
      worldName = skyGoal.name;
      beginEase();
      return worldName;
    },
    world: function () { return worldName; },
    environment: function () { return { id: worldName, motion: motionCopy(motNow) }; },
    info: info
  };
})();
