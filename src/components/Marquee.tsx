import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { scroll } from '../lib/store'

type Props = { items: string[]; outline?: boolean; speed?: number; className?: string; size?: 'lg' | 'sm' }

export function Marquee({ items, outline = false, speed = 30, className = '', size = 'lg' }: Props) {
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tween = gsap.to(track.current, { xPercent: -50, duration: speed, ease: 'none', repeat: -1 })
    let ts = 1
    const tick = () => {
      const v = scroll.velocity
      const target = (v < 0 ? -1 : 1) * (1 + Math.min(Math.abs(v) * 0.06, 3.5))
      ts += (target - ts) * 0.06
      tween.timeScale(ts)
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      tween.kill()
    }
  }, [speed])

  const list = [...items, ...items]
  return (
    <div className={`marquee marquee--${size} ${outline ? 'marquee--outline' : ''} ${className}`} aria-hidden="true">
      <div className="marquee__track" ref={track}>
        {list.map((it, i) => (
          <span className="marquee__item" key={i}>
            {it}
            <i />
          </span>
        ))}
      </div>
    </div>
  )
}
