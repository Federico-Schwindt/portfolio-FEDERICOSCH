/**
 * Generative ambient soundtrack — no audio files, no copyright.
 * Everything is synthesised with the Web Audio API: slow pads built from
 * detuned oscillators, a sub drone, a breathing noise bed, sparse "shimmer"
 * notes, feedback delay and a procedurally generated reverb.
 */

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

// Chord voicings (MIDI) in D minor — dreamy, cinematic.
const CHORDS: number[][] = [
  [38, 53, 57, 60, 64], // Dm9
  [46, 53, 57, 60, 65], // Bbmaj7(add4)
  [41, 52, 57, 60, 64], // Fmaj9
  [43, 50, 58, 62, 65], // Gm9
  [36, 52, 55, 59, 62], // Cmaj9
  [45, 52, 57, 60, 64], // Am7
]

type Voice = { nodes: AudioNode[]; gain: GainNode; stop: (t: number) => void }

function makeImpulse(ctx: AudioContext, seconds: number, decay: number) {
  const rate = ctx.sampleRate
  const len = Math.floor(rate * seconds)
  const buf = ctx.createBuffer(2, len, rate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
  }
  return buf
}

function makeNoise(ctx: AudioContext) {
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0
  for (let i = 0; i < len; i++) {
    // cheap pink-ish noise
    const w = Math.random() * 2 - 1
    b0 = 0.99765 * b0 + w * 0.099046
    b1 = 0.963 * b1 + w * 0.2965164
    b2 = 0.57 * b2 + w * 1.0526913
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12
  }
  return buf
}

class AmbientEngine {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private analyser!: AnalyserNode
  private bus!: GainNode
  private freq = new Uint8Array(0)
  private voices: Voice[] = []
  private chordTimer: number | null = null
  private shimmerTimer: number | null = null
  private sub: { osc: OscillatorNode; gain: GainNode } | null = null
  private chordIndex = 0
  private smoothed = 0
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

    this.master = ctx.createGain()
    this.master.gain.value = 0

    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.8
    this.freq = new Uint8Array(this.analyser.frequencyBinCount)

    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -20
    comp.ratio.value = 4
    comp.attack.value = 0.02
    comp.release.value = 0.4

    this.bus = ctx.createGain()
    this.bus.gain.value = 1

    // Reverb
    const convolver = ctx.createConvolver()
    convolver.buffer = makeImpulse(ctx, 6, 2.2)
    const wet = ctx.createGain()
    wet.gain.value = 0.6
    const dry = ctx.createGain()
    dry.gain.value = 0.55

    // Feedback delay
    const delay = ctx.createDelay(2)
    delay.delayTime.value = 0.46
    const fb = ctx.createGain()
    fb.gain.value = 0.38
    const delayLp = ctx.createBiquadFilter()
    delayLp.type = 'lowpass'
    delayLp.frequency.value = 1600
    const delayWet = ctx.createGain()
    delayWet.gain.value = 0.22

    this.bus.connect(dry).connect(comp)
    this.bus.connect(convolver).connect(wet).connect(comp)
    this.bus.connect(delay)
    delay.connect(delayLp)
    delayLp.connect(fb).connect(delay)
    delayLp.connect(delayWet).connect(comp)

    comp.connect(this.master).connect(this.analyser).connect(ctx.destination)

    // Sub drone
    const subOsc = ctx.createOscillator()
    subOsc.type = 'sine'
    subOsc.frequency.value = mtof(CHORDS[0][0] - 12)
    const subGain = ctx.createGain()
    subGain.gain.value = 0.16
    subOsc.connect(subGain).connect(comp)
    subOsc.start()
    this.sub = { osc: subOsc, gain: subGain }

    // Noise bed ("air")
    const noise = ctx.createBufferSource()
    noise.buffer = makeNoise(ctx)
    noise.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 900
    bp.Q.value = 0.6
    const noiseLfo = ctx.createOscillator()
    noiseLfo.frequency.value = 0.045
    const noiseLfoGain = ctx.createGain()
    noiseLfoGain.gain.value = 500
    noiseLfo.connect(noiseLfoGain).connect(bp.frequency)
    noiseLfo.start()
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.035
    noise.connect(bp).connect(noiseGain).connect(this.bus)
    noise.start()

