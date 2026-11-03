import { useEffect, useRef } from 'react'
import { ambient } from '../lib/audio'
import { useStore } from '../lib/store'

const BARS = 5

export function SoundToggle() {
  const soundOn = useStore((s) => s.soundOn)
  const setSound = useStore((s) => s.setSound)
  const bars = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const els = Array.from(bars.current?.children ?? []) as HTMLElement[]
    const cur = new Array(els.length).fill(0.15)
    let raf = 0
    const loop = () => {
      const spec = ambient.spectrum(els.length)
      els.forEach((b, i) => {
        const target = soundOn ? 0.2 + spec[i] * 0.8 : 0.15
        cur[i] += (target - cur[i]) * 0.25
        b.style.transform = `scaleY(${cur[i].toFixed(3)})`
      })
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [soundOn])

  const toggle = () => {
    const next = !soundOn
    if (next && !ambient.ready) ambient.init()
    ambient.setPlaying(next)
    setSound(next)
  }

  return (
    <button className="sound" onClick={toggle} aria-pressed={soundOn} aria-label="Toggle sound" data-cursor="link">
      <span className="sound__bars" ref={bars}>
        {Array.from({ length: BARS }).map((_, i) => (
          <i key={i} />
        ))}
      </span>
      <span className="sound__label">{soundOn ? 'Sound on' : 'Sound off'}</span>
    </button>
  )
}
