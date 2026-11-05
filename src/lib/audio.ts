/**
 * FiabaMia audio — everything is synthesised on the device.
 * No audio files, no network: the music and sounds work offline,
 * which is exactly what a bedtime app in airplane mode needs.
 */

export type MoodId = 'gentle' | 'adventurous' | 'magical' | 'relaxing'
export type SfxId = 'wind' | 'bells' | 'thunder' | 'water' | 'owl' | 'crickets' | 'magic' | 'page' | 'fire'

const MOODS: Record<MoodId, { root: number; scale: number[]; padEvery: number; arpEvery: number; wave: OscillatorType; brightness: number }> = {
  gentle: { root: 220, scale: [0, 4, 7, 11, 14, 16], padEvery: 7.5, arpEvery: 1.7, wave: 'sine', brightness: 1500 },
  adventurous: { root: 174.61, scale: [0, 3, 7, 10, 12, 15], padEvery: 6, arpEvery: 0.9, wave: 'triangle', brightness: 2600 },
  magical: { root: 261.63, scale: [0, 5, 7, 9, 12, 16], padEvery: 6.8, arpEvery: 1.3, wave: 'sine', brightness: 3400 },
  relaxing: { root: 196, scale: [0, 2, 7, 9, 12, 14], padEvery: 9, arpEvery: 2.3, wave: 'sine', brightness: 1200 },
}

function midiToFreq(root: number, semitones: number) {
  return root * Math.pow(2, semitones / 12)
}

class AudioEngine {
  ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicBus: GainNode | null = null
  private sfxBus: GainNode | null = null
  private reverb: ConvolverNode | null = null
  private timers: number[] = []
  private mood: MoodId | null = null
  private step = 0
  enabled = false

  /** Must be called from a user gesture (or after one) to satisfy autoplay policies. */
  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext
      if (!Ctor) return null
      const ctx: AudioContext = new Ctor()
      this.ctx = ctx
      this.master = ctx.createGain()
      this.master.gain.value = 0.9
      this.master.connect(ctx.destination)

      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -18
      comp.ratio.value = 3
      comp.attack.value = 0.02
      comp.release.value = 0.35
      comp.connect(this.master)

      this.musicBus = ctx.createGain()
      this.musicBus.gain.value = 0
      this.musicBus.connect(comp)

      this.sfxBus = ctx.createGain()
      this.sfxBus.gain.value = 0.85
      this.sfxBus.connect(comp)