    this.playChord(0)
    this.scheduleNextChord()
    this.scheduleShimmer()
  }

  private playChord(i: number) {
    const ctx = this.ctx!
    const now = ctx.currentTime
    const chord = CHORDS[i % CHORDS.length]

    // release old voices
    for (const v of this.voices) {
      v.gain.gain.cancelScheduledValues(now)
      v.gain.gain.setValueAtTime(v.gain.gain.value, now)
      v.gain.gain.linearRampToValueAtTime(0, now + 7)
      v.stop(now + 7.5)
    }
    this.voices = []

    chord.forEach((note, idx) => {
      const f = mtof(note)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, now)
      const target = idx === 0 ? 0.05 : 0.038
      g.gain.linearRampToValueAtTime(target, now + 5 + idx * 0.6)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 260 + Math.random() * 420 + idx * 80
      filter.Q.value = 0.8

      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.04 + Math.random() * 0.06
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 180 + Math.random() * 160
      lfo.connect(lfoGain).connect(filter.frequency)
      lfo.start(now)

      const o1 = ctx.createOscillator()
      o1.type = 'sawtooth'
      o1.frequency.value = f
      o1.detune.value = -7
      const o2 = ctx.createOscillator()
      o2.type = 'sawtooth'
      o2.frequency.value = f
      o2.detune.value = 7
      const o3 = ctx.createOscillator()
      o3.type = 'triangle'
      o3.frequency.value = f * 2
      const o3g = ctx.createGain()
      o3g.gain.value = 0.35

      o1.connect(filter)
      o2.connect(filter)
      o3.connect(o3g).connect(filter)
      filter.connect(g).connect(this.bus)
      o1.start(now)
      o2.start(now)
      o3.start(now)

      this.voices.push({
        nodes: [o1, o2, o3, lfo, filter],
        gain: g,
        stop: (t) => {
          o1.stop(t)
          o2.stop(t)
          o3.stop(t)
          lfo.stop(t)
        },
      })
    })

    if (this.sub) {
      this.sub.osc.frequency.cancelScheduledValues(now)
      this.sub.osc.frequency.setTargetAtTime(mtof(chord[0] - 12), now, 2.5)
    }
    this.chordIndex = i
  }

  private scheduleNextChord() {
    const wait = 11000 + Math.random() * 5000
    this.chordTimer = window.setTimeout(() => {
      // mostly move forward, sometimes jump
      const next = Math.random() < 0.75 ? this.chordIndex + 1 : Math.floor(Math.random() * CHORDS.length)
      this.playChord(next % CHORDS.length)
      this.scheduleNextChord()
    }, wait)
  }

  private scheduleShimmer() {
    const wait = 1800 + Math.random() * 4500
    this.shimmerTimer = window.setTimeout(() => {
      if (this.playing) this.shimmer()
      this.scheduleShimmer()
    }, wait)
  }

  private shimmer() {
    const ctx = this.ctx!
    const now = ctx.currentTime
    const chord = CHORDS[this.chordIndex % CHORDS.length]
    const note = chord[1 + Math.floor(Math.random() * (chord.length - 1))] + 24
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = mtof(note)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(0.045, now + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 3.2)
    osc.connect(g).connect(this.bus)
    osc.start(now)
    osc.stop(now + 3.4)
  }

  setPlaying(on: boolean) {
    if (!this.ctx) return
    this.playing = on
    const ctx = this.ctx
    if (on && ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(this.master.gain.value, now)
    this.master.gain.linearRampToValueAtTime(on ? 0.9 : 0, now + (on ? 2.5 : 0.8))
  }

  /** 0..1 energy, smoothed — used to drive visuals. */
  level() {
    if (!this.ctx || !this.playing) {
      this.smoothed += (0 - this.smoothed) * 0.05
      return this.smoothed
    }
    this.analyser.getByteFrequencyData(this.freq)
    let sum = 0
    const n = 48
    for (let i = 2; i < n; i++) sum += this.freq[i]
    const v = Math.min((sum / n / 255) * 1.8, 1)
    this.smoothed += (v - this.smoothed) * 0.08
    return this.smoothed
  }

  /** Raw spectrum bins for visualisers. */
  spectrum(bins: number) {
    const out = new Array<number>(bins).fill(0)
    if (!this.ctx || !this.playing) return out
    this.analyser.getByteFrequencyData(this.freq)
    for (let i = 0; i < bins; i++) {
      const idx = Math.floor(2 + (i / bins) * 40)
      out[i] = this.freq[idx] / 255
    }
    return out
  }

  dispose() {
    if (this.chordTimer) clearTimeout(this.chordTimer)
    if (this.shimmerTimer) clearTimeout(this.shimmerTimer)
    void this.ctx?.close()
    this.ctx = null
  }
}

export const ambient = new AmbientEngine()
