/**
 * Generative score — "Event Horizon".
 *
 * An original piece in the language of a space epic: a cathedral organ
 * (additive periodic waves), a low pedal, a relentless ascending ostinato,
 * a string-like pad that swells with intensity, and the tick of a clock
 * every 1.25 seconds. Everything is synthesised live with the Web Audio
 * API and scheduled on the audio clock; there are no audio files.
 *
 * `setIntensity(0..1)` and `setMode()` are driven by scroll so the music
 * builds through the dive, drops to a hush in the tesseract and swells
 * again at the end.
 */

/**
 * Optional: play a real track instead of the generative score. Put the file in
 * public/audio/ and set e.g. 'audio/score.mp3'. Make sure you hold the rights
 * to publish it — commercial film scores cannot be used on a public site
 * without a licence.
 */
export const SCORE_FILE: string | null = null

const BPM = 64
const EIGHTH = 60 / BPM / 2
const TICK = 1.25

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

type Chord = { pedal: number; notes: number[]; pad: number[] }
// D minor. Each chord lasts 16 eighths (two bars).
const PROG: Chord[] = [
  { pedal: 38, notes: [50, 57, 62, 65, 69], pad: [50, 57, 65] },
  { pedal: 38, notes: [50, 57, 62, 65, 69], pad: [50, 57, 65] },
  { pedal: 46, notes: [50, 53, 58, 62, 65], pad: [46, 53, 62] },
  { pedal: 41, notes: [48, 53, 57, 60, 65], pad: [45, 53, 60] },
  { pedal: 43, notes: [50, 55, 58, 62, 67], pad: [43, 55, 62] },
  { pedal: 38, notes: [50, 57, 62, 65, 69], pad: [50, 57, 65] },
  { pedal: 45, notes: [52, 57, 61, 64, 69], pad: [45, 52, 61] },
  { pedal: 45, notes: [52, 57, 62, 64, 69], pad: [45, 52, 62] },
]
const PATTERN = [0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 4, 3]

export type ScoreMode = 'space' | 'dive' | 'tesseract' | 'end' | 'ambient'

function impulse(ctx: AudioContext, seconds: number, decay: number) {
  const rate = ctx.sampleRate
  const len = Math.floor(rate * seconds)
  const buf = ctx.createBuffer(2, len, rate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

function noiseBuffer(ctx: AudioContext, seconds = 2) {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return buf
}

function organWave(ctx: AudioContext, partials: number[]) {
  const n = partials.length + 1
  const real = new Float32Array(n)
  const imag = new Float32Array(n)
  partials.forEach((a, i) => {
    imag[i + 1] = a
  })
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false })
}

type Sustained = { gain: GainNode; stop: (t: number) => void }

class Score {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private analyser!: AnalyserNode
  private comp!: DynamicsCompressorNode
  private dry!: GainNode
  private reverbSend!: GainNode
  private organBus!: GainNode
  private organLp!: BiquadFilterNode
  private padLp!: BiquadFilterNode
  private noise!: AudioBuffer
  private principal!: PeriodicWave
  private flute!: PeriodicWave
  private freq = new Uint8Array(0)
  private timer: number | null = null
  private step = 0
  private nextTime = 0
  private nextTick = 0
  private chordIdx = -1
  private pedal: Sustained | null = null
  private pad: Sustained[] = []
  private beats: number[] = []
  private smoothed = 0
  private pulseValue = 0
  private intensity = 0.3
  private mode: ScoreMode = 'space'
  private lastMode: ScoreMode = 'space'
  private media: HTMLAudioElement | null = null
  playing = false

  get ready() {
    return this.ctx !== null
  }

