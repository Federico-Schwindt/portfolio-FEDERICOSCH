/**
 * Generative soundtrack v2 — no audio files, no copyright.
 *
 * A tempo-synced, chord-driven piece at 84 BPM in D minor:
 *  - slow analogue-style pads (detuned saws, breathing filters)
 *  - sub bass locked to the chord root with a heartbeat rhythm
 *  - a probabilistic 16th-note pluck arpeggio through dotted-eighth delay
 *  - soft kick, hats, sparse bell shimmers and a riser before each cycle
 *  - feedback delay + procedurally generated reverb + compressor
 * Everything is scheduled with a look-ahead scheduler on the Web Audio clock.
 */

const BPM = 84
const STEP = 60 / BPM / 4 // one 16th note in seconds
const BARS_PER_CHORD = 4
const STEPS_PER_BAR = 16

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

// Voicings (MIDI). First note is the root.
const PROG: number[][] = [
  [38, 53, 57, 60, 64], // Dm9
  [46, 53, 57, 60, 65], // Bbmaj7(add11)
  [41, 52, 57, 60, 64], // Fmaj9
  [36, 52, 55, 59, 62], // Cmaj9
  [43, 50, 58, 62, 65], // Gm9
  [45, 52, 57, 60, 64], // Am7
  [46, 53, 57, 60, 65], // Bbmaj7
  [45, 52, 56, 60, 64], // A7(b9-ish) → resolves to Dm
]

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

type PadVoice = { gain: GainNode; stop: (t: number) => void }

class AmbientEngine {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private analyser!: AnalyserNode
  private comp!: DynamicsCompressorNode
  private dry!: GainNode
  private reverbSend!: GainNode
  private delaySend!: GainNode
  private noise!: AudioBuffer
  private freq = new Uint8Array(0)
  private pads: PadVoice[] = []
  private timer: number | null = null
  private step = 0
  private nextTime = 0
  private chordIdx = -1
  private kicks: number[] = []
  private smoothed = 0
  private pulseValue = 0
  private arpPattern: number[] = []
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

    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.82
    this.freq = new Uint8Array(this.analyser.frequencyBinCount)

    this.comp = ctx.createDynamicsCompressor()
    this.comp.threshold.value = -18
    this.comp.knee.value = 12
    this.comp.ratio.value = 4
    this.comp.attack.value = 0.01
    this.comp.release.value = 0.25

    this.dry = ctx.createGain()
    this.dry.gain.value = 1

    // Reverb
    const convolver = ctx.createConvolver()
    convolver.buffer = impulse(ctx, 4.5, 2.4)
    this.reverbSend = ctx.createGain()
    this.reverbSend.gain.value = 1
    const reverbOut = ctx.createGain()
    reverbOut.gain.value = 0.55
    this.reverbSend.connect(convolver).connect(reverbOut).connect(this.comp)

    // Dotted-eighth feedback delay
    const delay = ctx.createDelay(2)
    delay.delayTime.value = STEP * 3
    const fb = ctx.createGain()
    fb.gain.value = 0.42
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 2200
    const delayOut = ctx.createGain()
    delayOut.gain.value = 0.5
    this.delaySend = ctx.createGain()
    this.delaySend.connect(delay)
    delay.connect(lp)
    lp.connect(fb).connect(delay)
    lp.connect(delayOut).connect(this.comp)
    lp.connect(this.reverbSend)

