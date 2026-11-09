/* storiesAI — all sound is synthesised with the Web Audio API. No audio files, no network. */
window.CAudio = (function () {
  var ctx = null, master = null, musicBus = null, sfxBus = null, outputAnalyser = null;
  var loop = null, mood = null, step = 0, musicOn = false, soundOn = false, duckTimer = null;
  /* sleep-conducive state: a low-pass "night curtain" over everything, a tempo
     scale the chord clock reads, and the interrupt fade for a locked screen */
  var nightFilter = null, nightOn = false, tempoScale = 1, tempoTimer = 0, idleTimer = 0;

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.85;
      /* music AND effects pass through the night curtain, so one node can
         soften the whole app as the story says goodnight */
      nightFilter = ctx.createBiquadFilter();
      nightFilter.type = 'lowpass';
      nightFilter.frequency.value = 20000;   /* wide open by day */
      nightFilter.Q.value = 0.0001;          /* no resonant whistle at the corner */
      master.connect(nightFilter);
      outputAnalyser = ctx.createAnalyser();
      outputAnalyser.fftSize = 1024;
      outputAnalyser.smoothingTimeConstant = 0;
      nightFilter.connect(outputAnalyser);
      outputAnalyser.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
      /* the story said goodnight before any sound was ever made */
      if (nightOn) { master.gain.value = 0.34; nightFilter.frequency.value = 800; tempoScale = 1.18; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  function outputRms() {
    if (!outputAnalyser) return 0;
    var length = outputAnalyser.fftSize;
    var samples = new Float32Array(length), sum = 0, i, value;
    if (typeof outputAnalyser.getFloatTimeDomainData === 'function') {
      outputAnalyser.getFloatTimeDomainData(samples);
      for (i = 0; i < length; i++) sum += samples[i] * samples[i];
    } else if (typeof outputAnalyser.getByteTimeDomainData === 'function') {
      var bytes = new Uint8Array(length);
      outputAnalyser.getByteTimeDomainData(bytes);
      for (i = 0; i < length; i++) { value = (bytes[i] - 128) / 128; sum += value * value; }
    }
    return Math.sqrt(sum / length);
  }

  function getDiagnostics() {
    var supported = !!(window.AudioContext || window.webkitAudioContext);
    return {
      supported: supported,
      state: ctx ? ctx.state : (supported ? 'not started' : 'unsupported'),
      soundOn: soundOn,
      musicOn: musicOn,
      sampleRate: ctx ? ctx.sampleRate : 0,
      outputRms: outputRms()
    };
  }

  function env(node, at, attack, hold, release, peak) {
    var g = node.gain;
    g.setValueAtTime(0.0001, at);
    g.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + attack);
    g.setValueAtTime(Math.max(peak, 0.0002), at + attack + hold);
    g.exponentialRampToValueAtTime(0.0001, at + attack + hold + release);
  }

  function tone(o) {
    if (!ensure()) return;
    var at = now() + (o.delay || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq, at);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(o.to, 1), at + (o.dur || 0.5));
    var out = gain;
    if (o.filter) {
      var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.filter;
      gain.connect(f); out = f;
    }
    osc.connect(gain); out.connect(o.bus || sfxBus);
    env(gain, at, o.attack || 0.02, o.hold || 0.02, o.release || o.dur || 0.5, o.gain || 0.2);
    osc.start(at); osc.stop(at + (o.attack || 0.02) + (o.hold || 0.02) + (o.release || o.dur || 0.5) + 0.05);
  }

  function noise(o) {
    if (!ensure()) return;
    var at = now() + (o.delay || 0), dur = o.dur || 0.6;
    var len = Math.ceil(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var filt = ctx.createBiquadFilter();
    filt.type = o.type || 'bandpass'; filt.frequency.value = o.freq || 800; filt.Q.value = o.q || 0.7;
    if (o.sweep) filt.frequency.exponentialRampToValueAtTime(Math.max(o.sweep, 40), at + dur);
    var gain = ctx.createGain();
    src.connect(filt); filt.connect(gain); gain.connect(o.bus || sfxBus);
    env(gain, at, o.attack || 0.05, o.hold || 0.02, dur, o.gain || 0.2);
    src.start(at); src.stop(at + dur + 0.1);
  }

  /* ---- background music: a slow, soft chord cloud that follows the chosen mood ---- */
  function chord(cfg) {
    if (!ensure()) return;
    var at = now() + 0.02, i, n;
    var notes = cfg.chords.slice();
    notes.push(notes[0] / 2);
    for (i = 0; i < notes.length; i++) {
      n = notes[i];
      var pace = cfg.pace * tempoScale;
      tone({ freq: n, dur: pace, type: cfg.wave, gain: 0.045, attack: 0.9, hold: pace * 0.4, release: pace * 0.8, bus: musicBus, delay: i * 0.11 });
    }
    var sparkle = notes[(step * 2 + 1) % notes.length] * 2;
    tone({ freq: sparkle, to: sparkle * 1.002, dur: 1.5, type: 'sine', gain: 0.018, attack: 0.25, hold: 0.05, release: 1.3, bus: musicBus, delay: 0.6 });
    step++;
  }

  function startMusic(moodId) {
    if (!ensure()) return;
    var cfg = (window.CDATA.MOODS.filter(function (m) { return m.id === moodId; })[0]) || window.CDATA.MOODS[0];
    if (loop) { clearInterval(loop); loop = null; }
    mood = cfg; step = 0; musicOn = true;
    musicBus.gain.cancelScheduledValues(now());
    musicBus.gain.setValueAtTime(musicBus.gain.value, now());
    musicBus.gain.linearRampToValueAtTime(0.85, now() + 1.6);
    chord(cfg);
    loop = setInterval(function () { if (musicOn) chord(mood); }, cfg.pace * 1000 * tempoScale);
  }

  /* ---- the chord clock has to be re-armed when the tempo changes ---- */
  function reschedule() {
    if (!musicOn || !loop || !mood) return;
    clearInterval(loop);
    loop = setInterval(function () { if (musicOn) chord(mood); }, mood.pace * 1000 * tempoScale);
  }
  function glideTempo(to, seconds) {
    if (tempoTimer) clearInterval(tempoTimer);
    var from = tempoScale, t0 = Date.now();
    tempoTimer = setInterval(function () {
      var k = Math.min(1, (Date.now() - t0) / (seconds * 1000));
      tempoScale = from + (to - from) * k;
      if (k >= 1) { clearInterval(tempoTimer); tempoTimer = 0; reschedule(); }
    }, 250);
  }

  /* ---- night mode: 20 s, reversible, idempotent ---- */
  function nightMode(on) {
    on = !!on;
    if (on === nightOn) return;
    nightOn = on;
    if (!ctx) return;                 /* no audio yet: applied on the first ensure() */
    var t = now(), R = 20;
    var vol = soundOn ? (on ? 0.34 : 0.85) : 0.0001;      /* -60% when on */
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
    master.gain.linearRampToValueAtTime(vol, t + R);

    var f = nightFilter.frequency;
    f.cancelScheduledValues(t);
    f.setValueAtTime(Math.max(40, f.value), t);
    /* exponential reads as a curtain closing; linear sounds like a knob turn */
    f.exponentialRampToValueAtTime(on ? 800 : 20000, t + R);

    glideTempo(on ? 1.18 : 1, R);                          /* 1/1.18 = -15.3% bpm */
  }

  /* ---- interruptions: lock the screen or switch apps, don't clip a note ---- */
  function fadeForInterrupt() {
    if (!ctx || !master) return;
    var t = now();
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
    master.gain.linearRampToValueAtTime(0.0001, t + 1.0);
    if (idleTimer) clearTimeout(idleTimer);
    /* a muted oscillator still burns DSP on Android: suspend once we are silent */
    idleTimer = setTimeout(function () { try { ctx.suspend(); } catch (e) {} }, 1150);
  }
  function fadeFromInterrupt() {
    if (!ctx) return;
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = 0; }
    try { ctx.resume(); } catch (e) {}
    var t = now(), vol = soundOn ? (nightOn ? 0.34 : 0.85) : 0.0001;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
    master.gain.linearRampToValueAtTime(vol, t + 0.8);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') fadeForInterrupt(); else fadeFromInterrupt();
  });
  window.addEventListener('pagehide', fadeForInterrupt);
  window.addEventListener('pageshow', fadeFromInterrupt);

  function stopMusic() {
    musicOn = false;
    if (loop) { clearInterval(loop); loop = null; }
    if (ctx && musicBus) {
      musicBus.gain.cancelScheduledValues(now());
      musicBus.gain.setValueAtTime(musicBus.gain.value, now());
      musicBus.gain.linearRampToValueAtTime(0.0001, now() + 0.8);
    }
  }

  function duck() {
    if (!ctx || !musicOn) return;
    var t = now();
    musicBus.gain.cancelScheduledValues(t);
    musicBus.gain.setValueAtTime(musicBus.gain.value, t);
    musicBus.gain.linearRampToValueAtTime(0.22, t + 0.12);
    musicBus.gain.linearRampToValueAtTime(0.85, t + 1.5);
    if (duckTimer) clearTimeout(duckTimer);
  }

  function previewMood(moodId) {
    if (!ensure()) return;
    var cfg = (window.CDATA.MOODS.filter(function (m) { return m.id === moodId; })[0]) || window.CDATA.MOODS[0];
    cfg.chords.slice(0, 3).forEach(function (f, i) {
      tone({ freq: f, dur: 1.2, type: cfg.wave, gain: 0.12, attack: 0.04, hold: 0.1, release: 1.2, delay: i * 0.16 });
    });
  }

  /* ---- interactive golden words ---- */
  var SFX_PLAYERS = {
    wind: function () { noise({ dur: 1.5, freq: 500, sweep: 1400, gain: 0.22, attack: 0.35 }); noise({ dur: 1.1, freq: 900, sweep: 400, gain: 0.11, delay: 0.35 }); },
    bells: function () { [880, 1320, 1760].forEach(function (f, i) { tone({ freq: f, dur: 1.4, type: 'sine', gain: 0.11 - i * 0.02, attack: 0.005, hold: 0.01, release: 1.4, delay: i * 0.13 }); }); },
    thunder: function () { noise({ dur: 2.1, type: 'lowpass', freq: 300, sweep: 90, gain: 0.4, attack: 0.18 }); tone({ freq: 58, to: 38, dur: 1.8, type: 'sine', gain: 0.14, attack: 0.12, hold: 0.1, release: 1.7 }); },
    owl: function () { [0, 0.62].forEach(function (d) { tone({ freq: 430, to: 330, dur: 0.45, type: 'sine', gain: 0.16, attack: 0.06, hold: 0.08, release: 0.4, delay: d }); tone({ freq: 215, to: 165, dur: 0.45, type: 'sine', gain: 0.07, attack: 0.06, hold: 0.08, release: 0.4, delay: d }); }); },
    waves: function () { noise({ dur: 2.2, type: 'lowpass', freq: 900, sweep: 240, gain: 0.26, attack: 0.6 }); noise({ dur: 1.6, type: 'lowpass', freq: 700, sweep: 200, gain: 0.16, delay: 1.2, attack: 0.6 }); },
    steps: function () { [0, 0.22, 0.44, 0.68].forEach(function (d, i) { noise({ dur: 0.09, type: 'lowpass', freq: 260, gain: 0.22, attack: 0.005, delay: d }); tone({ freq: 120 + i * 8, dur: 0.09, type: 'sine', gain: 0.08, delay: d }); }); },
    whisper: function () { noise({ dur: 1.0, freq: 1700, sweep: 700, gain: 0.11, attack: 0.25 }); },
    rain: function () { noise({ dur: 1.7, type: 'highpass', freq: 1400, gain: 0.16, attack: 0.3 }); },
    twinkle: function () { [1568, 2093, 2637].forEach(function (f, i) { tone({ freq: f, dur: 0.9, type: 'sine', gain: 0.09, attack: 0.005, hold: 0.01, release: 0.9, delay: i * 0.09 }); }); },
    drum: function () { [0, 0.3, 0.46].forEach(function (d, i) { tone({ freq: 130 - i * 18, to: 58, dur: 0.32, type: 'sine', gain: 0.24, attack: 0.005, hold: 0.01, release: 0.34, delay: d }); }); },
    creak: function () { tone({ freq: 180, to: 420, dur: 0.85, type: 'sawtooth', gain: 0.05, attack: 0.08, hold: 0.1, release: 0.7, filter: 900 }); },
    bird: function () { tone({ freq: 1500, to: 2600, dur: 0.13, type: 'sine', gain: 0.1, attack: 0.01, hold: 0.01, release: 0.14 }); tone({ freq: 2100, to: 1500, dur: 0.16, type: 'sine', gain: 0.09, attack: 0.01, hold: 0.01, release: 0.16, delay: 0.18 }); }
  };

  function playSfx(key) {
    if (!soundOn) { ensure(); }
    duck();
    (SFX_PLAYERS[key] || SFX_PLAYERS.twinkle)();
  }

  function setSound(on) {
    soundOn = !!on;
    if (soundOn) ensure();
    var v = on ? (nightOn ? 0.34 : 0.85) : 0.0001;
    if (master && ctx) master.gain.setTargetAtTime(v, now(), 0.15);
  }

  /* ---- read aloud using the device's own voices (no network) ----
     Long text is split into short utterances: some browsers truncate a single long one. */
  var speaking = false, speakToken = 0;
  function chunkText(text) {
    var parts = String(text).trim().split(/\s+/);
    var out = [], cur = '';
    parts.forEach(function (p) {
      if (!p) return;
      if ((cur + ' ' + p).length > 150 && cur) { out.push(cur); cur = p; }
      else cur = cur ? cur + ' ' + p : p;
    });
    if (cur) out.push(cur);
    return out.length ? out : [String(text)];
  }
  function speak(text, lang, onEnd) {
    if (!('speechSynthesis' in window)) { if (onEnd) onEnd(); return false; }
    stopSpeak();
    var plain = String(text).replace(/\[\[(\w+)\|([^\]]+)\]\]/g, function (m, k, w) { return w; });
    var chunks = chunkText(plain), i = 0, token = ++speakToken;
    var voices = window.speechSynthesis.getVoices() || [];
    var match = voices.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf((lang || 'en').slice(0, 2).toLowerCase()) === 0; })[0];
    speaking = true;
    function step() {
      if (token !== speakToken) return;
      if (i >= chunks.length) { speaking = false; if (onEnd) onEnd(); return; }
      var u = new SpeechSynthesisUtterance(chunks[i++]);
      u.lang = lang || 'en-IN'; u.rate = 0.86; u.pitch = 1.0; u.volume = 1;
      if (match) u.voice = match;
      u.onend = function () { setTimeout(step, 70); };
      u.onerror = function () { setTimeout(step, 70); };
      try { window.speechSynthesis.speak(u); } catch (e) { step(); }
    }
    step();
    return true;
  }
  function stopSpeak() {
    speakToken++; speaking = false;
    if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }
  function isSpeaking() { return speaking; }

  return {
    ensure: ensure, startMusic: startMusic, stopMusic: stopMusic, previewMood: previewMood,
    playSfx: playSfx, setSound: setSound, isSoundOn: function () { return soundOn; },
    getDiagnostics: getDiagnostics,
    speak: speak, stopSpeak: stopSpeak, isSpeaking: isSpeaking,
    nightMode: nightMode, isNight: function () { return nightOn; },
    isMusicOn: function () { return musicOn; }
  };
})();
