import { useEffect, type ReactNode } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import type Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { scroll, useStore } from '../lib/store'
import { useReducedMotion } from '../lib/hooks'

/** Runs inside the Lenis provider: wires Lenis to GSAP's ticker, ScrollTrigger and the store. */
function LenisBridge() {
  const lenis = useLenis()
  const setLenis = useStore((s) => s.setLenis)

  useEffect(() => {
    if (!lenis) return
    setLenis(lenis)
    const onScroll = (l: Lenis) => {
      scroll.y = l.scroll
      scroll.progress = l.progress
      scroll.velocity = l.velocity
      ScrollTrigger.update()
    }
    lenis.on('scroll', onScroll)
    const update = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
    return () => {
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(update)
      setLenis(null)
    }
  }, [lenis, setLenis])

  return null
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  return (
    <ReactLenis
      root
      options={{
        lerp: reduced ? 1 : 0.085,
        smoothWheel: !reduced,
        autoRaf: false,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
      }}
    >
      <LenisBridge />
      {children}
    </ReactLenis>
  )
}