    this.dry.connect(this.comp)
    this.comp.connect(this.master).connect(this.analyser).connect(ctx.destination)
  }

  // ── scheduler ────────────────────────────────────────────────
  private start() {
    const ctx = this.ctx!
    this.nextTime = ctx.currentTime + 0.08
    if (this.timer) return
    this.timer = window.setInterval(() => this.tick(), 25)
  }

  private stop() {
    if (this.timer) window.clearInterval(this.timer)
    this.timer = null
  }

  private tick() {
    const ctx = this.ctx!
    while (this.nextTime < ctx.currentTime + 0.15) {
      this.scheduleStep(this.step, this.nextTime)
      this.nextTime += STEP
      this.step++
    }
  }

  private scheduleStep(step: number, t: number) {
    const s = step % STEPS_PER_BAR
    const bar = Math.floor(step / STEPS_PER_BAR)
    const chordIdx = Math.floor(bar / BARS_PER_CHORD) % PROG.length
    const chord = PROG[chordIdx]
    const root = chord[0]

    if (s === 0 && chordIdx !== this.chordIdx) this.playChord(chordIdx, t)

    // Kick: 1 and 3, with a ghost on the "a" of 4 every other bar.
    if (s === 0 || s === 8) this.kick(t, s === 0 ? 1 : 0.8)
    if (s === 14 && bar % 2 === 1) this.kick(t, 0.45)

    // Hats: off-beat 16ths with a swing in level.
    if (s % 2 === 1) this.hat(t, s % 4 === 3 ? 0.5 : 0.3)
    if (s === 4 || s === 12) this.hat(t, 0.8, 0.09)

    // Sub bass: heartbeat.
    if (s === 0) this.sub(t, mtof(root - 12), STEP * 7)
    if (s === 10) this.sub(t, mtof(root - 12), STEP * 2.5, 0.8)
    if (s === 12 && bar % 4 === 3) this.sub(t, mtof(root - 5), STEP * 3, 0.6)

    // Arpeggio: probabilistic 16ths through the delay.
    if (this.arpPattern.length) {
      const dense = bar % 8 >= 2 // first two bars of each cycle stay sparse
      const prob = dense ? 0.72 : 0.38
      if (Math.random() < prob) {
        const note = this.arpPattern[step % this.arpPattern.length]
        const vel = 0.55 + Math.random() * 0.45 * (s % 4 === 0 ? 1 : 0.7)
        this.pluck(t, mtof(note), vel)
      }
    }

    // Bell shimmer, sparse.
    if (Math.random() < 0.035) this.bell(t, mtof(chord[1 + Math.floor(Math.random() * 4)] + 24))

    // Riser into the next cycle.
    if (s === 0 && bar % 8 === 7) this.riser(t, STEP * 16)
  }

  // ── voices ───────────────────────────────────────────────────
  private playChord(i: number, t: number) {
    const ctx = this.ctx!
    const chord = PROG[i]
    this.chordIdx = i
    // arp pattern: up and down through the voicing plus the octave
    const up = [chord[1], chord[2], chord[3], chord[4], chord[2] + 12, chord[3] + 12]
    this.arpPattern = [...up, ...up.slice(1, -1).reverse()]

    for (const v of this.pads) {
      v.gain.gain.cancelScheduledValues(t)
      v.gain.gain.setValueAtTime(v.gain.gain.value, t)
      v.gain.gain.linearRampToValueAtTime(0, t + 5)
      v.stop(t + 5.5)
    }
    this.pads = []

    chord.forEach((note, idx) => {
      const f = mtof(note)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(idx === 0 ? 0.045 : 0.03, t + 3.5 + idx * 0.4)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 320 + Math.random() * 380 + idx * 60
      filter.Q.value = 0.9
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.05 + Math.random() * 0.05
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 160 + Math.random() * 140
      lfo.connect(lfoGain).connect(filter.frequency)
      lfo.start(t)

      const o1 = ctx.createOscillator()
      o1.type = 'sawtooth'
      o1.frequency.value = f
      o1.detune.value = -6
      const o2 = ctx.createOscillator()
      o2.type = 'sawtooth'
      o2.frequency.value = f
      o2.detune.value = 6
      const o3 = ctx.createOscillator()
      o3.type = 'triangle'
      o3.frequency.value = f * 2
      const o3g = ctx.createGain()
      o3g.gain.value = 0.3
      o1.connect(filter)
      o2.connect(filter)
      o3.connect(o3g).connect(filter)
      filter.connect(g)
      g.connect(this.dry)
      const send = ctx.createGain()
      send.gain.value = 0.6
      g.connect(send).connect(this.reverbSend)
      o1.start(t)
      o2.start(t)
      o3.start(t)
      this.pads.push({
        gain: g,
        stop: (when) => {
          o1.stop(when)
          o2.stop(when)
          o3.stop(when)
          lfo.stop(when)
        },
      })
    })
  }

  private pluck(t: number, f: number, vel: number) {
    const ctx = this.ctx!
    const o1 = ctx.createOscillator()
    o1.type = 'triangle'
    o1.frequency.value = f
    const o2 = ctx.createOscillator()
    o2.type = 'square'
    o2.frequency.value = f
    o2.detune.value = 4
    const o2g = ctx.createGain()
    o2g.gain.value = 0.18
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 2
    filter.frequency.setValueAtTime(600 + 2600 * vel, t)
    filter.frequency.exponentialRampToValueAtTime(350, t + 0.28)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.07 * vel, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.42)
    o1.connect(filter)
    o2.connect(o2g).connect(filter)
    filter.connect(g)
    g.connect(this.dry)
    const d = ctx.createGain()
    d.gain.value = 0.55
    g.connect(d).connect(this.delaySend)
    const r = ctx.createGain()
    r.gain.value = 0.35
    g.connect(r).connect(this.reverbSend)
    o1.start(t)
    o2.start(t)
    o1.stop(t + 0.5)
    o2.stop(t + 0.5)
  }

  private kick(t: number, vel: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(150, t)
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.42 * vel, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34)
    o.connect(g).connect(this.dry)
    o.start(t)
    o.stop(t + 0.4)
    // transient click
    const n = ctx.createBufferSource()
    n.buffer = this.noise
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1800
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.05 * vel, t)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.02)
    n.connect(hp).connect(ng).connect(this.dry)
    n.start(t)
    n.stop(t + 0.03)
    this.kicks.push(t)
  }

  private hat(t: number, vel: number, decay = 0.035) {
    const ctx = this.ctx!
    const n = ctx.createBufferSource()
    n.buffer = this.noise
    n.playbackRate.value = 1 + Math.random() * 0.2
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 7500
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.028 * vel, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    n.connect(hp).connect(g).connect(this.dry)
    n.start(t)
    n.stop(t + decay + 0.01)
  }

  private sub(t: number, f: number, dur: number, vel = 1) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    const o2 = ctx.createOscillator()
    o2.type = 'triangle'
    o2.frequency.value = f * 2
    const o2g = ctx.createGain()
    o2g.gain.value = 0.12
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.22 * vel, t + 0.02)
    g.gain.setValueAtTime(0.22 * vel, t + dur - 0.08)
    g.gain.linearRampToValueAtTime(0, t + dur)
    o.connect(g)
    o2.connect(o2g).connect(g)
    g.connect(this.dry)
    o.start(t)
    o2.start(t)
    o.stop(t + dur + 0.02)
    o2.stop(t + dur + 0.02)
  }

  private bell(t: number, f: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.035, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8)
    o.connect(g)
    g.connect(this.reverbSend)
    const d = ctx.createGain()
    d.gain.value = 0.4
    g.connect(d).connect(this.delaySend)
    o.start(t)
    o.stop(t + 3)
  }

  private riser(t: number, dur: number) {
    const ctx = this.ctx!
    const n = ctx.createBufferSource()
    n.buffer = this.noise
    n.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.2
    bp.frequency.setValueAtTime(240, t)
    bp.frequency.exponentialRampToValueAtTime(3800, t + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.05, t + dur * 0.92)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05)
    n.connect(bp).connect(g)
    g.connect(this.dry)
    g.connect(this.reverbSend)
    n.start(t)
    n.stop(t + dur + 0.1)
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
    this.master.gain.linearRampToValueAtTime(on ? 0.85 : 0, now + (on ? 2 : 0.7))
    if (on) this.start()
    else window.setTimeout(() => !this.playing && this.stop(), 900)
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

  /** 0..1 pulse that spikes on each kick and decays. */
  pulse() {
    if (!this.ctx || !this.playing) {
      this.pulseValue *= 0.9
      return this.pulseValue
    }
    const now = this.ctx.currentTime
    while (this.kicks.length && this.kicks[0] <= now) {
      this.kicks.shift()
      this.pulseValue = 1
    }
    if (this.kicks.length > 8) this.kicks.splice(0, this.kicks.length - 8)
    this.pulseValue *= 0.92
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

export const ambient = new AmbientEngine()
