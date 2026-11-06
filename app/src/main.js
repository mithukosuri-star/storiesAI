import './style.css';
import { createSky } from './sky.js';
import {
  ensureAudio,
  playMood,
  stopMood,
  playEffect,
  fadeIn,
  fadeOut,
  duck,
  getContext,
  getMaster,
} from './audio.js';

/* ---------------------------------------------------------------- sky */
try {
  createSky(document.getElementById('sky'));
} catch (err) {
  // WebGL unavailable (very old device, or blocked): the CSS gradients
  // behind the canvas still give a proper night sky.
  console.warn('Sky unavailable, falling back to CSS backdrop.', err);
  document.getElementById('sky')?.remove();
}

/* ---------------------------------------------------------------- entry */
const veil = document.getElementById('veil');
const enterBtn = document.getElementById('enterBtn');
const soundToggle = document.getElementById('soundToggle');
const soundLabel = soundToggle.querySelector('.sound-label');

let soundOn = false;

function setSound(on) {
  soundOn = on;
  soundToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  soundLabel.textContent = on ? 'Sound on' : 'Sound off';
  if (on) fadeIn(1.6);
  else fadeOut(0.6);
}

function enter(withSound) {
  veil.dataset.gone = 'true';
  document.body.classList.remove('is-loading');

  if (withSound) {
    ensureAudio();
    setSound(true);
  } else {
    setSound(false);
  }

  revealOnScroll();
  startCounter();
}

enterBtn.addEventListener('click', () => enter(true));

// Scrolling or pressing a key also enters, quietly (no audio until asked).
function enterQuietly() {
  if (!document.body.classList.contains('is-loading')) return;
  enter(false);
}

window.addEventListener('wheel', enterQuietly, { passive: true });

window.addEventListener('keydown', (e) => {
  if (['ArrowDown', ' ', 'Enter', 'PageDown'].includes(e.key)) enterQuietly();
});

soundToggle.addEventListener('click', () => {
  if (!soundOn) {
    ensureAudio();
    setSound(true);
    // if a mood is highlighted, restart it under the new master gain
    const active = document.querySelector('.mood[aria-pressed="true"]');
    if (active) playMood(active.dataset.mood);
  } else {
    setSound(false);
    stopMood();
    document.querySelectorAll('.mood[aria-pressed="true"]').forEach((m) => m.setAttribute('aria-pressed', 'false'));
    musicHint.textContent = 'Tap a mood to hear it — each one plays a real generated soundtrack.';
  }
});

/* ---------------------------------------------------------------- scroll reveal */
const riseEls = document.querySelectorAll('.rise');
let observer;

function revealOnScroll() {
  if (observer || !('IntersectionObserver' in window)) {
    riseEls.forEach((el) => el.classList.add('in'));
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains('rise'));
        const i = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = `${Math.min(i * 70, 420)}ms`;
        el.classList.add('in');
        observer.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
  );
  riseEls.forEach((el) => observer.observe(el));
}

// Observe immediately: a deep link that lands mid-page should still reveal.
revealOnScroll();

/* ---------------------------------------------------------------- progress bar */
const progressBar = document.getElementById('progressBar');

function onScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? Math.min((window.scrollY / max) * 100, 100) : 0;
  progressBar.style.width = `${pct}%`;
}

window.addEventListener('scroll', onScrollProgress, { passive: true });
onScrollProgress();

/* ---------------------------------------------------------------- counter */
function startCounter() {
  const el = document.querySelector('[data-count]');
  if (!el) return;
  const target = Number(el.dataset.count);
  const duration = 1800;
  let started = false;

  const run = () => {
    if (started) return;
    started = true;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US').replace(/,/g, ',');
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString('en-US');
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
  } else {
    run();
  }
}

/* ---------------------------------------------------------------- music moods */
const musicHint = document.getElementById('musicHint');
const moodButtons = document.querySelectorAll('.mood');

moodButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const wasOn = btn.getAttribute('aria-pressed') === 'true';
    moodButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));

    if (wasOn) {
      stopMood();
      musicHint.textContent = 'Tap a mood to hear it — each one plays a real generated soundtrack.';
      return;
    }

    ensureAudio();
    if (!soundOn) setSound(true);

    btn.setAttribute('aria-pressed', 'true');
    playMood(btn.dataset.mood);
    musicHint.textContent = `${btn.querySelector('.mood-name').textContent} is playing — tap again to stop.`;
  });
});

/* ---------------------------------------------------------------- golden words */
document.querySelectorAll('.word').forEach((word) => {
  word.addEventListener('click', () => {
    const sound = word.dataset.sound;
    ensureAudio();
    if (!soundOn) setSound(true);

    // music softens so the sound effect has room
    duck(0.35, 0.18);
    playEffect(sound);

    word.classList.add('playing');
    window.setTimeout(() => word.classList.remove('playing'), 1400);
  });
});