  /** Must be called from a user gesture. */
  init() {
    if (this.ctx) return
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctor()
    this.ctx = ctx
    this.noise = noiseBuffer(ctx)
    this.principal = organWave(ctx, [1, 0.55, 0.35, 0.28, 0.08, 0.14, 0.04, 0.09])
    this.flute = organWave(ctx, [1, 0.08, 0.3, 0.03, 0.12])

    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.82
    this.freq = new Uint8Array(this.analyser.frequencyBinCount)

    this.comp = ctx.createDynamicsCompressor()
    this.comp.threshold.value = -16
    this.comp.knee.value = 14
    this.comp.ratio.value = 3.5
    this.comp.attack.value = 0.02
    this.comp.release.value = 0.4

    this.dry = ctx.createGain()
    const convolver = ctx.createConvolver()
    convolver.buffer = impulse(ctx, 7, 2.6)
    this.reverbSend = ctx.createGain()
    const reverbOut = ctx.createGain()
    reverbOut.gain.value = 0.7
    this.reverbSend.connect(convolver).connect(reverbOut).connect(this.comp)

    this.organLp = ctx.createBiquadFilter()
    this.organLp.type = 'lowpass'
    this.organLp.frequency.value = 2400
    this.organLp.Q.value = 0.4
    this.organBus = ctx.createGain()
    this.organBus.gain.value = 1
    this.organBus.connect(this.organLp)
    this.organLp.connect(this.dry)
    const organSend = ctx.createGain()
    organSend.gain.value = 0.9
    this.organLp.connect(organSend).connect(this.reverbSend)

    this.padLp = ctx.createBiquadFilter()
    this.padLp.type = 'lowpass'
    this.padLp.frequency.value = 600
    this.padLp.Q.value = 0.6
    this.padLp.connect(this.dry)
    const padSend = ctx.createGain()
    padSend.gain.value = 1
    this.padLp.connect(padSend).connect(this.reverbSend)

    this.dry.connect(this.comp)
    this.comp.connect(this.master).connect(this.analyser).connect(ctx.destination)

    if (SCORE_FILE) {
      const el = new Audio(import.meta.env.BASE_URL + SCORE_FILE)
      el.loop = true
      el.crossOrigin = 'anonymous'
      el.preload = 'auto'
      const src = ctx.createMediaElementSource(el)
      src.connect(this.master)
      this.media = el
    }
  }

  // ── scheduler ────────────────────────────────────────────────
  private start() {
    if (this.media) {
      void this.media.play().catch(() => undefined)
      return
    }
    const ctx = this.ctx!
    this.nextTime = ctx.currentTime + 0.1
    this.nextTick = ctx.currentTime + 0.6
    if (this.timer) return
    this.timer = window.setInterval(() => this.tick(), 30)
  }

  private stop() {
    if (this.media) this.media.pause()
    if (this.timer) window.clearInterval(this.timer)
    this.timer = null
  }

  private tick() {
    const ctx = this.ctx!
    const horizon = ctx.currentTime + 0.2
    while (this.nextTime < horizon) {
      this.scheduleStep(this.step, this.nextTime)
      this.nextTime += EIGHTH
      this.step++
    }
    while (this.nextTick < horizon) {
      this.clock(this.nextTick)
      this.nextTick += TICK
    }
    if (this.mode !== this.lastMode) {
      this.onModeChange(this.lastMode, this.mode, ctx.currentTime + 0.05)
      this.lastMode = this.mode
    }
    // slow filter follows intensity
    const now = ctx.currentTime
    this.organLp.frequency.setTargetAtTime(900 + this.intensity * 4200, now, 0.6)
    this.padLp.frequency.setTargetAtTime(220 + this.intensity * 1900, now, 0.8)
  }

  private scheduleStep(step: number, t: number) {
    const s = step % 16
    const chordIdx = Math.floor(step / 16) % PROG.length
    const chord = PROG[chordIdx]
    const I = this.intensity
    const quiet = this.mode === 'tesseract' || this.mode === 'ambient'

    if (s === 0) {
      if (chordIdx !== this.chordIdx) this.changeChord(chord, t)
      this.beats.push(t)
    }

    // Ostinato: one organ note per eighth. Density and brightness scale with intensity.
    const idx = PATTERN[s]
    const note = chord.notes[idx]
    const play = quiet ? s % 2 === 0 || I > 0.55 : true
    if (play) {
      const vel = (0.35 + I * 0.65) * (s % 4 === 0 ? 1 : 0.8)
      this.organ(t, mtof(note), EIGHTH * 1.15, vel * 0.09, this.principal)
      if (I > 0.6 && s % 2 === 1) this.organ(t, mtof(note + 12), EIGHTH * 0.9, (I - 0.6) * 0.12, this.flute)
      if (I > 0.85 && s % 4 === 2) this.organ(t, mtof(note - 12), EIGHTH * 1.4, (I - 0.85) * 0.5, this.principal)
    }
  }

