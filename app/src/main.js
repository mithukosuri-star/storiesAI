/* ------------------------------------------------------------------
   FiabaMia — immersive stage shell
   The original experience runs inside the frame, untouched: every
   scroll-driven 3D animation, particle field and audio cue is the
   real thing, not a reproduction. This file only manages the shell
   around it (reveal, immersive mode, restart, failure fallback).
------------------------------------------------------------------ */

import "./style.css"

const stage = document.getElementById('stage');
const scene = document.getElementById('scene');
const veil = document.getElementById('veil');
const fallback = document.getElementById('fallback');
const hud = document.getElementById('hud');
const hudToggle = document.getElementById('hudToggle');
const btnFullscreen = document.getElementById('btnFullscreen');
const btnReload = document.getElementById('btnReload');

/* ------------------------------------------------------- reveal the scene */

let revealed = false;

function reveal() {
  if (revealed) return;
  revealed = true;
  scene.dataset.ready = 'true';
  // let the frame fade up underneath before lifting the veil away
  window.setTimeout(() => {
    veil.dataset.gone = 'true';
    hideIdleLater();
  }, 450);
}

function showFallback() {
  if (revealed) return;
  fallback.hidden = false;
  veil.dataset.gone = 'true';
}

// A successful cross-origin frame fires `load` and then blocks scripted
// access to its document — exactly what we want. No load within the
// grace period means the browser refused to embed it.
scene.addEventListener('load', () => window.setTimeout(reveal, 700));
window.setTimeout(() => {
  if (!revealed) showFallback();
}, 16000);

/* ------------------------------------------------------- immersive mode */

async function enterImmersive(on) {
  if (on) {
    try {
      await stage.requestFullscreen({ navigationUI: 'hide' });
    } catch {
      // fullscreen can be denied (iOS Safari, iframes); degrade to a
      // clean letterbox-free view instead of failing loudly
      stage.dataset.immersive = 'true';
    }
  } else if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  }
}

document.addEventListener('fullscreenchange', () => {
  const on = Boolean(document.fullscreenElement);
  stage.dataset.immersive = on ? 'true' : 'false';
  btnFullscreen.setAttribute('aria-pressed', on ? 'true' : 'false');
});

btnFullscreen.addEventListener('click', () => {
  const on = stage.dataset.immersive !== 'true' && !document.fullscreenElement;
  enterImmersive(on);
});

/* ------------------------------------------------------------- restart */

btnReload.addEventListener('click', () => {
  // reloading the frame returns the original experience to its first scene
  veil.dataset.gone = 'false';
  scene.dataset.ready = 'false';
  revealed = false;
  fallback.hidden = true;
  const url = new URL(scene.src);
  url.searchParams.set('r', String(Date.now()));
  scene.src = url.toString();
  window.setTimeout(() => {
    if (!revealed) reveal();
  }, 4000);
  window.setTimeout(() => {
    if (!revealed) showFallback();
  }, 16000);
});

/* ----------------------------------------------------------- hud folding */

hudToggle.addEventListener('click', () => {
  const collapsed = hud.dataset.collapsed !== 'true';
  hud.dataset.collapsed = collapsed ? 'true' : 'false';
  hudToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
});

// Collapsed by default on small screens, open on wide ones.
if (window.matchMedia('(max-width: 620px)').matches) {
  hud.dataset.collapsed = 'true';
  hudToggle.setAttribute('aria-expanded', 'false');
}

/* -------------------------------------------------------------- idle dim */

let idleTimer;

function hideIdleLater() {
  window.clearTimeout(idleTimer);
  hud.dataset.idle = 'false';
  idleTimer = window.setTimeout(() => {
    hud.dataset.idle = 'true';
  }, 3600);
}

['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((evt) => {
  window.addEventListener(evt, hideIdleLater, { passive: true });
});

/* ------------------------------------------------------------ keyboard */

window.addEventListener('keydown', (evt) => {
  if (evt.key === 'f' && !evt.metaKey && !evt.ctrlKey) {
    const on = stage.dataset.immersive !== 'true' && !document.fullscreenElement;
    enterImmersive(on);
  }
  if (evt.key === 'r' && !evt.metaKey && !evt.ctrlKey) {
    btnReload.click();
  }
});

/* ------------------------------------------------------------ niceties */

// Keep the framed experience from stealing focus back to the top of the
// page on iOS when the shell regains focus.
window.addEventListener('pageshow', (evt) => {
  if (evt.persisted && revealed) veil.dataset.gone = 'true';
});
