/**
 * Small generative audio engine built on the Web Audio API.
 * No files needed: every mood is a living arpeggio, and every golden
 * word is a synthesised sound effect.
 */

let ctx = null;
let master = null;

export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function getContext() {
  return ctx;
}

export function getMaster() {
  return master;
}

/* ------------------------------------------------------------- helpers */

function noiseBuffer(seconds = 2) {
  const frames = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function setMaster(value, seconds = 1.2) {
  if (!master) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(value, now + seconds);
}

/* --------------------------------------------------------- generative beds */

// Each mood: scale degrees, tempo, timbre and filter shaping.
const MOODS = {
  gentle: {
    scale: [0, 2, 4, 7, 9, 12],
    root: 261.63,
    step: 0.62,
    filter: 1500,
    wave: 'triangle',
    gain: 0.2,
    reverb: 0.5,
  },
  adventurous: {
    scale: [0, 2, 3, 5, 7, 10, 12],
    root: 196.0,
    step: 0.3,
    filter: 2600,
    wave: 'sawtooth',
    gain: 0.14,
    reverb: 0.3,
  },
  magical: {
    scale: [0, 4, 7, 11, 14, 16],
    root: 293.66,
    step: 0.46,
    filter: 3200,
    wave: 'sine',
    gain: 0.22,
    reverb: 0.7,
  },
  relaxing: {
    scale: [0, 3, 5, 7, 10, 12],
    root: 174.61,
    step: 0.85,
    filter: 1100,
    wave: 'sine',
    gain: 0.24,
    reverb: 0.65,
  },
};

let current = null;

export function stopMood() {
  if (!current) return;
  const { gain, convolver, halt } = current;
  if (halt) halt();
  try {
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
  } catch {
    /* ignore */
  }
  const node = gain;
  const conv = convolver;
  window.setTimeout(() => {
    try {
      node.disconnect();
      if (conv) conv.disconnect();
    } catch {
      /* ignore */
    }
  }, 1400);
  current = null;
}

export function playMood(name) {
  if (!ensureAudio()) return;
  stopMood();

  const cfg = MOODS[name];
  if (!cfg) return;

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(master);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cfg.filter;
  filter.Q.value = 0.6;
  filter.connect(gain);

  // short synthetic hall so it feels like a room, not a test tone
  const convolver = ctx.createConvolver();
  const irLen = Math.floor(ctx.sampleRate * (0.8 + cfg.reverb * 2));
  const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < irLen; i += 1) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.6);
    }
  }
  convolver.buffer = ir;
  const wet = ctx.createGain();
  wet.gain.value = cfg.reverb * 0.5;
  convolver.connect(wet);
  wet.connect(gain);
  filter.connect(convolver);

  let step = 0;
  let timer = 0;
  let going = true;

  function note() {
    if (!going) return;
    const now = ctx.currentTime;
    const degree = cfg.scale[Math.floor(Math.random() * cfg.scale.length)];
    const octave = Math.random() > 0.75 ? 2 : 1;
    const freq = cfg.root * Math.pow(2, degree / 12) * octave;

    const osc = ctx.createOscillator();
    osc.type = cfg.wave;
    osc.frequency.setValueAtTime(freq, now);

    const env = ctx.createGain();
    const attack = 0.02 + cfg.step * 0.1;
    const release = cfg.step * 1.9;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(cfg.gain, now + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);

    osc.connect(env);
    env.connect(filter);

    // a soft fifth above on every other note for warmth
    if (step % 4 === 0) {
      const osc2 = ctx.createOscillator();
      osc2.type = cfg.wave === 'sine' ? 'triangle' : cfg.wave;
      osc2.frequency.setValueAtTime(freq * 1.5, now);
      const env2 = ctx.createGain();
      env2.gain.setValueAtTime(0, now);
      env2.gain.linearRampToValueAtTime(cfg.gain * 0.4, now + attack);
      env2.gain.exponentialRampToValueAtTime(0.0001, now + attack + release * 1.1);
      osc2.connect(env2);
      env2.connect(filter);
      osc2.start(now);
      osc2.stop(now + attack + release * 1.2);
    }

    osc.start(now);
    osc.stop(now + attack + release + 0.05);

    step += 1;
    timer = window.setTimeout(note, cfg.step * 1000 * (0.85 + Math.random() * 0.4));
  }

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
  note();

  current = {
    gain,
    convolver,
    halt: () => {
      going = false;
      window.clearTimeout(timer);
    },
  };
}

/* --------------------------------------------------------- sound effects */

export function playEffect(name) {
  if (!ensureAudio()) return;
  const now = ctx.currentTime;

  if (name === 'wind') {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(2.4);
    src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(500, now);
    bp.frequency.linearRampToValueAtTime(1400, now + 1.1);
    bp.frequency.linearRampToValueAtTime(700, now + 2.2);
    bp.Q.value = 0.7;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.32, now + 0.5);
    g.gain.linearRampToValueAtTime(0.18, now + 1.6);
    g.gain.linearRampToValueAtTime(0, now + 2.4);

    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(now);
    src.stop(now + 2.5);
    return;
  }

  if (name === 'bells') {
    [1046.5, 1318.5, 1568, 2093].forEach((freq, i) => {
      const t = now + i * 0.16;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16 / (i + 1), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

      // shimmer partial
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2.76;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0, t);
      g2.gain.linearRampToValueAtTime(0.05 / (i + 1), t + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);

      osc.connect(g);
      g.connect(master);
      osc2.connect(g2);
      g2.connect(master);

      osc.start(t);
      osc.stop(t + 1.7);
      osc2.start(t);
      osc2.stop(t + 0.8);
    });
    return;
  }

  if (name === 'thunder') {
    // rumble: layered low noise with a slow swell
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(3.5);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(220, now);
    lp.frequency.linearRampToValueAtTime(90, now + 2.6);
    lp.Q.value = 1.2;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.55, now + 0.35);
    g.gain.linearRampToValueAtTime(0.3, now + 0.9);
    g.gain.linearRampToValueAtTime(0.42, now + 1.3);
    g.gain.linearRampToValueAtTime(0, now + 3.2);

    src.connect(lp);
    lp.connect(g);
    g.connect(master);
    src.start(now);
    src.stop(now + 3.3);

    // sub-bass body under the crack
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(64, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 2.4);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0, now);
    sg.gain.linearRampToValueAtTime(0.3, now + 0.3);
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
    sub.connect(sg);
    sg.connect(master);
    sub.start(now);
    sub.stop(now + 2.7);
  }
}

/* ------------------------------------------------------------- master */

export function fadeIn(seconds = 1.5) {
  if (!ensureAudio()) return;
  setMaster(0.85, seconds);
}

export function fadeOut(seconds = 0.8) {
  if (!ctx) return;
  setMaster(0, seconds);
}

export function isRunning() {
  return Boolean(ctx) && ctx.state === 'running';
}

export function duck(amount = 0.45, seconds = 0.3) {
  if (!ctx || !master) return;
  const target = 0.85 * amount;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(target, now + seconds);
  master.gain.linearRampToValueAtTime(0.85, now + seconds + 2.2);
}