/* ---------------------------------------------------------------- voice colors */
document.querySelectorAll('.voice').forEach((btn) => {
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') === 'true';
    document.querySelectorAll('.voice').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    if (!on) {
      btn.setAttribute('aria-pressed', 'true');
      // a single soft chime confirms the choice, pitched per color
      ensureAudio();
      if (!soundOn) setSound(true);
      playChime(btn.dataset.voice);
    }
  });
});

function playChime(color) {
  const ctx = getContext();
  if (!ctx) return;
  const notes = {
    green: [261.63, 392.0],
    yellow: [329.63, 493.88],
    blue: [293.66, 440.0],
    red: [392.0, 587.33],
  }[color] || [293.66, 440];

  notes.forEach((freq, i) => {
    const now = ctx.currentTime + i * 0.1;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    osc.connect(g);
    g.connect(getMaster());
    osc.start(now);
    osc.stop(now + 1.2);
  });
}

/* ---------------------------------------------------------------- ages */
document.querySelectorAll('.age').forEach((btn) => {
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') === 'true';
    document.querySelectorAll('.age').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    if (!on) btn.setAttribute('aria-pressed', 'true');
  });
});

/* ---------------------------------------------------------------- reviews */
const REVIEWS = [
  ['Martina', "Luca's mom, age 6", "I tried it to get my kids to sleep earlier. Result: they don't sleep anymore. Every night they beg “one more!” until my own eyelids give in."],
  ['Davide', "Sofia's dad, age 4", "Sofia got up, grabbed her teddy and started acting out the story all by herself. I had to read it three more times so she'd get the ending."],
  ['Giulia', "Matteo's mom, age 8", "I didn't expect to get emotional while reading. But I did. Matteo looked at me wide-eyed: “Mom, are you crying?”"],
  ['Francesco', "Emma's dad, age 5", "Emma used to hate bedtime. Now at 8:30 she's waiting on the bed with my phone in her hand. I don't know whether to laugh or cry."],
  ['Laura', "Riccardo and Alessia's mom", "Two kids who usually bicker, sitting together for the story. The catch: they both want the hero to have their name. I read it twice."],
  ['Marco', "Tommaso's dad, age 7", "Tommaso thinks I make up the stories myself. I won't let him down. The secret is it takes 30 seconds, and they come out better than my improvised ones."],
  ['Chiara', "Giorgia's mom, age 3", "Giorgia just waits for the golden words so she can tap the thunderstorm. Every time she pretends to be scared, then laughs and asks me to do it again."],
  ['Andrea', "Leonardo's dad, age 9", "I thought at nine he was done with fairy tales. Instead he waits for the next chapter of his series like an episode of his favorite cartoon."],
  ['Elena', "Nicolò's mom, age 5", "The questions at the end have become our moment. Yesterday Nicolò explained to me why the dragon deserved a second chance. Better than I could."],
  ['Simone', "Bianca's dad, age 6", "I read like a notary. With the voice colors I found out I can do the mysterious whisper. Bianca says I've improved. I'll take it as a compliment."],
  ['Federica', "Pietro's mom, age 2", "Pietro doesn't understand all the words yet, but he gets the rhythm. Halfway through he snuggles up and yawns. I never thought I'd thank an app for a yawn."],
  ['Roberto', "Viola's grandpa, age 7", "On Thursdays Viola sleeps over. I used to have to make things up, and my stories always ended with a nap. Mine. Now I come prepared."],
  ['Serena', "Diego's mom, age 4", "Diego was afraid of the dark. We asked for a story about courage with a firefly friend. Since then the firefly sleeps with him, at least in his head."],
  ['Paolo', "Ginevra and Filippo's dad", "Two heroes in the same story: at last nobody feels like the sidekick. Peace at home is worth every Star."],
];

const track = document.getElementById('marqueeTrack');

function quoteMarkup([who, role, text]) {
  return `<figure class="quote">
    <div class="quote-stars" aria-label="five stars">★★★★★</div>
    <p>“${text}”</p>
    <footer><strong>${who}</strong> · ${role}</footer>
  </figure>`;
}

if (track) {
  // duplicated once so the slide can loop seamlessly
  track.innerHTML = REVIEWS.map(quoteMarkup).join('') + REVIEWS.map(quoteMarkup).join('');
}

/* ---------------------------------------------------------------- misc links */
// "Create your story" buttons are placeholders in this homage.
document.querySelectorAll('a.btn-gold').forEach((a) => {
  a.addEventListener('click', (e) => {
    if (a.getAttribute('href') === '#top') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
});

/* ---------------------------------------------------------------- cleanup */
window.addEventListener('beforeunload', () => {
  stopMood();
});
