import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'
import { useStore } from '../lib/store'
import { site } from '../content'

/** A short editorial preloader: the name sets in, a counter, then the curtain lifts. */
export function Preloader() {
  const lenis = useStore((s) => s.lenis)
  const setEntered = useStore((s) => s.setEntered)
  const [count, setCount] = useState(0)
  const [gone, setGone] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    lenis?.stop()
  }, [lenis])

  useEffect(() => {
    // prerender snapshots skip the curtain (the script injects a static one)
    if ((window as unknown as { __PRERENDER__?: boolean }).__PRERENDER__) {
      setEntered(true)
      lenis?.start()
      setGone(true)
      return
    }
    const obj = { v: 0 }
    let cancelled = false
    const tw = gsap.to(obj, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => setCount(Math.round(obj.v)) })
    void document.fonts.ready.then(() => {
      if (cancelled) return
      tw.eventCallback('onComplete', () => {
        const el = root.current!
        gsap
          .timeline({
            onComplete: () => {
              setGone(true)
            },
          })
          .add(() => {
            setEntered(true)
            lenis?.start()
          }, 0.1)
          .to(el.querySelector('.pre__inner'), { opacity: 0, duration: 0.35, ease: 'power2.in' })
          .to(el, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '-=0.1')
      })
    })
    return () => {
      cancelled = true
      tw.kill()
    }
  }, [lenis, setEntered])

  if (gone) return null
  return (
    <div className="pre" ref={root} aria-hidden="true">
      <div className="pre__inner">
        <span className="mono">{site.tagline}</span>
        <span className="pre__name">{site.name}</span>
        <span className="mono pre__count">{String(count).padStart(3, '0')}</span>
      </div>
    </div>
  )
}