  // ── voices ───────────────────────────────────────────────────
  private organ(t: number, f: number, dur: number, gain: number, wave: PeriodicWave) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    o.setPeriodicWave(wave)
    o.frequency.value = f
    const o2 = ctx.createOscillator()
    o2.setPeriodicWave(wave)
    o2.frequency.value = f
    o2.detune.value = 4
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + 0.06)
    g.gain.setValueAtTime(gain, t + dur)
    g.gain.linearRampToValueAtTime(0, t + dur + 0.18)
    o.connect(g)
    o2.connect(g)
    g.connect(this.organBus)
    o.start(t)
    o2.start(t)
    o.stop(t + dur + 0.25)
    o2.stop(t + dur + 0.25)
  }

  private changeChord(chord: Chord, t: number) {
    const ctx = this.ctx!
    this.chordIdx = PROG.indexOf(chord)
    // pedal
    if (this.pedal) {
      const p = this.pedal
      p.gain.gain.cancelScheduledValues(t)
      p.gain.gain.setValueAtTime(p.gain.gain.value, t)
      p.gain.gain.linearRampToValueAtTime(0, t + 2.5)
      p.stop(t + 2.8)
    }
    {
      const o = ctx.createOscillator()
      o.setPeriodicWave(this.principal)
      o.frequency.value = mtof(chord.pedal)
      const sub = ctx.createOscillator()
      sub.type = 'sine'
      sub.frequency.value = mtof(chord.pedal - 12)
      const sg = ctx.createGain()
      sg.gain.value = 0.9
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.11, t + 2.2)
      o.connect(g)
      sub.connect(sg).connect(g)
      g.connect(this.organBus)
      o.start(t)
      sub.start(t)
      this.pedal = {
        gain: g,
        stop: (when) => {
          o.stop(when)
          sub.stop(when)
        },
      }
    }
    // pad (strings)
    for (const v of this.pad) {
      v.gain.gain.cancelScheduledValues(t)
      v.gain.gain.setValueAtTime(v.gain.gain.value, t)
      v.gain.gain.linearRampToValueAtTime(0, t + 3)
      v.stop(t + 3.3)
    }
    this.pad = []
    chord.pad.forEach((n, i) => {
      const f = mtof(n)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.028, t + 3.5 + i * 0.4)
      const oscs: OscillatorNode[] = []
      for (const det of [-7, 7]) {
        const o = ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = f
        o.detune.value = det
        o.connect(g)
        o.start(t)
        oscs.push(o)
      }
      g.connect(this.padLp)
      this.pad.push({ gain: g, stop: (when) => oscs.forEach((o) => o.stop(when)) })
    })
  }

  private clock(t: number) {
    const ctx = this.ctx!
    const level = this.mode === 'tesseract' ? 0.5 : this.mode === 'ambient' ? 0.2 : 0.16 + this.intensity * 0.12
    const n = ctx.createBufferSource()
    n.buffer = this.noise
    const hp = ctx.createBiquadFilter()
    hp.type = 'bandpass'
    hp.frequency.value = 3200
    hp.Q.value = 2.5
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.09 * level, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035)
    n.connect(hp).connect(g)
    g.connect(this.dry)
    const send = ctx.createGain()
    send.gain.value = 0.5
    g.connect(send).connect(this.reverbSend)
    n.start(t)
    n.stop(t + 0.05)
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = 2200
    const og = ctx.createGain()
    og.gain.setValueAtTime(0.03 * level, t)
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.02)
    o.connect(og).connect(this.dry)
    o.start(t)
    o.stop(t + 0.03)
    this.beats.push(-t) // negative marks a tick (weaker pulse)
  }

  private onModeChange(from: ScoreMode, to: ScoreMode, t: number) {
    const ctx = this.ctx!
    if (to === 'dive') {
      // riser: filtered noise sweeping up over the fall
      const n = ctx.createBufferSource()
      n.buffer = this.noise
      n.loop = true
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.Q.value = 1.4
      bp.frequency.setValueAtTime(180, t)
      bp.frequency.exponentialRampToValueAtTime(5200, t + 7)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.09, t + 6.4)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 7.6)
      n.connect(bp).connect(g)
      g.connect(this.dry)
      g.connect(this.reverbSend)
      n.start(t)
      n.stop(t + 8)
    }
    if (to === 'tesseract' && from === 'dive') {
      // the boom at the crossing, then a hush
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(70, t)
      o.frequency.exponentialRampToValueAtTime(28, t + 2.5)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(0.5, t + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2)
      o.connect(g).connect(this.dry)
      o.start(t)
      o.stop(t + 3.4)
      this.organBus.gain.cancelScheduledValues(t)
      this.organBus.gain.setValueAtTime(1, t)
      this.organBus.gain.linearRampToValueAtTime(0.12, t + 0.1)
      this.organBus.gain.linearRampToValueAtTime(1, t + 6)
    }
  }

  // ── control ──────────────────────────────────────────────────
  setPlaying(on: boolean) {
    if (!this.ctx) return
    this.playing = on
    const ctx = this.ctx
    if (on && ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(this.master.gain.value, now)
    this.master.gain.linearRampToValueAtTime(on ? 0.8 : 0, now + (on ? 2.5 : 0.7))
    if (on) this.start()
    else window.setTimeout(() => !this.playing && this.stop(), 900)
  }

  setIntensity(v: number) {
    this.intensity = Math.min(Math.max(v, 0), 1)
  }

  setMode(m: ScoreMode) {
    this.mode = m
  }

  /** 0..1 overall energy, smoothed. */
  level() {
    if (!this.ctx || !this.playing) {
      this.smoothed += (0 - this.smoothed) * 0.05
      return this.smoothed
    }
    this.analyser.getByteFrequencyData(this.freq)
    let sum = 0
    const n = 48
    for (let i = 2; i < n; i++) sum += this.freq[i]
    const v = Math.min((sum / n / 255) * 1.7, 1)
    this.smoothed += (v - this.smoothed) * 0.1
    return this.smoothed
  }

  /** 0..1 pulse: spikes on bar downbeats (1) and clock ticks (0.45), then decays. */
  pulse() {
    if (!this.ctx || !this.playing) {
      this.pulseValue *= 0.9
      return this.pulseValue
    }
    if (this.media) {
      // no scheduler: derive a pulse from energy peaks
      const l = this.level()
      this.pulseValue = Math.max(this.pulseValue * 0.9, l > 0.55 ? (l - 0.55) * 2.2 : 0)
      return this.pulseValue
    }
    const now = this.ctx.currentTime
    while (this.beats.length && Math.abs(this.beats[0]) <= now) {
      const b = this.beats.shift()!
      this.pulseValue = Math.max(this.pulseValue, b < 0 ? 0.45 : 1)
    }
    if (this.beats.length > 16) this.beats.splice(0, this.beats.length - 16)
    this.pulseValue *= 0.93
    return this.pulseValue
  }

  /** Raw spectrum bins 0..1 for visualisers. */
  spectrum(bins: number) {
    const out = new Array<number>(bins).fill(0)
    if (!this.ctx || !this.playing) return out
    this.analyser.getByteFrequencyData(this.freq)
    for (let i = 0; i < bins; i++) {
      const idx = Math.floor(2 + (i / bins) * 56)
      out[i] = this.freq[idx] / 255
    }
    return out
  }
}

export const ambient = new Score()
