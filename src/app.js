/* storiesAI — app shell, routing, state, views, PWA wiring. */
(function () {
  'use strict';
  var D = window.CDATA, A = window.CAudio, E = window.CEngine;
  var MAX_NAME_LENGTH = E.MAX_NAME_LENGTH;
  var KEY = 'storiesai.v1';
  try { if (!localStorage.getItem(KEY) && localStorage.getItem('chandni.v1')) localStorage.setItem(KEY, localStorage.getItem('chandni.v1')); } catch (e) {}
  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var MAX_CHAPTER_NUMBER = 10000;
  function isValidChapterNumber(value) {
    return Number.isSafeInteger(value) && value > 0 && value <= MAX_CHAPTER_NUMBER;
  }

  /* one stable invite code per device (never regenerate on each load) */
  var DEVICE_CODE = (function () {
    try {
      var c = localStorage.getItem('storiesai.code');
      if (!c) { c = 'STORIESAI-' + Math.random().toString(36).slice(2, 7).toUpperCase(); localStorage.setItem('storiesai.code', c); }
      return c;
    } catch (e) { return 'STORIESAI-NIGHT'; }
  })();

  var defaults = function () {
    return {
      stars: 3,
      stories: [],
      inviteCode: DEVICE_CODE,
      inviteCredited: false,
      cookie: null,
      awake: false,
      settings: {
        sound: false, music: true, language: 'en', fontSize: 20, sky: 'auto',
        ai: { enabled: false, endpoint: '', key: '', model: 'gpt-4o-mini' }
      },
      wizard: { type: 'single', names: '', age: '5-6', value: 'kindness', setting: 'forest', length: 'medium', mood: 'gentle', language: 'en', villain: false, extras: '', chapterNumber: 1, seriesId: null }
    };
  };
  var S;
  try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch (e) { S = defaults(); }
  S.settings = Object.assign(defaults().settings, S.settings || {});
  S.settings.ai = Object.assign(defaults().settings.ai, S.settings.ai || {});
  S.wizard = Object.assign(defaults().wizard, S.wizard || {});
  if (!Array.isArray(S.stories)) S.stories = [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Storage is full — export a backup'); } }

  var wizardStep = 0, currentStory = null, reading = false, deferredInstall = null, svgSeq = 0;

  /* ---------------- utilities ---------------- */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function label(group, id) {
    var list = { age: D.AGES, value: D.VALUES, setting: D.SETTINGS, length: D.LENGTHS, mood: D.MOODS, language: D.LANGUAGES }[group] || [];
    var x = list.filter(function (o) { return o.id === id; })[0];
    return x ? x.label : '—';
  }
  function findSetting(id) { return D.SETTINGS.filter(function (s) { return s.id === id; })[0] || D.SETTINGS[0]; }
  function findMood(id) { return D.MOODS.filter(function (m) { return m.id === id; })[0] || D.MOODS[0]; }
  function prettyDate(iso) { try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } }
  function modal(html, onMount) {
    var root = $('#modalRoot');
    root.innerHTML = '<div class="modal-back"><div class="modal" role="dialog" aria-modal="true"><button class="close" aria-label="Close">×</button>' + html + '</div></div>';
    var close = function () { root.innerHTML = ''; };
    $('.modal-back', root).addEventListener('click', function (e) { if (e.target === this) close(); });
    $('.close', root).addEventListener('click', close);
    if (onMount) onMount($('.modal', root), close);
    return close;
  }
  function confirmModal(title, body, onYes) {
    modal('<h3>' + esc(title) + '</h3><p class="muted small">' + esc(body) + '</p><div class="actions"><button class="pill-gold" data-yes>Yes, please</button><button class="btn-outline" data-no>Cancel</button></div>', function (m, close) {
      $('[data-yes]', m).onclick = function () { close(); onYes(); };
      $('[data-no]', m).onclick = close;
    });
  }

  /* ---------------- shared line-icon set (no emoji, matches the reference matte look) ---------------- */
  var ICONS = {
    book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22.5V5.5Z|M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5A2.5 2.5 0 0 1 20 22.5V5.5Z',
    moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z',
    star: 'M12 3.2 14.1 9h6.1l-4.9 3.6 1.9 5.9L12 14.9 6.8 18.5l1.9-5.9L3.8 9h6.1L12 3.2Z',
    rings: 'M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z|M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
    wave: 'M3 9c2.4 0 2.4 2 4.8 2S10.2 9 12.6 9s2.4 2 4.8 2S19.8 9 21 9|M3 15c2.4 0 2.4 2 4.8 2s2.4-2 4.8-2 2.4 2 4.8 2 2.4-2 3.6-2',
    feather: 'M20 4c-5 0-9 2.4-11.4 6.8L5 17l2.2 2.2 6.2-3.6C17.6 13.5 20 9.6 20 4Z|M8 16 16 8',
    mountain: 'M3 19 9.5 8l4 6.4L16.3 11 21 19H3Z',
    forest: 'M12 3 7.5 11h2.2L6 18h12l-3.7-7h2.2L12 3Z|M12 18v3',
    castle: 'M5 21V9l2.6 1.6V7l2.6 1.6V7L12 4l1.8 3v1.6L16.4 7v3.6L19 9v12H5Z',
    island: 'M3 17c3-1.4 6-1.4 9 0s6 1.4 9 0|M12 6v6|M9.6 9.4c1.4-1.4 3.4-1.4 4.8 0',
    planet: 'M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Z|M3.4 14.6c2.2 3.4 12 6.4 16-1.2',
    city: 'M4 21V11h4v10|M10 21V6h4v15|M16 21v-7h4v7|M3 21h18',
    sea: 'M12 4a4.6 4.6 0 0 0-4.6 4.6c0 2.6 2 4.2 2 6.4a2.6 2.6 0 0 0 5.2 0c0-2.2 2-3.8 2-6.4A4.6 4.6 0 0 0 12 4Z',
    snow: 'M12 3v18|M4.2 7.5l15.6 9|M19.8 7.5l-15.6 9',
    bag: 'M5 8h14l-1.2 12H6.2L5 8Z|M9 8V6.4A3 3 0 0 1 15 6.4V8',
    swing: 'M4 4h16|M8 4v9|M16 4v9|M8 13h8v2H8z',
    paw: 'M8 14.5c-2 1.4-3 3-2.2 4.4.9 1.5 3.2 1.2 6.2 1.2s5.3.3 6.2-1.2c.8-1.4-.2-3-2.2-4.4|M7 9.5a1.8 1.8 0 1 0 0-.1|M17 9.5a1.8 1.8 0 1 0 0-.1|M12 6a1.8 1.8 0 1 0 0-.1',
    spare: 'M12 3.2 13.6 8.4 18.8 10l-5.2 1.6L12 16.8 10.4 11.6 5.2 10l5.2-1.6L12 3.2Z'
  };
  function iconGlyph(k) {
    var d = ICONS[k] || ICONS.spare;
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">' +
      d.split('|').map(function (p) { return '<path d="' + p + '"/>'; }).join('') + '</svg>';
  }

  /* ---------------- scroll choreography (scenes + particle flight) ----------------
     Tuned for phones: no blur filters (iOS silently drops heavily filtered
     layers, and they eat the frame budget), one shared rAF ticker instead of a
     handler per event, and a tick that keeps running while the finger is down so
     the fades follow the scroll in every mobile browser. */
  function initScenes() {
    var items = $$('.scene').map(function (sc) { return { sc: sc, inner: $('.scene-inner', sc) }; });
    var railDot = $('#railDot'), railChapter = $('#railChapter'), chapterLabel = $('#chapterLabel'), cue = $('#scrollCue');
    var home = $('#view-home'), scenesEl = $('#scenes');
    var lastMode = -1, flightTotal = 1, lastY = -1, rafId = null;
    function mq(q) { try { return !!(window.matchMedia && window.matchMedia(q).matches); } catch (e) { return false; } }
    var coarse = mq('(hover:none)') || mq('(pointer:coarse)') || (window.innerWidth || 0) < 900;
    /* the phone may be reducing motion (accessibility setting, battery saver).
       The menu can override that, so read it live instead of once. */
    function calmOn() { return !document.documentElement.classList.contains('force-motion') && mq('(prefers-reduced-motion: reduce)'); }
    function isHome() { return !!(home && home.classList.contains('active')); }
    function measure() { flightTotal = Math.max(1, (scenesEl || document.body).scrollHeight - (window.innerHeight || 1)); }

    function update() {
      if (!isHome()) return;
      var vh = window.innerHeight || 1, mid = vh / 2;
      var sy = window.scrollY || window.pageYOffset || 0;
      var best = 0, bestD = 1e9, reach = vh * 1.45, calmNow = calmOn();
      for (var k = 0; k < items.length; k++) {
        var it = items[k], inner = it.inner;
        var r = it.sc.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = k; }
        if (!inner) continue;
        if (d > reach) {                                  /* far off screen: park it, skip the work */
          if (inner.style.opacity !== '0') inner.style.opacity = '0';
          if (it.sc.classList.contains('active')) it.sc.classList.remove('active');
          if (inner.classList.contains('near')) inner.classList.remove('near');
          continue;
        }
        var v = Math.pow(Math.max(0, Math.min(1, 1 - d / (vh * .82))), 1.12);
        inner.style.opacity = v.toFixed(3);
        if (v > .05) { if (!inner.classList.contains('near')) inner.classList.add('near'); }
        else if (inner.classList.contains('near')) inner.classList.remove('near');
        if (calmNow) {                                    /* reduced motion: fade only */
          inner.style.transform = 'none';
          inner.style.filter = '';
        } else if (coarse) {                              /* phones: opacity + a short lift */
          inner.style.filter = '';
          inner.style.transform = 'translate3d(0,' + ((1 - v) * 14).toFixed(1) + 'px,0)';
        } else {
          inner.style.filter = 'blur(' + ((1 - v) * 9).toFixed(2) + 'px)';
          inner.style.transform = 'translate3d(0,' + ((1 - v) * 24).toFixed(1) + 'px,0) scale(' + (.975 + v * .025).toFixed(3) + ')';
        }
        it.sc.classList.toggle('active', d < vh * .44);
      }
      var act = items[best] && items[best].sc;
      if (act) {
        var chap = act.getAttribute('data-chapter') || '';
        var name = act.getAttribute('data-name') || '';
        var roman = chap.split('·')[0].trim();
        if (chapterLabel && chapterLabel.textContent !== chap) chapterLabel.textContent = chap;
        var railHtml = '<b>' + esc(roman) + '</b> <em>' + esc(name) + '</em>';
        if (railChapter && railChapter.dataset.k !== railHtml) {   /* rebuilding HTML every frame is real work on a phone */
          railChapter.dataset.k = railHtml;
          railChapter.innerHTML = railHtml;
        }
        var m = parseInt(act.getAttribute('data-mode'), 10) || 0;
        if (m !== lastMode) { lastMode = m; if (window.CStars) window.CStars.setMode(m); }
      }
      /* scrollHeight is a forced layout — reuse the measurement taken on
         resize/route changes instead of reading it on every scroll frame */
      var pct = Math.max(0, Math.min(1, sy / Math.max(1, flightTotal)));
      if (railDot) railDot.style.top = (pct * 100) + '%';
      if (railChapter) railChapter.style.top = (pct * 100) + '%';
      if (cue) { var co = sy > 160 ? '0' : '1'; if (cue.style.opacity !== co) cue.style.opacity = co; }
      if (window.CWorld) window.CWorld.setProgress(Math.max(0, Math.min(1, sy / flightTotal)));
    }

    function tick() {
      rafId = null;
      if (document.hidden || !isHome()) return;
      var y = window.scrollY || window.pageYOffset || 0;
      if (y !== lastY) { lastY = y; update(); }
      rafId = requestAnimationFrame(tick);
    }
    function kick() { if (rafId == null && !document.hidden && isHome()) rafId = requestAnimationFrame(tick); }
    function nudge() { lastY = -1; kick(); }
    function refresh() { measure(); lastY = -1; update(); kick(); return update; }

    window.addEventListener('scroll', nudge, { passive: true });
    window.addEventListener('touchmove', nudge, { passive: true });
    window.addEventListener('wheel', nudge, { passive: true });
    window.addEventListener('resize', refresh);   /* the document can reflow: re-measure */
    window.addEventListener('orientationchange', function () { setTimeout(refresh, 240); });
    if (window.visualViewport && window.visualViewport.addEventListener) {
      window.visualViewport.addEventListener('resize', refresh);
      window.visualViewport.addEventListener('scroll', nudge);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }
      else refresh();
    });
    window.addEventListener('pageshow', function () { refresh(); });
    refresh();
    return refresh;
  }

  /* ---------------- scenery SVG (theme changes with the story) ---------------- */
  function scenery(setting, mood, mini) {
    var id = 'sc' + (++svgSeq);
    var top = setting.sky[0], bottom = setting.sky[1], acc = setting.accent;
    var glow = mood.glow;
    var stars = '';
    for (var i = 0; i < 26; i++) {
      var x = (i * 137.5 + 23) % 800, y = (i * 71.3 + 17) % 165, r = (i % 5 === 0 ? 1.8 : 1.05);
      stars += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + r + '" fill="' + (i % 6 === 0 ? glow : '#ffffff') + '" opacity="' + (0.3 + (i % 4) * 0.15) + '"/>';
    }
    var shapes = '';
    switch (setting.scene) {
      case 'forest':
        shapes = '<g fill="#040c14" opacity=".75">' + [60, 130, 210, 300, 390, 480, 570, 660, 740].map(function (x, i) {
          var hgt = 66 + (i % 3) * 32;
          return '<path d="M' + x + ' 300 L' + x + ' ' + (280 - hgt) + ' L' + (x - 30) + ' 260 L' + (x - 10) + ' 260 L' + (x - 38) + ' 235 L' + x + ' 235 L' + (x + 38) + ' 235 L' + (x + 10) + ' 260 L' + (x + 30) + ' 260 Z"/>' +
            '<rect x="' + (x - 5) + '" y="' + (260) + '" width="10" height="40"/>';
        }).join('') + '</g>';
        break;
      case 'castle':
        shapes = '<g fill="#050b18" opacity=".85"><path d="M250 300 L250 170 L280 150 L280 120 L300 120 L300 150 L330 150 L330 100 L350 100 L350 150 L380 150 L380 125 L400 125 L400 150 L430 150 L430 175 L470 175 L470 300 Z"/>' +
          '<rect x="330" y="215" width="34" height="60" rx="16" fill="' + glow + '" opacity=".35"/>' +
          '<rect x="410" y="220" width="26" height="46" rx="12" fill="' + glow + '" opacity=".25"/>' +
          '<path d="M350 100 L350 72 L378 82 L350 92 Z" fill="' + acc + '" opacity=".8"/></g>';
        break;
      case 'space':
        shapes = '<g><ellipse cx="600" cy="215" rx="185" ry="34" fill="none" stroke="' + acc + '" stroke-width="2" opacity=".35" transform="rotate(-18 600 215)"/>' +
          '<circle cx="600" cy="215" r="54" fill="#0a1030" stroke="' + glow + '" stroke-width="2" opacity=".9"/>' +
          '<circle cx="600" cy="215" r="54" fill="url(#' + id + 'p)" opacity=".45"/>' +
          '<circle cx="238" cy="98" r="12" fill="' + glow + '" opacity=".7"/></g>';
        break;
      case 'sea':
        shapes = '<g fill="none" stroke="' + acc + '" opacity=".35"><path d="M0 235 Q100 215 200 235 T400 235 T600 235 T800 235" stroke-width="2"/><path d="M0 258 Q100 240 200 258 T400 258 T600 258 T800 258" stroke-width="2"/></g>' +
          '<g fill="#04121c" opacity=".7"><path d="M90 300 Q110 235 130 300 Z"/><path d="M140 300 Q165 220 185 300 Z"/><path d="M650 300 Q675 240 700 300 Z"/></g>';
        break;
      case 'city':
        shapes = '<g fill="#050a18" opacity=".85">' + [[70, 180, 70], [150, 140, 60], [220, 195, 80], [310, 120, 65], [390, 170, 75], [480, 150, 60], [560, 190, 85], [660, 135, 70]].map(function (b) {
          return '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + (300 - b[1]) + '" rx="3"/>';
        }).join('') + '</g><g fill="' + glow + '" opacity=".75">' + [[92, 200], [170, 160], [245, 215], [330, 140], [410, 190], [500, 170], [585, 210], [680, 155]].map(function (p) {
          return '<rect x="' + p[0] + '" y="' + p[1] + '" width="6" height="8" rx="1"/>';
        }).join('') + '</g>';
        break;
      case 'mountain':
        shapes = '<path d="M-20 300 L170 110 L290 230 L420 90 L610 280 L700 170 L830 300 Z" fill="#050d1a" opacity=".85"/>' +
          '<path d="M170 110 L130 165 L160 155 L185 175 L210 155 Z" fill="' + acc + '" opacity=".55"/>' +
          '<path d="M420 90 L375 150 L405 140 L435 165 L465 145 Z" fill="' + acc + '" opacity=".55"/>';
        break;
      case 'island':
        shapes = '<path d="M230 300 Q400 205 580 300 Z" fill="#05121c" opacity=".85"/>' +
          '<path d="M400 220 Q395 170 380 150 M400 220 Q410 165 435 150 M400 220 Q370 185 345 180" stroke="#05121c" stroke-width="9" fill="none" stroke-linecap="round"/>' +
          '<g fill="' + glow + '" opacity=".55"><circle cx="380" cy="150" r="7"/><circle cx="435" cy="150" r="7"/><circle cx="345" cy="180" r="7"/></g>' +
          '<path d="M0 275 Q200 255 400 275 T800 275" stroke="' + acc + '" stroke-width="2" fill="none" opacity=".35"/>';
        break;
      default: /* farm */
        shapes = '<path d="M0 260 Q200 235 400 260 T800 260 L800 300 L0 300 Z" fill="#06101a" opacity=".7"/>' +
          '<g fill="#050c16"><path d="M300 255 L300 195 L350 165 L400 195 L400 255 Z"/><rect x="325" y="215" width="50" height="40" fill="' + glow + '" opacity=".28"/></g>' +
          '<g stroke="' + acc + '" opacity=".4"><path d="M60 250 L60 225 M120 250 L120 225 M180 250 L180 225" stroke-width="4"/><path d="M50 238 L190 238" stroke-width="3"/></g>';
    }
    var horizon = '<path d="M0 265 Q200 245 400 265 T800 262 L800 300 L0 300 Z" fill="#040a16" opacity=".45"/>';
    return '<svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="' + id + 's" x1="0" y1="0" x2="0" y2="1"><stop stop-color="' + top + '"/><stop offset="1" stop-color="' + bottom + '"/></linearGradient>' +
      '<radialGradient id="' + id + 'g"><stop stop-color="' + glow + '" stop-opacity=".55"/><stop offset="1" stop-color="' + glow + '" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + id + 'p"><stop stop-color="' + acc + '"/><stop offset="1" stop-color="#101540"/></radialGradient></defs>' +
      '<rect width="800" height="300" fill="url(#' + id + 's)"/>' + stars +
      '<circle cx="640" cy="78" r="72" fill="url(#' + id + 'g)"/>' +
      '<circle cx="640" cy="78" r="30" fill="' + glow + '" opacity=".92"/>' +
      '<circle cx="652" cy="70" r="27" fill="' + top + '" opacity=".95"/>' +
      (setting.scene === 'space' ? '' : horizon) + shapes +
      (mini ? '<rect width="800" height="300" fill="#040a16" opacity=".12"/>' : '') +
      '</svg>';
  }

  /* ---------------- theme ---------------- */
  function applyTheme(story) {
    var s = findSetting(story.cfg.setting), m = findMood(story.cfg.mood), root = document.documentElement;
    root.style.setProperty('--sky-top', s.sky[0]);
    root.style.setProperty('--sky-bottom', s.sky[1]);
    root.style.setProperty('--accent', s.accent);
    root.style.setProperty('--gold', m.glow);
    root.style.setProperty('--gold-2', s.accent);
    root.style.setProperty('--gold-deep', s.sky[1]);
    document.body.classList.add('themed');
  }
  function clearTheme() {
    if (themeRAF) { cancelAnimationFrame(themeRAF); themeRAF = 0; }
    themeCur = null;
    ['--sky-top', '--sky-bottom', '--accent', '--gold', '--gold-2', '--gold-deep'].forEach(function (p) { document.documentElement.style.removeProperty(p); });
    document.body.classList.remove('themed');
  }

  /* ---------------- the builder re-dresses the night ----------------
     Tapping a setting turns the page's palette and the live sky towards that
     world, so the place you pick is the place you see while you pick it. */
  var THEME_BASE = { top: '#05040f', bottom: '#0f0f23', accent: '#f3d38a', gold: '#f3d38a', gold2: '#f5c842', deep: '#0f0f23' };
  var themeCur = null, themeRAF = 0;
  function calmMotion() {
    try {
      return !document.documentElement.classList.contains('force-motion') &&
        !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }
  function hex2rgb(h) {
    h = String(h || '#000000').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (!isFinite(n)) n = 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function themeBase() {
    themeCur = themeCur || {};
    ['top', 'bottom', 'accent', 'gold', 'gold2', 'deep'].forEach(function (k) { themeCur[k] = hex2rgb(THEME_BASE[k]); });
    return themeCur;
  }
  function themePaint() {
    var t = themeCur, r = document.documentElement.style;
    var css = function (v) { return 'rgb(' + Math.round(v[0]) + ',' + Math.round(v[1]) + ',' + Math.round(v[2]) + ')'; };
    r.setProperty('--sky-top', css(t.top));
    r.setProperty('--sky-bottom', css(t.bottom));
    r.setProperty('--accent', css(t.accent));
    r.setProperty('--gold', css(t.gold));
    r.setProperty('--gold-2', css(t.gold2));
    r.setProperty('--gold-deep', css(t.deep));
  }
  function themeTo(target, ms, thenUntheme) {
    var from = themeNow(), keys = ['top', 'bottom', 'accent', 'gold', 'gold2', 'deep'];
    var start = {}, tgt = {};
    keys.forEach(function (k) {
      start[k] = from[k].slice();
      tgt[k] = (thenUntheme ? hex2rgb(THEME_BASE[k]) : target[k]) || from[k];
    });
    if (themeRAF) { cancelAnimationFrame(themeRAF); themeRAF = 0; }
    if (!ms || calmMotion()) {
      themeCur = {}; keys.forEach(function (k) { themeCur[k] = tgt[k]; });
      if (thenUntheme) clearTheme(); else { document.body.classList.add('themed'); themePaint(); }
      return;
    }
    document.body.classList.add('themed');
    var t0 = 0;
    function tick(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      themeCur = {};
      keys.forEach(function (key) {
        themeCur[key] = [0, 1, 2].map(function (i) { return start[key][i] + (tgt[key][i] - start[key][i]) * e; });
      });
      themePaint();
      if (k < 1) themeRAF = requestAnimationFrame(tick);
      else { themeRAF = 0; if (thenUntheme) clearTheme(); }
    }
    themeRAF = requestAnimationFrame(tick);
  }
  function themeNow() {
    if (themeCur && themeCur.top) return themeCur;
    var cs = getComputedStyle(document.documentElement);
    var read = function (name, fallback) {
      var v = (cs.getPropertyValue(name) || '').trim();
      if (v.charAt(0) === '#') return hex2rgb(v);
      var m = v.match(/(\d+)\D+(\d+)\D+(\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : hex2rgb(fallback);
    };
    themeCur = {
      top: read('--sky-top', THEME_BASE.top), bottom: read('--sky-bottom', THEME_BASE.bottom),
      accent: read('--accent', THEME_BASE.accent), gold: read('--gold', THEME_BASE.gold),
      gold2: read('--gold-2', THEME_BASE.gold2), deep: read('--gold-deep', THEME_BASE.deep)
    };
    return themeCur;
  }
  /* id = a setting id, or null to go back to the plain night sky */
  function previewSetting(id) {
    var s = id ? findSetting(id) : null;
    if (window.CWorld && window.CWorld.setScene) window.CWorld.setScene(s);
    if (window.CStars && window.CStars.setScene) window.CStars.setScene(s);
    if (!s) { themeTo(null, 620, true); return; }
    var m = findMood(S.wizard.mood);
    themeTo({
      top: hex2rgb(s.sky[0]), bottom: hex2rgb(s.sky[1]), accent: hex2rgb(s.accent),
      gold: hex2rgb(m.glow), gold2: hex2rgb(s.accent), deep: hex2rgb(s.sky[1])
    }, 620);
  }

  /* ---------------- home content ---------------- */
  function renderHome() {
    var features = [
      ['Their name.', 'Your child becomes the hero — add two names for siblings, too.'],
      ['Their age.', 'Language, sentence length and the size of the problem adapt.'],
      ['A value.', 'Courage, kindness, patience… whatever you would like to pass on.'],
      ['A place.', 'The world, the colours and the emotional tone of the tale.'],
      ['A little villain.', 'Optional, harmless, always making amends by the end.']
    ];
    $('#featureCards').innerHTML = features.map(function (f, i) {
      return '<div class="mini-feature"><span class="n">0' + (i + 1) + '</span><b>' + esc(f[0]) + '</b><span>' + esc(f[1]) + '</span></div>';
    }).join('');

    $('#musicChips').innerHTML = D.MOODS.map(function (m) {
      return '<button class="pill" data-mood="' + m.id + '"><span class="pill-main"><span class="eq"><i></i><i></i><i></i></span>' + esc(m.label) + '</span><em>' + esc(m.hint) + '</em></button>';
    }).join('');

    $('#soundDemo').innerHTML = [
      'Arianna heard the wind [[wind|rustling]] through the leaves, gently lifting them.',
      'Among the coral branches, little [[bells|golden bells]] were singing.',
      'Far away, beyond the hills, [[thunder|a thunderstorm]] was rumbling itself to sleep.'
    ].map(function (t) { return '<p>' + E.renderText(t) + '</p>'; }).join('');

    $('#voiceGrid').innerHTML = Object.keys(D.VOICES).map(function (k) {
      var v = D.VOICES[k];
      return '<button class="voice-item" style="--dot:' + v.css + '" data-voice="' + k + '"><i class="dot"></i><b>' + esc(v.label) + '</b><small>' + esc(v.hint) + '</small></button>';
    }).join('');

    $('#ageChips').innerHTML = D.AGES.map(function (a) {
      return '<button class="pill" data-age="' + a.id + '">' + esc(a.label) + '<em>' + esc(a.hint) + '</em></button>';
    }).join('');

    $('#reviewTrack').innerHTML = D.REVIEWS.map(function (r) {
      return '<div class="review"><div class="stars">' + '★'.repeat(r.stars) + '</div><blockquote>“' + esc(r.text) + '”</blockquote><div class="who">' + esc(r.name) + '<span>' + esc(r.note) + '</span></div></div>';
    }).join('');

    var packs = [
      { n: 10, name: 'Pouch of Stars', blurb: 'Ten bedtime stories: a handful of magical evenings to get started.', tag: '' },
      { n: 30, name: 'Chest of Stars', blurb: 'A month of stories, one every night: the bedtime ritual never stops.', tag: 'Most loved' },
      { n: 100, name: 'Sky of Stars', blurb: 'Months of tales, for brothers and sisters too.', tag: '' }
    ];
    $('#starPacks').innerHTML = packs.map(function (p) {
      return '<div class="pack ' + (p.tag ? 'popular' : '') + '">' + (p.tag ? '<span class="tag">' + p.tag + '</span>' : '') +
        '<div class="amount">' + p.n + '<small>Stars</small></div><h4>' + esc(p.name) + '</h4><p>' + esc(p.blurb) + '</p>' +
        '<div class="free-line"><span class="free">Free · always</span></div>' +
        '<button class="btn-outline" data-pack="' + p.n + '">✦ ADD ' + p.n + ' FREE STARS</button></div>';
    }).join('');

    $('#faqList').innerHTML = D.FAQ.map(function (f) {
      return '<div class="faq-item"><button class="faq-q">' + esc(f.q) + '<span class="plus">+</span></button><div class="faq-a"><p>' + esc(f.a) + '</p></div></div>';
    }).join('');

    $('#musicChips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mood]'); if (!b) return;
      A.setSound(true); syncSound(); A.previewMood(b.dataset.mood);
      if (window.CWorld) window.CWorld.setMood(b.dataset.mood);
      $$('.pill', this).forEach(function (x) { x.classList.remove('playing'); });
      b.classList.add('playing'); setTimeout(function () { b.classList.remove('playing'); }, 1600);
    });
    $('#voiceGrid').addEventListener('click', function (e) {
      var b = e.target.closest('[data-voice]'); if (!b) return;
      A.setSound(true); syncSound(); A.speak(D.VOICES[b.dataset.voice].line, 'en-IN');
      toast(D.VOICES[b.dataset.voice].label + ' voice · ' + D.VOICES[b.dataset.voice].hint);
    });
    $('#ageChips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-age]'); if (!b) return;
      S.wizard.age = b.dataset.age; save(); renderWizard(); location.hash = '#/create';
    });
    $('#starPacks').addEventListener('click', function (e) {
      var b = e.target.closest('[data-pack]'); if (!b) return;
      S.stars += parseInt(b.dataset.pack, 10); save(); syncStars(); toast('✦ ' + b.dataset.pack + ' Stars added to your pouch');
    });
    $('#faqList').addEventListener('click', function (e) {
      var q = e.target.closest('.faq-q'); if (!q) return;
      q.parentNode.classList.toggle('open');
    });
    $('#revPrev').onclick = function () { $('#reviewTrack').scrollBy({ left: -440, behavior: 'smooth' }); };
    $('#revNext').onclick = function () { $('#reviewTrack').scrollBy({ left: 440, behavior: 'smooth' }); };
    $('#storyCounter').textContent = (1767 + S.stories.length).toLocaleString();
    $('#soundDemo').addEventListener('click', function (e) {
      var b = e.target.closest('.sound-word'); if (!b) return; soundTap(b);
    });
    /* the hero teaser uses the same tap path as the reader: rest, haptic, duck */
    var heroPreview = $('.hero-preview');
    if (heroPreview) heroPreview.addEventListener('click', function (e) {
      var b = e.target.closest('.sound-word'); if (!b) return; soundTap(b);
    });
  }

  /* ---- golden words: 3 s rest between taps, and a delicate haptic ----
     A child can hit the same word twenty times in a second, which is exactly
     how a calm bedtime turns into a game. One word, one sound, then it rests. */
  var REST_MS = 3000, RESTING = 'word-resting';
  var HAPTIC = { thunder: [30, 50, 20], waves: [30, 50, 20], wind: [30, 50, 20], drum: [30, 50, 20], rain: [30, 50, 20] };

  function haptic(key) {
    try {
      if (!navigator.vibrate) return;                    /* desktop, iOS Safari */
      var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (calm && !document.documentElement.classList.contains('force-motion')) return;
      navigator.vibrate(HAPTIC[key] || 15);              /* light spark, or a ripple */
    } catch (e) { /* some WebViews throw on vibrate */ }
  }

  function soundTap(btn) {
    if (!btn || btn.classList.contains(RESTING)) return;
    A.setSound(true); syncSound();
    A.playSfx(btn.dataset.sfx);
    haptic(btn.dataset.sfx);
    btn.classList.remove('tapped'); void btn.offsetWidth; btn.classList.add('tapped');

    btn.classList.add(RESTING);
    btn.setAttribute('aria-disabled', 'true');           /* stays in the tab order */
    var token = btn.__rest = (btn.__rest || 0) + 1;      /* a re-render must not strand the class */
    setTimeout(function () {
      if (btn.__rest !== token) return;
      btn.classList.remove(RESTING);
      btn.removeAttribute('aria-disabled');
    }, REST_MS);

    var sfx = D.SFX[btn.dataset.sfx];
    if (sfx) toast(sfx.emoji + ' ' + sfx.label);
  }

  /* ---------------- wizard ---------------- */
  function choiceHTML(group, items, selected, extra) {
    return items.map(function (o) {
      var sub = extra ? extra(o) : (o.hint || o.minutes || o.native || '');
      return '<button type="button" class="choice' + (o.id === selected ? ' selected' : '') + '" data-group="' + group + '" data-id="' + o.id + '">' +
        '<span class="ic">' + iconGlyph(o.icon) + '</span><b>' + esc(o.label) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</button>';
    }).join('');
  }
  /* The desk offers a short, calm set of choices — five values, five places —
     with a custom entry for parents who already know what they want. */
  var VALUE_CHIPS = ['kindness', 'sharing', 'courage', 'patience', 'curiosity'];
  var PLACE_CHIPS = ['forest', 'space', 'treehouse', 'sea', 'castle'];   /* the brief's order: forest, space, treehouse, reef, cloud castle */
  var chipOpen = { value: false, setting: false };   /* input visible, in memory only */

  function findValue(id) {
    return D.VALUES.filter(function (v) { return v.id === id; })[0] || D.VALUES[0];
  }
  function customText(group) {
    var t = group === 'value' ? S.wizard.customValue : S.wizard.customPlace;
    return String(t || '').trim();
  }
  function customChip(group, text) {
    return '<button type="button" class="choice choice-custom' + (text ? ' selected' : '') + '" data-custom="' + group + '">' +
      '<span class="ic">＋</span><b>' + (text ? esc(text) : 'Add custom') + '</b>' +
      '<small>' + (group === 'value' ? 'your own lesson' : 'a place of your own') + '</small></button>';
  }
  function customRow(group, text) {
    var id = group === 'value' ? 'customValueInput' : 'customPlaceInput';
    var hidden = (text || chipOpen[group]) ? '' : ' hidden';
    return '<div class="custom-row" id="custom' + (group === 'value' ? 'Value' : 'Place') + 'Row"' + hidden + '>' +
      '<input class="input" id="' + id + '" maxlength="30" autocomplete="off" value="' + esc(text) + '" ' +
      'placeholder="' + (group === 'value' ? 'a value of your own, e.g. honesty' : 'a place of your own, e.g. the lighthouse at the end of the lane') + '">' +
      '</div>';
  }
  /* update the chips in place: re-rendering the grid on every keystroke would
     steal the caret out of the input */
  function syncCustomChips(group) {
    var text = customText(group);
    var grid = group === 'value' ? $('#choiceValue') : $('#choiceSetting');
    var current = group === 'value' ? S.wizard.value : S.wizard.setting;
    $$('[data-group]', grid).forEach(function (b) {
      b.classList.toggle('selected', !text && b.dataset.id === current);
    });
    var chip = $('[data-custom]', grid);
    if (chip) {
      chip.classList.toggle('selected', !!text);
      var b2 = chip.querySelector('b'); if (b2) b2.textContent = text || 'Add custom';
    }
    renderSummary();
  }

  function renderWizard() {
    var w = S.wizard;
    $('#choiceType').innerHTML = choiceHTML('type', [
      { id: 'single', icon: 'book', label: 'One story', hint: 'A complete tale, ready in seconds' },
      { id: 'series', icon: 'moon', label: 'Bedtime series', hint: 'Your child as the hero, chapter by chapter' }
    ], w.type);
    $('#choiceAge').innerHTML = choiceHTML('age', D.AGES, w.age, function (o) { return o.hint; });
    $('#choiceLength').innerHTML = choiceHTML('length', D.LENGTHS, w.length, function (o) { return o.minutes; });
    var cv = customText('value'), cp = customText('setting');
    $('#choiceValue').innerHTML = choiceHTML('value', VALUE_CHIPS.map(findValue), cv ? '' : w.value, function (o) { return o.blurb; }) +
      customChip('value', cv) + customRow('value', cv);
    $('#choiceSetting').innerHTML = choiceHTML('setting', PLACE_CHIPS.map(findSetting), cp ? '' : w.setting, function () { return ''; }) +
      customChip('setting', cp) + customRow('setting', cp);
    $('#wizMoods').innerHTML = D.MOODS.map(function (m) {
      return '<button type="button" class="pill' + (m.id === w.mood ? ' playing' : '') + '" data-group="mood" data-id="' + m.id + '"><span class="pill-main"><span class="eq"><i></i><i></i><i></i></span>' + esc(m.label) + '</span><em>' + esc(m.hint) + '</em></button>';
    }).join('');
    $('#choiceLang').innerHTML = D.LANGUAGES.map(function (l) {
      return '<button type="button" class="pill' + (l.id === w.language ? ' active' : '') + '" data-group="language" data-id="' + l.id + '"><span class="pill-main">' + esc(l.label) + '</span><em>' + esc(l.native) + '</em></button>';
    }).join('');
    $('#namesInput').value = w.names;
    $('#extrasInput').value = w.extras;
    $('#villainToggle').checked = !!w.villain;
    var vPill = $('.villain-pill'), vNote = $('#villainNote');
    if (vPill) vPill.setAttribute('data-on', w.villain ? '1' : '0');
    if (vNote) vNote.textContent = w.villain
      ? 'A little mischief-maker who always makes amends before the last page.'
      : 'Only adventure and wonder — nobody to be afraid of.';
    renderStep(); renderSummary(); syncStars();
  }
  function renderSummary() {
    var w = S.wizard;
    var rows = [
      ['Hero', w.names.trim() || '—'], ['Type', w.type === 'series' ? 'Bedtime series' : 'One story'],
      ['Age', label('age', w.age)], ['Value', customText('value') || label('value', w.value)], ['Place', customText('setting') || label('setting', w.setting)],
      ['Mood', label('mood', w.mood)], ['Length', label('length', w.length) + ' · ' + (D.LENGTHS.filter(function (l) { return l.id === w.length; })[0] || {}).minutes],
      ['Language', label('language', w.language)], ['Little villain', w.villain ? 'Yes, redeemed' : 'No']
    ];
    if (w.type === 'series') rows.splice(2, 0, ['Chapter', String(w.chapterNumber || 1)]);
    $('#summaryList').innerHTML = rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('');
  }
  function renderStep() {
    $$('.step').forEach(function (s, i) { s.classList.toggle('active', i === wizardStep); });
    $('#wizProgress').innerHTML = [0, 1, 2, 3, 4].map(function (i) { return '<i class="' + (i < wizardStep ? 'done' : i === wizardStep ? 'active' : '') + '"></i>'; }).join('');
    $('#wizPrev').style.visibility = wizardStep === 0 ? 'hidden' : 'visible';
    $('#wizNext').style.display = wizardStep === 4 ? 'none' : 'inline-flex';
    $('#wizCreate').style.display = wizardStep === 4 ? 'inline-flex' : 'none';
  }
  function initWizard() {
    ['choiceType', 'choiceAge', 'choiceLength', 'choiceValue', 'choiceSetting', 'wizMoods', 'choiceLang'].forEach(function (id) {
      $('#' + id).addEventListener('click', function (e) {
        var custom = e.target.closest('[data-custom]');
        if (custom) {
          var g = custom.dataset.custom;
          chipOpen[g] = true;
          var row = g === 'value' ? $('#customValueRow') : $('#customPlaceRow');
          if (row) {
            row.hidden = false;
            var inp = row.querySelector('input');
            if (inp) { try { inp.focus(); } catch (err) {} }
          }
          return;
        }
        var b = e.target.closest('[data-group]'); if (!b) return;
        S.wizard[b.dataset.group] = b.dataset.id;
        if (b.dataset.group === 'language') S.settings.language = b.dataset.id;
        if (b.dataset.group === 'mood') { A.setSound(true); syncSound(); A.previewMood(b.dataset.id); }
        if (b.dataset.group === 'setting' || b.dataset.group === 'mood') {
          if ($('#view-create') && $('#view-create').classList.contains('active')) previewSetting(S.wizard.setting);
        }
        save(); renderWizard();
      });
    });
    $('#namesInput').addEventListener('input', function () { S.wizard.names = this.value; save(); renderSummary(); });
    $('#extrasInput').addEventListener('input', function () { S.wizard.extras = this.value; save(); });
    $('#villainToggle').addEventListener('change', function () { S.wizard.villain = this.checked; save(); renderSummary(); });
    /* the custom fields are re-rendered with the chips, so the listener is delegated */
    $('#view-create').addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !t.id) return;
      if (t.id === 'customValueInput') { S.wizard.customValue = t.value; save(); syncCustomChips('value'); }
      else if (t.id === 'customPlaceInput') { S.wizard.customPlace = t.value; save(); syncCustomChips('setting'); }
    });
    $('#view-create').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.target.id === 'customValueInput' || e.target.id === 'customPlaceInput')) {
        e.preventDefault(); e.target.blur();
      }
    });
    /* villain: two explicit states rather than a bare checkbox */
    var vPill = $('.villain-pill');
    if (vPill) vPill.addEventListener('click', function (e) {
      var b = e.target.closest('[data-villain]'); if (!b) return;
      S.wizard.villain = b.dataset.villain === '1';
      save();
      $('#villainToggle').checked = S.wizard.villain;
      vPill.setAttribute('data-on', S.wizard.villain ? '1' : '0');
      var note = $('#villainNote');
      if (note) note.textContent = S.wizard.villain
        ? 'A little mischief-maker who always makes amends before the last page.'
        : 'Only adventure and wonder — nobody to be afraid of.';
      haptic(null);
      renderSummary();
    });
    $('#wizPrev').onclick = function () { if (wizardStep > 0) { wizardStep--; renderStep(); } };
    $('#wizNext').onclick = function () {
      if (wizardStep === 0 && !S.wizard.names.trim()) { toast('First, give the hero a name ✦'); $('#namesInput').focus(); return; }
      if (wizardStep < 4) { wizardStep++; renderStep(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    };
    $('#wizCreate').onclick = function () { createStory(); };
    renderWizard();
  }

  /* ---------------- story creation ---------------- */
  /* ---------------- "stories weaving": the ingredients, spoken back ----------------
     The wait is the one moment the child is guaranteed to be listening, so it
     says their own story back to them instead of a generic spinner. */
  var weaveTimers = [];
  function weaveLines(cfg) {
    var hero = String(cfg.names || '').split(/[,&]|\band\b/)[0].trim() || 'your little one';
    var st = findSetting(cfg.setting);
    var lesson = String(String(cfg.customValue || '').trim() || label('value', cfg.value) || 'kindness').toLowerCase();
    return [
      { at: 0,     text: 'Gathering moonlight to guide ' + hero + '…' },
      { at: 7000,  text: 'Building a pathway into the heart of ' + (String(cfg.customPlace || '').trim() || st.place || 'the woods') + '…' },
      { at: 14000, text: 'Weaving a quiet lesson about ' + lesson + '…' },
      { at: 22000, text: cfg.villain ? 'Softening the edges of a little villain…' : 'Tucking the stars in, one by one…' }
    ];
  }
  function stopWeave() {
    weaveTimers.forEach(clearTimeout); weaveTimers = [];
  }
  function runWeave(cfg) {
    stopWeave();
    var el = $('#genLine'); if (!el) return;
    var lines = weaveLines(cfg), i;
    el.style.opacity = '1'; el.textContent = lines[0].text;
    for (i = 1; i < lines.length; i++) {
      (function (line) {
        weaveTimers.push(setTimeout(function () {
          el.style.opacity = '0';                      /* 220 ms fade, then new words */
          weaveTimers.push(setTimeout(function () { el.textContent = line.text; el.style.opacity = '1'; }, 220));
        }, line.at));
      })(lines[i]);
    }
  }
  function createStory(overrideCfg) {
    var cfg = overrideCfg || JSON.parse(JSON.stringify(S.wizard));
    if (!E.isValidNames(cfg.names)) {
      location.hash = '#/create'; toast('Hero names must be ' + MAX_NAME_LENGTH + ' characters or fewer'); return;
    }
    if (!cfg.names || !cfg.names.trim()) { location.hash = '#/create'; toast('First, give the hero a name ✦'); return; }
    if (S.stars < 1) { addStarsModal('Your pouch is empty'); return; }
    /* Capture the pouch at the moment creation starts. The charge is committed
       only after a story has been generated successfully. */
    var balanceAtStart = S.stars;
    A.stopSpeak(); reading = false;
    location.hash = '#/generating';
    var ai = S.settings.ai.enabled && S.settings.ai.endpoint ? S.settings.ai : null;
    $('#genNote').textContent = ai ? 'Asking your own AI storyteller… offline is the fallback.' : 'Everything happens right here on your device.';
    runWeave(cfg);
    var pct = 4;
    $('#genBar').style.width = pct + '%';
    var barWrap = $('#genBarWrap');
    var iv = setInterval(function () {
      pct = Math.min(92, pct + (92 - pct) * 0.06);
      $('#genBar').style.width = pct.toFixed(1) + '%';
      if (barWrap) barWrap.setAttribute('aria-valuenow', String(Math.round(pct)));
    }, 400);
    var started = Date.now();
    E.generate(cfg, ai).then(function (story) {
      /* the local engine finishes in ~1 s; hold the curtain long enough for the
         child to hear their own name and their own place (beats at 0 s and 7 s) */
      var wait = Math.max(0, 7800 - (Date.now() - started));
      setTimeout(function () {
        clearInterval(iv); stopWeave(); $('#genBar').style.width = '100%';
        if (barWrap) barWrap.setAttribute('aria-valuenow', '100');
        var balanceBeforeCharge = S.stars;
        S.stars -= 1;
        /* Keep the exact debit beside the story so later checks can attribute
           the pouch change to this successful creation. */
        story.starTransaction = {
          balanceAtStart: balanceAtStart,
          balanceBefore: balanceBeforeCharge,
          balanceAfter: S.stars,
          starsSpent: balanceBeforeCharge - S.stars,
          recordedAt: new Date().toISOString()
        };
        if (cfg.type === 'series') story.seriesId = cfg.seriesId || ('series-' + Date.now().toString(36));
        story.chapterNumber = cfg.chapterNumber || 1;
        S.stories.unshift(story);
        save(); syncStars();
        setTimeout(function () { openStory(story.id); if (story.fallbackNotice) toast(story.fallbackNotice); }, 320);
      }, wait);
    }).catch(function (err) {
      clearInterval(iv); stopWeave();
      toast('Could not weave that story: ' + err.message);
      location.hash = '#/create';
    });
  }

  /* ---------------- reader ---------------- */
  function openStory(id) {
    var story = S.stories.filter(function (s) { return s.id === id; })[0];
    if (!story) { location.hash = '#/library'; return; }
    currentStory = story; reading = false; A.stopSpeak();
    location.hash = '#/story/' + encodeURIComponent(id);
  }

  /* The reader used to hold a whole chapter in one block of prose, so there was
     nothing for a reading focus to move between. Sentences are grouped into
     short, breath-sized paragraphs (≈190 characters) instead — the rhythm stays
     close to the original, and the focus has something to follow. */
  function paragraphise(raw) {
    var text = String(raw || '').replace(/\s+/g, ' ').trim();
    var sentences = [], cur = '', i, ch, next;
    for (i = 0; i < text.length; i++) {
      ch = text.charAt(i); cur += ch;
      next = text.charAt(i + 1) || ' ';
      if ((ch === '.' || ch === '!' || ch === '?' || ch === '…') && next === ' ') {
        sentences.push(cur.trim()); cur = '';
      }
    }
    if (cur.trim()) sentences.push(cur.trim());
    var out = [], buf = '';
    sentences.forEach(function (s) {
      if (buf && (buf + ' ' + s).length > 190) { out.push(buf); buf = s; }
      else buf = buf ? buf + ' ' + s : s;
    });
    if (buf) out.push(buf);
    return out.length ? out : [text];
  }

  function renderStory(story) {
    applyTheme(story);
    if (S.settings.music && S.settings.sound) { A.setSound(true); A.startMusic(story.cfg.mood); syncSound(); }
    var s = findSetting(story.cfg.setting), m = findMood(story.cfg.mood), lang = (D.LANGUAGES.filter(function (l) { return l.id === story.cfg.language; })[0] || D.LANGUAGES[0]);
    var txn = story.starTransaction;
    var pouchSummary = txn && Number.isSafeInteger(txn.balanceBefore) && Number.isSafeInteger(txn.balanceAfter) &&
      txn.balanceBefore >= 0 && txn.balanceAfter >= 0 && txn.starsSpent === 1 && txn.balanceAfter === txn.balanceBefore - 1
      ? ' · Pouch ' + txn.balanceBefore + ' → ' + txn.balanceAfter + ' Stars' : '';
    var chaptersHTML = story.chapters.map(function (c, i) {
      var v = D.VOICES[c.voice] || D.VOICES.green;
      return '<article class="chapter" id="chap-' + i + '" style="--voice:' + v.css + '">' +
        '<div class="voice-tag"><i></i>' + v.label + ' voice · ' + v.hint + '</div>' +
        '<div class="voice-hint"><span class="vh-label">' + v.icon + ' ' + esc(v.short) + '</span>' +
          '<span class="vh-line">' + esc(v.line) + '</span></div>' +
        '<h3>' + esc(c.title) + '</h3>' +
        '<div class="prose" lang="' + esc(story.cfg.language || 'en') + '">' + paragraphise(E.limitChapterText(c.text)).map(function (p) {
          return '<p>' + E.renderText(p) + '</p>';
        }).join('') + '</div>' +
        '<div class="chap-num">' + String(i + 1).padStart(2, '0') + ' / ' + String(story.chapters.length).padStart(2, '0') + '</div></article>';
    }).join('');

    var html =
      '<div class="story-cover"><div class="scene-art">' + scenery(s, m, false) + '</div><div class="cover-text">' +
      '<div class="meta">✦ ' + esc(story.source === 'ai' ? 'Written by your AI storyteller' : 'Woven on this device') + ' · ' + esc(prettyDate(story.createdAt)) + esc(pouchSummary) + '</div>' +
      '<h1>' + esc(story.title) + '</h1><div class="cover-meta">' +
      '<span class="pill">' + esc(label('age', story.cfg.age)) + '</span><span class="pill">' + esc(String(story.cfg.customValue || '').trim() || label('value', story.cfg.value)) + '</span>' +
      '<span class="pill">' + esc(String(story.cfg.customPlace || '').trim() || s.label) + '</span><span class="pill">' + esc(lang.native) + '</span>' +
      (story.cfg.type === 'series' ? '<span class="pill">Chapter ' + esc(story.chapterNumber || 1) + '</span>' : '') + '</div></div></div>' +
      (story.fallbackNotice ? '<div class="notice">' + esc(story.fallbackNotice) + '</div>' : '') +
      '<div class="reader-toolbar">' +
      '<button class="tool-btn" id="musicToggle">' + (A.isMusicOn() ? '♫ Music on' : '♫ Music') + '</button>' +
      '<button class="tool-btn" id="readToggle">🔊 Read to me</button>' +
      '<button class="tool-btn" id="fontMinus">A−</button><button class="tool-btn" id="fontPlus">A+</button>' +
      '<span class="spacer"></span>' +
      '<button class="tool-btn" id="shareStory">↗ Share</button>' +
      '<button class="tool-btn" id="printStory">⎙ Print</button>' +
      '<button class="tool-btn" id="deleteStory">🗑</button>' +
      '</div>' +
      '<div class="chapter-nav">' + story.chapters.map(function (c, i) { return '<button data-chap="' + i + '" title="' + esc(c.title) + '">' + (i + 1) + '</button>'; }).join('') + '</div>' +
      chaptersHTML +
      '<div class="end-card"><p class="eyebrow">Before the light goes off</p><h3>Let’s talk about it</h3><ol>' +
      story.questions.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ol>' +
      '<div class="actions">' +
      (story.cfg.type === 'series' ? '<button class="pill-gold" id="continueSeries">✦ Next chapter · 1 Star</button>' : '') +
      '<a class="btn-outline" href="#/create">✦ Another story</a>' +
      '<a class="btn-outline" href="#/library">My library</a></div></div>' +
      '<p class="small muted center" style="margin-top:26px">Tap any golden word to hear it. The music softens for a moment to make room.</p>';
    $('#reader').innerHTML = html;
    $('#reader').style.setProperty('--readsize', (S.settings.fontSize || 20) + 'px');
    startReadingFocus();
    wakeOn();                      /* do not let the display sleep mid-sentence */
    A.nightMode(false);            /* a new story starts in daylight audio */

    /* interactions (assignment avoids stacking listeners on re-render) */
    $('#reader').onclick = function (e) {
      var w = e.target.closest('.sound-word');
      if (w) { soundTap(w); return; }
      var nav = e.target.closest('[data-chap]');
      if (nav) {
        $$('.chapter-nav button').forEach(function (b) { b.classList.remove('active'); });
        nav.classList.add('active');
        $('#chap-' + nav.dataset.chap).scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (e.target.closest('#musicToggle')) {
        if (A.isMusicOn()) { A.stopMusic(); } else { A.setSound(true); syncSound(); A.startMusic(story.cfg.mood); }
        $('#musicToggle').textContent = A.isMusicOn() ? '♫ Music on' : '♫ Music';
        $('#musicToggle').classList.toggle('active', A.isMusicOn());
        return;
      }
      if (e.target.closest('#readToggle')) { toggleReadAloud(story); return; }
      if (e.target.closest('#fontMinus') || e.target.closest('#fontPlus')) {
        S.settings.fontSize = Math.max(15, Math.min(28, (S.settings.fontSize || 20) + (e.target.closest('#fontPlus') ? 2 : -2)));
        save(); $('#reader').style.setProperty('--readsize', S.settings.fontSize + 'px'); return;
      }
      if (e.target.closest('#shareStory')) { shareStory(story); return; }
      if (e.target.closest('#printStory')) { window.print(); return; }
      if (e.target.closest('#deleteStory')) {
        confirmModal('Remove this story?', 'It will be deleted from this device. You can export a backup first from the library.', function () {
          S.stories = S.stories.filter(function (x) { return x.id !== story.id; }); save(); toast('Story removed'); location.hash = '#/library';
        }); return;
      }
      if (e.target.closest('#continueSeries')) {
        var cfg = JSON.parse(JSON.stringify(story.cfg));
        cfg.chapterNumber = (story.chapterNumber || 1) + 1;
        cfg.seriesId = story.seriesId;
        createStory(cfg);
      }
    };
    $$('.chapter-nav button')[0] && $$('.chapter-nav button')[0].classList.add('active');
    $('#musicToggle').classList.toggle('active', A.isMusicOn());
  }

  /* ---------------- dark-room reading: focus, wake lock, night mode ----------------
     Three small things that make a phone in a dark bedroom behave:
     · the paragraph under the eye is lit, the rest dims to 35%
     · the screen is not allowed to sleep mid-sentence
     · the last two chapters fade the audio into 800 Hz and slow it down      */
  var focusIO = null, wakeSentinel = null;

  function wakeOn() {
    if (!('wakeLock' in navigator) || wakeSentinel) return;
    try {
      navigator.wakeLock.request('screen').then(function (s) {
        wakeSentinel = s;
        s.addEventListener('release', function () { wakeSentinel = null; });
      }).catch(function () { wakeSentinel = null; });      /* battery saver, iOS */
    } catch (e) { wakeSentinel = null; }
  }
  function wakeOff() {
    try { if (wakeSentinel) { wakeSentinel.release(); wakeSentinel = null; } } catch (e) {}
  }
  /* the browser drops the lock whenever the page hides: take it back */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && $('#view-story').classList.contains('active')) wakeOn();
  });

  function stopReadingFocus() {
    if (focusIO) { focusIO.disconnect(); focusIO = null; }
    $$('#reader .prose p').forEach(function (p) { p.classList.remove('para-dim', 'para-active'); });
  }

  function startReadingFocus() {
    stopReadingFocus();
    if (!('IntersectionObserver' in window)) return;      /* no observer: everything stays lit */
    var paras = $$('#reader .chapter .prose p');
    var chapters = $$('#reader .chapter');
    var endCard = $('#reader .end-card');
    var lastTwo = Math.max(0, chapters.length - 2);       /* ch. VII · Goodnight onward */
    paras.forEach(function (p) { p.classList.add('para-dim'); });

    focusIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var t = en.target;
        if (t.classList.contains('end-card')) {
          if (en.isIntersecting) { A.nightMode(true); wakeOff(); }   /* The end */
          return;
        }
        if (t.classList.contains('chapter')) {
          if (!en.isIntersecting) return;
          var idx = parseInt(String(t.id).replace('chap-', ''), 10) || 0;
          A.nightMode(idx >= lastTwo);
          return;
        }
        t.classList.toggle('para-active', en.isIntersecting);
        t.classList.toggle('para-dim', !en.isIntersecting);
      });
    }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });

    paras.forEach(function (p) { focusIO.observe(p); });
    chapters.forEach(function (c) { focusIO.observe(c); });
    if (endCard) focusIO.observe(endCard);
  }

  function toggleReadAloud(story) {
    var btn = $('#readToggle');
    if (reading) {
      reading = false; A.stopSpeak(); btn.classList.remove('active'); btn.textContent = '🔊 Read to me';
      $$('.chapter').forEach(function (c) { c.style.boxShadow = ''; }); return;
    }
    A.setSound(true); syncSound();
    var lang = (D.LANGUAGES.filter(function (l) { return l.id === story.cfg.language; })[0] || D.LANGUAGES[0]).tts;
    var i = 0;
    function next() {
      if (!reading) return;
      if (i >= story.chapters.length) {
        reading = false; btn.classList.remove('active'); btn.textContent = '🔊 Read to me';
        $$('.chapter').forEach(function (c) { c.style.boxShadow = ''; }); toast('The end · goodnight ✦'); return;
      }
      var idx = i++;
      $$('.chapter').forEach(function (c, j) { c.style.boxShadow = j === idx ? '0 0 0 1px var(--gold) inset' : ''; });
      var el = $('#chap-' + idx); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var ok = A.speak(E.plainText(story.chapters[idx].text), lang, function () { setTimeout(next, 350); });
      if (!ok) { reading = false; btn.textContent = '🔊 Read to me'; toast('Read-aloud is not available in this browser'); }
    }
    reading = true; btn.classList.add('active'); btn.textContent = '⏹ Stop reading';
    next();
  }

  function shareStory(story) {
    var text = story.title + '\n\n' + story.chapters.map(function (c) { return c.title + '\n' + E.plainText(c.text); }).join('\n\n') + '\n\n— made with storiesAI ✦';
    if (navigator.share) navigator.share({ title: story.title, text: text }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast('Story copied to clipboard'); }, function () { toast('Could not copy'); });
    else toast('Sharing is not supported here');
  }

  /* ---------------- library ---------------- */
  var libFilter = 'all';
  function renderLibrary() {
    var filters = [['all', 'All'], ['en', 'English'], ['hi', 'Hindi'], ['bn', 'Bengali'], ['series', 'Series']];
    $('#libraryFilters').innerHTML = filters.map(function (f) { return '<button class="pill' + (libFilter === f[0] ? ' active' : '') + '" data-filter="' + f[0] + '">' + f[1] + '</button>'; }).join('');
    var list = S.stories.filter(function (s) {
      if (libFilter === 'series') return s.cfg.type === 'series';
      if (libFilter === 'all') return true;
      return s.cfg.language === libFilter;
    });
    if (!list.length) {
      $('#libraryGrid').innerHTML = '<div class="empty" style="grid-column:1/-1"><span class="em">🌙</span><h3>' + (S.stories.length ? 'No stories in this shelf yet' : 'Your library is waiting for its first story') + '</h3><p class="small">One Star, thirty seconds, one tale that has never been told.</p><a class="pill-gold" href="#/create" style="margin-top:20px">✦ Write tonight’s story</a></div>';
    } else {
      $('#libraryGrid').innerHTML = list.map(function (s) {
        var st = findSetting(s.cfg.setting), md = findMood(s.cfg.mood);
        return '<div class="story-card" data-open="' + esc(s.id) + '" role="button" tabindex="0">' +
          '<div class="cover" style="--c1:' + st.sky[0] + ';--c2:' + st.sky[1] + '">' + scenery(st, md, true) + '<span class="em">' + st.emoji + '</span></div>' +
          '<div class="body"><h4>' + esc(s.title) + '</h4><div class="meta">' + esc(String(s.cfg.customValue || '').trim() || label('value', s.cfg.value)) + ' · ' + esc(label('age', s.cfg.age)) + '<br>' + esc(prettyDate(s.createdAt)) + (s.cfg.type === 'series' ? ' · Chapter ' + esc(s.chapterNumber || 1) : '') + '</div></div>' +
          '<div class="foot"><span>' + esc((D.LANGUAGES.filter(function (l) { return l.id === s.cfg.language; })[0] || D.LANGUAGES[0]).label) + ' · ' + (s.source === 'ai' ? 'AI' : 'offline') + '</span><button data-del="' + esc(s.id) + '">Remove</button></div></div>';
      }).join('');
    }
    syncStars();
  }
  function initLibrary() {
    var ic = $('#inviteCode'); if (ic) ic.textContent = S.inviteCode;
    $('#libraryFilters').addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]'); if (!b) return;
      libFilter = b.dataset.filter; renderLibrary();
    });
    $('#libraryGrid').addEventListener('click', function (e) {
      var del = e.target.closest('[data-del]');
      if (del) {
        e.stopPropagation();
        confirmModal('Remove this story?', 'This deletes it from this device permanently.', function () {
          S.stories = S.stories.filter(function (x) { return x.id !== del.dataset.del; }); save(); renderLibrary(); toast('Story removed');
        }); return;
      }
      var card = e.target.closest('[data-open]'); if (card) openStory(card.dataset.open);
    });
    $('#libraryGrid').addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-open]')) { e.preventDefault(); openStory(e.target.dataset.open); }
    });
    $('#addStarsBtn').onclick = function () { addStarsModal(); };
    $('#copyCode').onclick = function () {
      var t = S.inviteCode;
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { toast('Invite code copied'); }, function () { toast(t); });
      else toast(t);
      if (!S.inviteCredited) { S.inviteCredited = true; S.stars += 3; save(); syncStars(); toast('✦ 3 welcome Stars for sharing'); }
    };
    $('#exportBtn').onclick = function () {
      var blob = new Blob([JSON.stringify({ app: 'storiesAI', version: 1, exportedAt: new Date().toISOString(), stories: S.stories, stars: S.stars }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'storiesai-stories-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); toast('Backup downloaded');
    };
    $('#importBtn').onclick = function () { $('#importFile').click(); };
    $('#importFile').onchange = function () {
      var file = this.files && this.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result), incoming = data.stories || [];
          if (!Array.isArray(incoming)) throw new Error('bad file');
          var ids = Object.create(null); S.stories.forEach(function (s) { ids[s.id] = 1; });
          var added = 0;
          incoming.forEach(function (s) {
            if (!s || !s.id || ids[s.id] || !s.cfg || typeof s.cfg !== 'object' || Array.isArray(s.cfg) || !E.areValidChapters(s.chapters)) return;
            if (!E.isValidNames(s.cfg.names)) return;
            /* Older backups may omit this field; treat those as chapter one. Reject
               supplied values unless they are bounded, positive safe integers. */
            if (!Object.prototype.hasOwnProperty.call(s, 'chapterNumber')) s.chapterNumber = 1;
            if (!isValidChapterNumber(s.chapterNumber)) return;
            S.stories.push(s); ids[s.id] = 1; added++;
          });
          S.stories.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
          save(); renderLibrary(); toast('Imported ' + added + ' story' + (added === 1 ? '' : 'ies'));
        } catch (err) { toast('That file is not a storiesAI backup'); }
      };
      reader.readAsText(file); this.value = '';
    };
  }

  function syncStars() {
    ['#walletStars', '#summaryStars'].forEach(function (sel) { var el = $(sel); if (el) el.textContent = S.stars; });
  }
  function addStarsModal(intro) {
    var packs = [[10, 'Pouch of Stars'], [30, 'Chest of Stars'], [100, 'Sky of Stars']];
    modal('<h3>✦ ' + (intro || 'A pouch of free Stars') + '</h3><p class="small muted">In this edition Stars are a gift. Pick a pouch and keep telling stories — nothing to pay, no account.</p>' +
      '<div class="pill-row" style="margin-top:26px">' + packs.map(function (p) { return '<button class="pill" data-add="' + p[0] + '">' + p[0] + ' ✦<em>' + esc(p[1]) + '</em></button>'; }).join('') + '</div>',
      function (m, close) {
        m.addEventListener('click', function (e) {
          var b = e.target.closest('[data-add]'); if (!b) return;
          S.stars += parseInt(b.dataset.add, 10); save(); syncStars(); close(); toast('✦ ' + b.dataset.add + ' Stars added');
          if (location.hash.indexOf('#/create') === 0 || location.hash.indexOf('#/generating') === 0) { /* stay */ }
        });
      });
  }

  /* ---------------- settings + install + cookies ---------------- */
  function settingsModal() {
    var ai = S.settings.ai;
    modal('<h3>Settings & the storyteller</h3><p class="small muted">Everything here stays in this browser. Nothing is uploaded by storiesAI.</p>' +
      '<div class="field"><label>Default story language</label><select class="input" id="setLang">' + D.LANGUAGES.map(function (l) { return '<option value="' + l.id + '"' + (S.settings.language === l.id ? ' selected' : '') + '>' + l.label + ' · ' + l.native + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Reading size</label><input class="input" type="number" id="setFont" min="15" max="28" value="' + (S.settings.fontSize || 20) + '"></div>' +
      '<div class="field"><label class="switch"><input type="checkbox" id="setMusic"' + (S.settings.music ? ' checked' : '') + '><span>Play music automatically in a story<small>Synthesised live on your device; you can always mute it.</small></span></label></div>' +
      '<div class="divider" style="margin:26px 0"></div>' +
      '<h3 style="font-size:23px">Bring your own AI (optional)</h3><p class="note">By default stories are woven offline from storiesAI’s own age-aware sentence bank — instant, private and free. If you want AI-written prose instead, point storiesAI at any OpenAI-compatible chat endpoint. Your key is stored only on this device and is sent only to that endpoint. If it fails or times out, the offline storyteller takes over automatically.</p>' +
      '<div class="field"><label class="switch"><input type="checkbox" id="aiEnabled"' + (ai.enabled ? ' checked' : '') + '><span>Use my AI endpoint<small>Otherwise: offline engine</small></span></label></div>' +
      '<div class="field"><label>Endpoint URL</label><input class="input" id="aiEndpoint" placeholder="https://api.openai.com/v1/chat/completions" value="' + esc(ai.endpoint) + '"></div>' +
      '<div class="field"><label>API key <span class="muted">(optional for local servers)</span></label><input class="input" id="aiKey" type="password" placeholder="sk-…" value="' + esc(ai.key) + '"></div>' +
      '<div class="field"><label>Model</label><input class="input" id="aiModel" value="' + esc(ai.model) + '"></div>' +
      '<p class="note">Note: the endpoint must allow browser requests (CORS). A plain http://localhost endpoint will be blocked when this page is served over https — use a local server with CORS enabled, or keep the offline engine. Never put a secret key into a page you share publicly.</p>' +
      '<div class="actions"><button class="pill-gold" id="saveSettings">Save settings</button><button class="btn-outline" id="clearData">Clear all my data</button></div>',
      function (m, close) {
        $('#saveSettings', m).onclick = function () {
          S.settings.language = $('#setLang', m).value;
          S.settings.fontSize = Math.max(15, Math.min(28, parseInt($('#setFont', m).value, 10) || 20));
          S.settings.music = $('#setMusic', m).checked;
          S.settings.ai = { enabled: $('#aiEnabled', m).checked, endpoint: $('#aiEndpoint', m).value.trim(), key: $('#aiKey', m).value.trim(), model: $('#aiModel', m).value.trim() || 'gpt-4o-mini' };
          S.wizard.language = S.settings.language;
          save(); close(); renderWizard(); toast('Settings saved ✦');
        };
        $('#clearData', m).onclick = function () {
          close(); confirmModal('Clear everything?', 'All saved stories, Stars and settings on this device will be erased. Export a backup first if you want to keep them.', function () {
            localStorage.removeItem(KEY); S = defaults(); save(); clearTheme(); renderWizard(); renderLibrary(); syncStars(); toast('Everything cleared — a fresh night sky');
          });
        };
      });
  }
  function installModal() {
    modal('<h3>Install storiesAI</h3><p class="small muted">Keep the night sky on your home screen. Once installed, stories, music and your library work with no internet at all.</p>' +
      '<div class="how-grid" style="margin-top:22px;grid-template-columns:1fr"><div class="how-item"><b>Chrome, Edge, Android</b><p>Tap the browser menu → “Install app” / “Add to Home screen”. Or use the install button below if your browser offers it.</p></div>' +
      '<div class="how-item"><b>iPhone & iPad (Safari)</b><p>Tap Share → “Add to Home Screen”. storiesAI then opens full-screen, like a real app.</p></div>' +
      '<div class="how-item"><b>Desktop</b><p>Look for the install icon in the address bar, or use your browser menu. The app also works offline right here in the tab.</p></div></div>' +
      '<div class="actions"><button class="pill-gold" id="modalInstall"' + (deferredInstall ? '' : ' disabled') + '>⬇ Install now</button><button class="btn-outline" id="closeInstall">Maybe later</button></div>' +
      '<p class="note">If the button is disabled, your browser may already have storiesAI installed, or it does not offer a direct install prompt — use the menu steps above.</p>',
      function (m, close) {
        $('#closeInstall', m).onclick = close;
        $('#modalInstall', m).onclick = function () { if (deferredInstall) { deferredInstall.prompt(); close(); } };
      });
  }
  function cookieModal() {
    modal('<h3>Cookie & storage preferences</h3><p class="small muted">storiesAI sets no tracking cookies and loads no analytics. It only uses this browser’s local storage for your stories, Stars and settings, and a service worker cache so the app opens offline.</p>' +
      '<div class="field"><label class="switch"><input type="checkbox" checked disabled><span>Essential local storage<small>Required to remember your library. Always on.</small></span></label></div>' +
      '<div class="field"><label class="switch"><input type="checkbox" id="analyticsToggle"><span>Statistics & analytics<small>Not implemented. storiesAI has none.</small></span></label></div>' +
      '<div class="actions"><button class="pill-gold" id="saveCookies">Save preferences</button></div>',
      function (m, close) { $('#analyticsToggle', m).checked = S.cookie === 'all'; $('#saveCookies', m).onclick = function () { S.cookie = $('#analyticsToggle', m).checked ? 'all' : 'essential'; save(); close(); toast('Preferences saved'); }; });
  }
  /* ---------------- motion preference ----------------
     Phones often report `prefers-reduced-motion: reduce` (accessibility setting,
     "remove animations" or battery saver), which used to leave the whole landing
     page static. Anyone can opt back into the full show from the menu; the choice
     is remembered on the device. */
  var MOTION_KEY = 'storiesai.motion';
  function motionPref() { try { return localStorage.getItem(MOTION_KEY) || ''; } catch (e) { return ''; } }
  function motionForced() { return document.documentElement.classList.contains('force-motion'); }
  function setMotion(on) {
    try { localStorage.setItem(MOTION_KEY, on ? 'full' : 'auto'); } catch (e) {}
    document.documentElement.classList.toggle('force-motion', !!on);
    if (window.__sceneUpdate) window.__sceneUpdate();
  }
  function initMotion() {
    if (motionPref() === 'full') document.documentElement.classList.add('force-motion');
    var reduced = false;
    try { reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}
    if (!reduced || motionForced()) return;
    var nudged = false;
    try { nudged = sessionStorage.getItem('storiesai.motionNudge') === '1'; } catch (e) {}
    if (nudged) return;
    setTimeout(function () {
      try { sessionStorage.setItem('storiesai.motionNudge', '1'); } catch (e) {}
      toast('Full motion is off on this phone — tap ☰ to turn it on');
    }, 2600);
  }

  /* ---------------- diagnostics: add ?debug=1 to the URL ----------------
     A tiny readout of live rendering and audio output so a phone screenshot
     shows whether the sky is running and whether sound reaches the output graph. */
  function initDebug() {
    if (!/[?&]debug/.test(location.search)) return;
    var el = document.createElement('div');
    el.id = 'dbg';
    el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:200;max-width:calc(100% - 16px);font:10px/1.55 ui-monospace,Menlo,monospace;color:#fff6dc;background:rgba(4,2,12,.88);border:1px solid rgba(243,211,138,.35);padding:8px 10px;border-radius:8px;white-space:pre-wrap;word-break:break-word;pointer-events:none';
    document.body.appendChild(el);
    var mq = function (q) { try { return window.matchMedia(q).matches ? 'yes' : 'no'; } catch (e) { return '?'; } };
    var build = function () {
      var w = (window.CWorld && window.CWorld.info) ? window.CWorld.info() : { up: false, reason: 'no world' };
      var st = (window.CStars && window.CStars.info) ? window.CStars.info() : { running: false, count: 0 };
      var audio = A && A.getDiagnostics ? A.getDiagnostics() : { state: 'unavailable', soundOn: false, musicOn: false, outputRms: 0 };
      return [
        'sky: ' + (w.up ? 'webgl flying' : 'webgl OFF — ' + (w.reason || '?')),
        'fps ' + (w.fps || '–') + ' · dpr ' + (w.dpr || '–') + ' · points ' + (w.points || 0) + ' · quality ' + (w.quality || 0),
        'shader ' + (w.low ? 'phone (2 octaves)' : 'full (5 octaves)') + ' · cap ' + (w.cap || 60) + 'fps',
        'book ' + (w.book || 0) + ' points · turn ' + (window.CWorld && window.CWorld.turn ? window.CWorld.turn().toFixed(2) : '–'),
        'world: ' + (w.world || 'plain night') + ' · horizon + palette lerp',
        '2d sky: ' + (st.running ? 'running · ' + st.count + ' stars · mode ' + st.mode : 'off'),
        'audio: ' + audio.state + ' · sound ' + (audio.soundOn ? 'on' : 'off') + ' · music ' + (audio.musicOn ? 'on' : 'off') + ' · output RMS ' + Number(audio.outputRms || 0).toFixed(5),
        'reduced-motion ' + mq('(prefers-reduced-motion: reduce)') + ' · motion override ' + (document.documentElement.classList.contains('force-motion') ? 'yes' : 'no'),
        'view ' + window.innerWidth + '×' + window.innerHeight + ' · scroll ' + Math.round(window.scrollY || 0),
        w.renderer ? String(w.renderer).slice(0, 46) : ''
      ].filter(Boolean).join('\n');
    };
    var tick = function () { el.textContent = build(); setTimeout(tick, 700); };
    tick();
  }

  function initOverlays() {
    $('#signInBtn').onclick = function () {
      modal('<h3>Your library, right here</h3><p class="small muted">storiesAI has no accounts and no passwords. Your stories live on this device, so there is nothing to sign in to — just open your library whenever you like.</p><div class="actions"><a class="pill-gold" href="#/library" data-close>OPEN MY LIBRARY</a><button class="btn-outline" data-close>MAYBE LATER</button></div>',
        function (m, close) { $$('[data-close]', m).forEach(function (a) { a.onclick = close; }); });
    };
    $('#settingsBtn').onclick = settingsModal;
    $('#settingsFooter').onclick = settingsModal;
    $('#cookiePrefs').onclick = cookieModal;
    $('#installFooter').onclick = installModal;
    $('#installBtn').onclick = function () { if (deferredInstall) { deferredInstall.prompt(); } else { installModal(); } };
    $('#menuBtn').onclick = function () {
      modal('<h3>Where to?</h3><div class="actions" style="flex-direction:column;align-items:stretch"><a class="pill-gold" href="#/create" data-close>✦ Create a story</a><a class="btn-outline" href="#/library" data-close>📚 My library</a><a class="btn-outline" href="#/home" data-close data-scene="10">How it works</a><a class="btn-outline" href="#/home" data-close data-scene="10">FAQ</a><button class="btn-outline" data-daynight>Awake / asleep</button><button class="btn-outline" data-motion></button><button class="btn-outline" data-sky></button><a class="btn-outline" href="#/home" data-close>Back to the night sky</a></div>',
        function (m, close) {
          $$('[data-close]', m).forEach(function (a) { a.onclick = function () { close(); }; });
          /* the AWAKE / ASLEEP rail is a phone-friendly line only, so the night
             mode toggle lives here too */
          var sk = $('[data-sky]', m);
          if (sk) {
            sk.textContent = S.settings.sky === 'stars' ? 'Sky: 2D stars' : 'Sky: flying world';
            sk.onclick = function () {
              var toStars = S.settings.sky !== 'stars';
              S.settings.sky = toStars ? 'stars' : 'auto';
              save();
              if (toStars) {
                /* live switch: the 2D sky is already built, just stop flying */
                if (window.CWorld && window.CWorld.stop) window.CWorld.stop('chosen 2D sky');
                else if (window.CStars) window.CStars.init();
                close();
                toast('2D stars — lighter on the battery');
              } else {
                location.reload();   /* bringing the flying world back needs a fresh context */
              }
            };
          }
          var mt = $('[data-motion]', m);
          if (mt) {
            var paintMotion = function () { mt.textContent = motionForced() ? 'Motion: full ✦' : 'Motion: follow phone'; };
            paintMotion();
            mt.onclick = function () {
              setMotion(!motionForced());
              paintMotion();
              toast(motionForced() ? 'Full motion on ✦' : 'Motion follows your phone again');
            };
          }
          var dn = $('[data-daynight]', m);
          if (dn) dn.onclick = function () {
            close();
            S.awake = !S.awake; save(); applyAwake();
            toast(S.awake ? 'Awake — a lighter night' : 'Asleep — deep midnight');
          };
        });
    };
    if (S.cookie === null) $('#cookieBanner').style.display = 'flex';
    $('#cookieAccept').onclick = function () { S.cookie = 'all'; save(); $('#cookieBanner').style.display = 'none'; };
    $('#cookieReject').onclick = function () { S.cookie = 'essential'; save(); $('#cookieBanner').style.display = 'none'; };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { $('#modalRoot').innerHTML = ''; } });
  }

  /* ---------------- sound + day/night ---------------- */
  function syncSound() {
    var on = A.isSoundOn();
    var lbl = $('#soundLabel'); if (lbl) lbl.textContent = on ? 'SOUND ON' : 'SOUND';
    var hero = $('#heroSoundLabel'); if (hero) hero.textContent = on ? 'SOUND ON' : 'LISTEN WITH SOUND';
    $('#soundBtn').classList.toggle('playing', on);
    $('#heroSound').classList.toggle('playing', on);
  }
  function toggleSound(startMusic) {
    var on = !A.isSoundOn();
    A.setSound(on);
    S.settings.sound = on; save();
    if (on) { if (startMusic !== false) A.startMusic((currentStory && currentStory.cfg.mood) || S.wizard.mood || 'gentle'); }
    else { A.stopMusic(); A.stopSpeak(); }
    syncSound();
  }
  function initSound() {
    $('#soundBtn').onclick = function () { toggleSound(); };
    $('#heroSound').onclick = function () { toggleSound(); };
    $('#daynightBtn').onclick = function () {
      S.awake = !S.awake; save(); applyAwake();
      toast(S.awake ? 'Awake — a lighter night' : 'Asleep — deep midnight');
    };
    applyAwake();
    if (S.settings.sound) { /* browsers require a gesture: show as off until tapped */ A.setSound(false); }
    syncSound();
  }
  function applyAwake() {
    document.body.classList.toggle('awake', !!S.awake);
    document.body.classList.toggle('asleep', !S.awake);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', S.awake ? '#171334' : '#05040f');
    if (window.CStars) window.CStars.setAwake(S.awake);
  }

  /* ---------------- routing ---------------- */
  function showView(name) {
    $$('.view').forEach(function (v) { v.classList.remove('active'); });
    var el = $('#view-' + name);
    if (el) el.classList.add('active');
    if (name !== 'story') {
      clearTheme(); A.stopMusic(); A.stopSpeak(); reading = false;
      wakeOff(); stopReadingFocus(); A.nightMode(false);
    }
    if (name !== 'create' && name !== 'story') {
      if (window.CWorld && window.CWorld.setScene) window.CWorld.setScene(null);
      if (window.CStars && window.CStars.setScene) window.CStars.setScene(null);
    }
    document.body.classList.toggle('app-view', name !== 'home');
    if (name === 'home') {
      $('#storyCounter').textContent = (1767 + S.stories.length).toLocaleString();
      if (window.__sceneUpdate) setTimeout(window.__sceneUpdate, 60);
    }
    if (name === 'library') renderLibrary();
    if (name === 'create') { renderWizard(); previewSetting(S.wizard.setting); }
    if (name === 'story' && currentStory) renderStory(currentStory);
  }
  function route() {
    var h = location.hash || '#/home';
    var parts = h.replace(/^#\/?/, '').split('/');
    var view = parts[0] || 'home';
    if (view === 'story' && parts[1]) {
      var id = decodeURIComponent(parts[1]);
      currentStory = S.stories.filter(function (s) { return s.id === id; })[0] || null;
      if (!currentStory) { location.hash = '#/library'; return; }
      showView('story');
    } else if (['home', 'create', 'generating', 'story', 'library'].indexOf(view) === -1) {
      showView('home');
    } else {
      showView(view);
    }
    window.scrollTo(0, 0);
  }
  function initRouting() {
    window.addEventListener('hashchange', route);
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-scroll]');
      if (a) {
        e.preventDefault();
        var target = a.getAttribute('data-scroll');
        if (location.hash !== '#/home') location.hash = '#/home';
        setTimeout(function () { var el = document.getElementById(target); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
        return;
      }
      var sc = e.target.closest('[data-scene]');
      if (!sc) return;
      e.preventDefault();
      var idx = parseInt(sc.getAttribute('data-scene'), 10);
      var go = function () { var el = $$('.scene')[idx]; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
      if (location.hash !== '#/home') { location.hash = '#/home'; setTimeout(go, 160); } else go();
    });
    route();
  }

  /* ---------------- PWA ---------------- */

  /* The install nudge. Deliberately shy: never on a first visit, never while the
     cookie card is still asking, never on the night sky's first nine seconds,
     and once dismissed it stays quiet for a month. */
  var INSTALL_KEY = 'storiesai.installPrompt.v1', installTimer = 0;
  var INSTALL_SNOOZE = 30 * 24 * 60 * 60 * 1000;

  function installState() {
    try {
      var raw = JSON.parse(localStorage.getItem(INSTALL_KEY) || '{}');
      return (raw && typeof raw === 'object') ? raw : {};
    } catch (e) { return {}; }
  }
  function saveInstallState(st) {
    try { localStorage.setItem(INSTALL_KEY, JSON.stringify(st)); } catch (e) { /* private mode: fine, it just forgets */ }
  }
  function hideInstallBanner() {
    clearTimeout(installTimer);
    var b = $('#installBanner');
    if (b) b.classList.remove('show');
  }
  function snoozeInstall() {
    var st = installState();
    st.snoozeUntil = Date.now() + INSTALL_SNOOZE;
    saveInstallState(st);
    hideInstallBanner();
  }
  function isStandalone() {
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
      return !!window.navigator.standalone;
    } catch (e) { return false; }
  }
  function onHome() { return !location.hash || location.hash.indexOf('#/home') === 0; }

  function maybeShowInstallBanner() {
    var banner = $('#installBanner');
    if (!banner) return;
    var st = installState();
    st.visits = (Number(st.visits) || 0) + 1;
    saveInstallState(st);
    if (st.visits < 2) return;                       /* never on the very first night */
    if (st.snoozeUntil && st.snoozeUntil > Date.now()) return;
    if (isStandalone()) return;                      /* already living on the home screen */
    var cookie = $('#cookieBanner');
    if (S.cookie === null && cookie && cookie.style.display !== 'none') return; /* one card at a time */

    clearTimeout(installTimer);
    installTimer = setTimeout(function () {
      if (!onHome() || isStandalone()) return;
      var btn = $('#ibInstall');
      if (btn) btn.textContent = deferredInstall ? 'INSTALL NOW' : 'GOT IT';
      banner.classList.add('show');
      var now = installState();
      now.lastShown = Date.now();
      saveInstallState(now);
    }, 9000);
  }

  function initPWA() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline shell unavailable, app still works */ });
    }
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); deferredInstall = e;
      $('#installBtn').style.display = 'inline-flex';
      var ib = $('#ibInstall');
      if (ib) ib.textContent = 'INSTALL NOW';
    });
    window.addEventListener('appinstalled', function () { deferredInstall = null; $('#installBtn').style.display = 'none'; toast('storiesAI is on your home screen ✦'); });
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) $('#installBtn').style.display = 'none';

    var ibGo = $('#ibInstall'), ibClose = $('#ibClose');
    if (ibGo) ibGo.onclick = function () {
      if (deferredInstall && typeof deferredInstall.prompt === 'function') {
        try { deferredInstall.prompt(); } catch (e) { /* unsupported: fall through to the hint */ }
        deferredInstall = null;
        snoozeInstall();
      } else {
        snoozeInstall();
        toast('Menu → Add to Home Screen keeps stories offline');
      }
    };
    if (ibClose) ibClose.onclick = snoozeInstall;
    window.addEventListener('hashchange', function () { if (!onHome()) hideInstallBanner(); });
    maybeShowInstallBanner();
    function net() { document.body.classList.toggle('is-offline', !navigator.onLine); }
    window.addEventListener('online', net); window.addEventListener('offline', net); net();
  }

  /* ---------------- boot ---------------- */
  /* Sky: 'auto' flies the WebGL world (falling back to the 2D canvas sky),
     'stars' keeps the lighter 2D sky — a per-device escape hatch from ☰ */
  function startSky() {
    if (S.settings.sky === 'stars' || !window.CWorld) { window.CStars.init(); if (window.__sceneUpdate) window.__sceneUpdate(); return; }
    var worldUp = false;
    try { worldUp = window.CWorld.init(document.getElementById('world')); } catch (e) { worldUp = false; }
    if (worldUp) {
      document.body.classList.add('has-world');
      var total = Math.max(1, (document.getElementById('scenes') || document.body).scrollHeight - window.innerHeight);
      window.CWorld.setProgress((window.scrollY || 0) / total);
    } else { window.CStars.init(); }
    if (window.__sceneUpdate) window.__sceneUpdate();
  }

  function boot() {
    renderHome(); window.__sceneUpdate = initScenes();
    if (window.CCursor) window.CCursor.init();
    initMotion(); initWizard(); initLibrary(); initOverlays(); initSound(); initRouting(); initPWA(); initDebug();
    syncStars();
    /* building 20k+ particles is real work on a slow phone: let the hero paint
       first, then raise the sky one frame later */
    setTimeout(startSky, 90);
    /* the sky rises, the book gathers, then the words arrive */
    setTimeout(function () {
      var h = $('.scene.hero');
      if (h) h.classList.add('hero-in');
    }, 420);
    if (S.settings.music && !A.isMusicOn()) { /* music starts on first sound gesture or when a story opens */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
