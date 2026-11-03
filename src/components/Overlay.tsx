import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from '../lib/gsap'
import { journeyProgress } from '../lib/store'

type Props = {
  range: [number, number]
  children: ReactNode
  className?: string
  stay?: boolean
  align?: 'left' | 'right' | 'center'
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / Math.max(b - a, 1e-5), 0), 1)
  return t * t * (3 - 2 * t)
}

/** HTML text that fades in/out over the canvas during a range of the journey. */
export function Overlay({ range, children, className = '', stay = false, align = 'left' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current!
    const [a, b] = range
    const w = Math.min(0.03, (b - a) * 0.3)
    let on = false
    const tick = () => {
      const p = journeyProgress()
      const fin = smooth(a, a + w, p)
      const fout = stay ? 0 : smooth(b - w, b, p)
      const o = fin * (1 - fout)
      el.style.opacity = o.toFixed(3)
      el.style.transform = `translate3d(0, ${((1 - fin) * 48 - fout * 48).toFixed(1)}px, 0)`
      const next = o > 0.35
      if (next !== on) {
        on = next
        el.classList.toggle('is-on', on)
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [range, stay])
  return (
    <div ref={ref} className={`ov ov--${align} ${className}`} style={{ opacity: 0 }}>
      {children}
    </div>
  )
}