      this.reverb = ctx.createConvolver()
      this.reverb.buffer = this.impulse(2.8, 2.6)
      const wet = ctx.createGain()
      wet.gain.value = 0.34
      this.reverb.connect(wet)
      wet.connect(comp)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private impulse(seconds: number, decay: number): AudioBuffer {
    const ctx = this.ctx!
    const rate = ctx.sampleRate
    const len = Math.floor(rate * seconds)
    const buf = ctx.createBuffer(2, len, rate)
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch)
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
      }
    }
    return buf
  }

  private noiseBuffer(seconds = 2): AudioBuffer {
    const ctx = this.ctx!
    const len = Math.floor(ctx.sampleRate * seconds)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    return buf
  }

  /** Warm pad + slow arpeggio, generated in real time. */
  startMood(mood: MoodId, volume = 1) {
    const ctx = this.ensure()
    if (!ctx || !this.musicBus) return
    this.stopMood(0.4)
    this.mood = mood
    this.step = 0
    const cfg = MOODS[mood]
    this.musicBus.gain.cancelScheduledValues(ctx.currentTime)
    this.musicBus.gain.setValueAtTime(this.musicBus.gain.value, ctx.currentTime)
    this.musicBus.gain.linearRampToValueAtTime(0.3 * volume, ctx.currentTime + 1.6)

    const pad = () => {
      if (!this.ctx || this.mood !== mood) return
      const t = this.ctx.currentTime
      const base = cfg.scale[(this.step * 2) % cfg.scale.length]
      const freqs = [midiToFreq(cfg.root, base - 12), midiToFreq(cfg.root, base + 3), midiToFreq(cfg.root, base + 10)]
      freqs.forEach((f, i) => {
        const osc = this.ctx!.createOscillator()
        const g = this.ctx!.createGain()
        const filt = this.ctx!.createBiquadFilter()
        filt.type = 'lowpass'
        filt.frequency.value = cfg.brightness
        osc.type = i === 0 ? 'triangle' : cfg.wave
        osc.frequency.value = f
        osc.detune.value = (i - 1) * 4
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.055 / (i + 1), t + 2.4)
        g.gain.linearRampToValueAtTime(0.0001, t + cfg.padEvery + 1.2)
        osc.connect(filt)
        filt.connect(g)
        g.connect(this.musicBus!)
        if (this.reverb) g.connect(this.reverb)
        osc.start(t)
        osc.stop(t + cfg.padEvery + 1.4)
      })
      this.step++
    }

    const arp = () => {
      if (!this.ctx || this.mood !== mood) return
      const t = this.ctx.currentTime
      const note = cfg.scale[Math.floor(Math.random() * cfg.scale.length)] + (Math.random() > 0.7 ? 12 : 0)
      const osc = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = midiToFreq(cfg.root, note)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.028, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8)
      osc.connect(g)
      g.connect(this.musicBus!)
      if (this.reverb) g.connect(this.reverb)
      osc.start(t)
      osc.stop(t + 2)
    }

    pad()
    arp()
    this.timers.push(window.setInterval(pad, cfg.padEvery * 1000))
    this.timers.push(window.setInterval(arp, cfg.arpEvery * 1000))
  }

  stopMood(fade = 1.2) {
    this.mood = null
    this.timers.forEach((t) => window.clearInterval(t))
    this.timers = []
    if (this.ctx && this.musicBus) {
      const t = this.ctx.currentTime
      this.musicBus.gain.cancelScheduledValues(t)
      this.musicBus.gain.setValueAtTime(this.musicBus.gain.value, t)
      this.musicBus.gain.linearRampToValueAtTime(0, t + fade)
    }
  }

  /** Music ducks politely when a golden word is tapped. */
  duck(amount = 0.18, forMs = 1400) {
    if (!this.ctx || !this.musicBus) return
    const now = this.ctx.currentTime
    const target = this.musicBus.gain.value
    this.musicBus.gain.cancelScheduledValues(now)
    this.musicBus.gain.setValueAtTime(target, now)
    this.musicBus.gain.linearRampToValueAtTime(0.05, now + 0.25)
    this.musicBus.gain.linearRampToValueAtTime(Math.max(target, 0.22 * amount * 5), now + forMs / 1000)
  }

  play(id: SfxId) {
    const ctx = this.ensure()
    if (!ctx || !this.sfxBus) return
    const t = ctx.currentTime
    const out = this.sfxBus
    const send = (node: AudioNode, wet = 0.25) => {
      node.connect(out)
      if (this.reverb) {
        const g = ctx.createGain()
        g.gain.value = wet
        node.connect(g)
        g.connect(this.reverb)
      }
    }

    switch (id) {
      case 'wind': {
        const src = ctx.createBufferSource()
        src.buffer = this.noiseBuffer(3.2)
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.Q.value = 0.8
        bp.frequency.setValueAtTime(420, t)
        bp.frequency.linearRampToValueAtTime(1150, t + 1.3)
        bp.frequency.linearRampToValueAtTime(380, t + 3)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.24, t + 0.6)
        g.gain.linearRampToValueAtTime(0, t + 3.1)
        src.connect(bp); bp.connect(g); send(g, 0.2)
        src.start(t); src.stop(t + 3.2)
        break
      }
      case 'bells': {
        for (let i = 0; i < 5; i++) {
          const st = t + i * 0.16
          const osc = ctx.createOscillator()
          const osc2 = ctx.createOscillator()
          const g = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.value = 1320 + i * 137
          osc2.type = 'sine'
          osc2.frequency.value = 1980 + i * 211
          g.gain.setValueAtTime(0, st)
          g.gain.linearRampToValueAtTime(0.12, st + 0.005)
          g.gain.exponentialRampToValueAtTime(0.0001, st + 1.6)
          osc.connect(g); osc2.connect(g); send(g, 0.5)
          osc.start(st); osc2.start(st)
          osc.stop(st + 1.7); osc2.stop(st + 1.7)
        }
        break
      }
      case 'thunder': {
        const src = ctx.createBufferSource()
        src.buffer = this.noiseBuffer(3)
        const lp = ctx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.setValueAtTime(400, t)
        lp.frequency.exponentialRampToValueAtTime(90, t + 1.8)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.55, t + 0.08)
        g.gain.exponentialRampToValueAtTime(0.001, t + 2.6)
        src.connect(lp); lp.connect(g); send(g, 0.4)
        src.start(t); src.stop(t + 2.9)
        break
      }
      case 'water': {
        for (let i = 0; i < 7; i++) {
          const st = t + Math.random() * 1.1
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(420 + Math.random() * 500, st)
          osc.frequency.exponentialRampToValueAtTime(900 + Math.random() * 700, st + 0.09)
          g.gain.setValueAtTime(0, st)
          g.gain.linearRampToValueAtTime(0.09, st + 0.01)
          g.gain.exponentialRampToValueAtTime(0.0001, st + 0.2)
          osc.connect(g); send(g, 0.35)
          osc.start(st); osc.stop(st + 0.25)
        }
        break
      }
      case 'owl': {
        for (let i = 0; i < 2; i++) {
          const st = t + i * 0.55
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          const lp = ctx.createBiquadFilter()
          lp.type = 'lowpass'; lp.frequency.value = 900
          osc.type = 'sine'
          osc.frequency.setValueAtTime(392, st)
          osc.frequency.linearRampToValueAtTime(330, st + 0.3)
          g.gain.setValueAtTime(0, st)
          g.gain.linearRampToValueAtTime(0.14, st + 0.05)
          g.gain.exponentialRampToValueAtTime(0.0001, st + 0.42)
          osc.connect(lp); lp.connect(g); send(g, 0.4)
          osc.start(st); osc.stop(st + 0.5)
        }
        break
      }
      case 'crickets': {
        for (let i = 0; i < 9; i++) {
          const st = t + i * 0.12 + Math.random() * 0.03
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.type = 'square'
          osc.frequency.value = 3800 + Math.random() * 400
          g.gain.setValueAtTime(0, st)
          g.gain.linearRampToValueAtTime(0.022, st + 0.005)
          g.gain.exponentialRampToValueAtTime(0.0001, st + 0.06)
          osc.connect(g); send(g, 0.3)
          osc.start(st); osc.stop(st + 0.08)
        }
        break
      }
      case 'fire': {
        const src = ctx.createBufferSource()
        src.buffer = this.noiseBuffer(2.2)
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'; bp.Q.value = 1.2; bp.frequency.value = 1800
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.16, t + 0.1)
        g.gain.linearRampToValueAtTime(0.03, t + 1.2)
        g.gain.linearRampToValueAtTime(0, t + 2.1)
        src.connect(bp); bp.connect(g); send(g, 0.15)
        src.start(t); src.stop(t + 2.2)
        break
      }
      case 'page': {
        const src = ctx.createBufferSource()
        src.buffer = this.noiseBuffer(0.4)
        const hp = ctx.createBiquadFilter()
        hp.type = 'highpass'; hp.frequency.value = 1600
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.09, t + 0.03)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)
        src.connect(hp); hp.connect(g); send(g, 0.1)
        src.start(t); src.stop(t + 0.4)
        break
      }
      case 'magic': {
        const notes = [0, 4, 7, 12, 16, 19]
        notes.forEach((n, i) => {
          const st = t + i * 0.07
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.value = midiToFreq(523.25, n)
          g.gain.setValueAtTime(0, st)
          g.gain.linearRampToValueAtTime(0.085, st + 0.01)
          g.gain.exponentialRampToValueAtTime(0.0001, st + 1.1)
          osc.connect(g); send(g, 0.6)
          osc.start(st); osc.stop(st + 1.2)
        })
        break
      }
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on
    if (!on) {
      this.stopMood(0.6)
    } else {
      this.ensure()
    }
  }
}

export const audio = new AudioEngine()

/** Small helper for the "voice colours" demo — browsers' own narration. */
export function speak(text: string, opts: { rate?: number; pitch?: number } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = opts.rate ?? 1
  u.pitch = opts.pitch ?? 1
  u.volume = 1
  const voices = window.speechSynthesis.getVoices()
  const preferred =
    voices.find((v) => /en-GB|en_GB/i.test(v.lang) && /female|Sonia|Libby|Hazel/i.test(v.name)) ||
    voices.find((v) => /en-GB/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang))
  if (preferred) u.voice = preferred
  window.speechSynthesis.speak(u)
  return true
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}
