import { useEffect, useRef } from 'react'
import { useStore, type LabMode } from '../lib/store'
import { labParams } from '../three/LabScene'
import { gsap } from '../lib/gsap'
import { fadeUp, revealChars } from '../lib/reveal'
import { ambient } from '../lib/audio'

const EXPERIMENTS: { id: LabMode; title: string; text: string }[] = [
  { id: 'particles', title: 'Particle type', text: 'Twelve thousand particles that remember the shape of a word. Move the cursor through them; the beat scatters them.' },
  { id: 'liquid', title: 'Liquid metal', text: 'A noise-displaced sphere with an analytic normal reconstruction and a black-red-white gradient. Shape it with the sliders.' },
  { id: 'spectrum', title: 'Spectrum ring', text: 'Sixty-four bars driven by the live spectrum of the generative soundtrack. Turn the sound on to see it breathe.' },
]

export function Lab() {
  const root = useRef<HTMLElement>(null)
  const lab = useStore((s) => s.lab)
  const setLab = useStore((s) => s.setLab)
  const soundOn = useStore((s) => s.soundOn)
  const setSound = useStore((s) => s.setSound)

  useEffect(() => {
    const el = root.current!
    const ctx = gsap.context(() => {
      const splits = Array.from(el.querySelectorAll<HTMLElement>('.page__title .line')).map((l, i) => revealChars(l, { immediate: true, delay: 0.3 + i * 0.1 }))
      fadeUp(el.querySelectorAll('.page__kicker, .lab__tabs, .lab__panel'), { immediate: true, delay: 0.6, stagger: 0.08 })
      return () => splits.forEach((s) => s.revert())
    }, el)
    return () => ctx.revert()
  }, [])

  const exp = EXPERIMENTS.find((e) => e.id === lab)!
  const turnOn = () => {
    if (!ambient.ready) ambient.init()
    ambient.setPlaying(true)
    setSound(true)
  }

  return (
    <section className="page page--lab" ref={root}>
      <header className="page__head page__head--lab">
        <p className="mono page__kicker">
          <span className="index">03</span> Lab — WebGL experiments
        </p>
        <h1 className="page__title">
          <span className="line split-wait">Play</span>
          <span className="line split-wait">ground</span>
        </h1>
      </header>

      <div className="lab__ui">
        <div className="lab__tabs" role="tablist">
          {EXPERIMENTS.map((e, i) => (
            <button key={e.id} role="tab" aria-selected={lab === e.id} className={`lab__tab ${lab === e.id ? 'is-active' : ''}`} onClick={() => setLab(e.id)} data-cursor="link">
              <span className="index">0{i + 1}</span> {e.title}
            </button>
          ))}
        </div>
        <div className="lab__panel">
          <h2 className="lab__title">{exp.title}</h2>
          <p className="lab__text">{exp.text}</p>
          {lab === 'liquid' && (
            <div className="lab__sliders">
              {(['amp', 'freq', 'speed'] as const).map((k) => (
                <label key={k}>
                  <span className="label">{k}</span>
                  <input
                    type="range"
                    min={k === 'amp' ? 0.05 : k === 'freq' ? 0.4 : 0.05}
                    max={k === 'amp' ? 1.2 : k === 'freq' ? 3.5 : 2}
                    step={0.01}
                    defaultValue={labParams.current[k]}
                    onChange={(e) => {
                      labParams.current[k] = parseFloat(e.target.value)
                    }}
                  />
                </label>
              ))}
            </div>
          )}
          {lab === 'spectrum' && !soundOn && (
            <button className="btn" onClick={turnOn} data-cursor="link">
              Turn the sound on
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
