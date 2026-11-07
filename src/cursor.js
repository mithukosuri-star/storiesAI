/* storiesAI — custom cursor + magnetic hover, ported from the reference interaction.
   - a bright cream dot that follows the pointer almost instantly (lerp ~0.2/frame)
   - a gold halo ring that trails behind it and grows on anything clickable
   - primary buttons lean towards the pointer, then spring back on leave
   Hidden automatically on touch devices and for reduced-motion visitors. */
window.CCursor = (function () {
  function mq(q) {
    try { return !!(window.matchMedia && window.matchMedia(q).matches); } catch (e) { return false; }
  }
  var fine = mq('(hover: hover) and (pointer: fine)');
  var calm = mq('(prefers-reduced-motion: reduce)');
  var root, ring, dot, live = false;
  var tx = 0, ty = 0, dx = 0, dy = 0, rx = 0, ry = 0;
  var raf = null, over = false;

  function build() {
    root = document.createElement('div');
    root.className = 'ai-cursor';
    root.setAttribute('aria-hidden', 'true');
    ring = document.createElement('i'); ring.className = 'ai-cursor__ring';
    dot = document.createElement('i'); dot.className = 'ai-cursor__dot';
    root.appendChild(ring); root.appendChild(dot);
    document.body.appendChild(root);
  }

  function show() { if (!live) { live = true; root.classList.add('is-live'); } }
  function hide() { live = false; root.classList.remove('is-live'); root.classList.remove('is-over', 'is-star'); }

  function frame() {
    var ease = calm ? 1 : .2;
    dx += (tx - dx) * ease;
    dy += (ty - dy) * ease;
    rx += (tx - rx) * (calm ? 1 : .11);
    ry += (ty - ry) * (calm ? 1 : .11);
    dot.style.transform = 'translate3d(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px,0)';
    ring.style.transform = 'translate3d(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px,0)';
    raf = requestAnimationFrame(frame);
  }

  function onMove(e) {
    tx = e.clientX; ty = e.clientY;
    if (!live) {
      dx = rx = tx; dy = ry = ty;
      show();
    }
    var hit = e.target && e.target.closest ? e.target.closest('a, button, summary, [role="button"], input, textarea, select, label') : null;
    var star = !!(hit && hit.matches('.pill-gold, .pill-outline, .sound-word, .icon-btn, .circle-btn, .choice, .pill'));
    if (!!hit !== over) { over = !!hit; root.classList.toggle('is-over', over); }
    root.classList.toggle('is-star', star);
  }

  /* ---------------- magnetic buttons ---------------- */
  var magnets = [];
  function magnetise(scope) {
    if (!fine) return;
    var els = (scope || document).querySelectorAll('.pill-gold, .btn-outline, .icon-btn, .circle-btn, .sound-word, .voice-item, [data-magnet]');
    Array.prototype.forEach.call(els, function (el) {
      if (el.__mag) return;
      el.__mag = true;
      el.classList.add('ai-magnet');
      var mx = 0, my = 0, cx = 0, cy = 0, raf2 = null, pull = parseFloat(el.getAttribute('data-magnet')) || .28;
      function loop() {
        cx += (mx - cx) * (calm ? 1 : .18);
        cy += (my - cy) * (calm ? 1 : .18);
        el.style.transform = 'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)';
        if (Math.abs(mx - cx) > .05 || Math.abs(my - cy) > .05 || mx || my) { raf2 = requestAnimationFrame(loop); }
        else { el.style.transform = ''; raf2 = null; }
      }
      el.addEventListener('pointermove', function (ev) {
        if (!fine) return;
        var r = el.getBoundingClientRect();
        mx = (ev.clientX - r.left - r.width / 2) * pull;
        my = (ev.clientY - r.top - r.height / 2) * (pull + .12);
        if (!raf2) raf2 = requestAnimationFrame(loop);
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        mx = 0; my = 0;
        if (!raf2) raf2 = requestAnimationFrame(loop);
      });
      magnets.push(el);
    });
  }

  function init() {
    if (!fine || calm || !document.body) return;   /* touch / reduced-motion: keep the native pointer */
    build();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', function () { root.classList.add('is-press'); }, { passive: true });
    window.addEventListener('pointerup', function () { root.classList.remove('is-press'); }, { passive: true });
    document.addEventListener('pointerleave', hide);
    document.addEventListener('pointerenter', function (e) { if (e.clientX || e.clientY) onMove(e); });
    window.addEventListener('blur', hide);
    document.documentElement.classList.add('ai-cursor-on');
    raf = requestAnimationFrame(frame);
    magnetise(document);
  }

  return { init: init, refresh: magnetise, fine: fine };
})();
