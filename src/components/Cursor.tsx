import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useIsTouch } from '../lib/hooks'
import { useStore } from '../lib/store'

export function Cursor() {
  const touch = useIsTouch()
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (touch || !dot.current || !ring.current) return
    const xd = gsap.quickTo(dot.current, 'x', { duration: 0.1, ease: 'power3' })
    const yd = gsap.quickTo(dot.current, 'y', { duration: 0.1, ease: 'power3' })
    const xr = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3' })
    const yr = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3' })
    let shown = false

    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY })
        gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.4 })
      }
      xd(e.clientX)
      yd(e.clientY)
      xr(e.clientX)
      yr(e.clientY)
    }
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>('a, button, [data-cursor]')
      const mode = t ? (t.dataset.cursor ?? 'link') : useStore.getState().hoverView ? 'view' : ''
      ring.current!.dataset.mode = mode
      if (label.current) label.current.textContent = t?.dataset.cursorLabel ?? (mode === 'view' ? (t ? 'View' : 'Open') : '')
    }
    const down = () => ring.current!.classList.add('is-down')
    const up = () => ring.current!.classList.remove('is-down')
    const leave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.3 })
    const enter = () => gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.3 })

    const unsub = useStore.subscribe((s) => {
      if (!ring.current || !label.current) return
      if (s.hoverView) {
        ring.current.dataset.mode = 'view'
        label.current.textContent = 'Open'
      } else if (ring.current.dataset.mode === 'view' && label.current.textContent === 'Open') {
        ring.current.dataset.mode = ''
        label.current.textContent = ''
      }
    })
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.documentElement.addEventListener('mouseleave', leave)
    document.documentElement.addEventListener('mouseenter', enter)
    return () => {
      unsub()
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.documentElement.removeEventListener('mouseleave', leave)
      document.documentElement.removeEventListener('mouseenter', enter)
    }
  }, [touch])

  if (touch) return null
  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor__dot" ref={dot} />
      <div className="cursor__ring" ref={ring}>
        <span ref={label} />
      </div>
    </div>
  )
}
