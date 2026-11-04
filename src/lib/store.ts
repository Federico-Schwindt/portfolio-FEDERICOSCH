import { create } from 'zustand'
import type Lenis from 'lenis'

type State = {
  entered: boolean
  menuOpen: boolean
  lenis: Lenis | null
  hoverView: boolean
  workHover: number
  setEntered: (v: boolean) => void
  setMenu: (v: boolean) => void
  setLenis: (l: Lenis | null) => void
  setHoverView: (v: boolean) => void
  setWorkHover: (i: number) => void
}

export const useStore = create<State>((set) => ({
  entered: false,
  menuOpen: false,
  lenis: null,
  hoverView: false,
  workHover: 0,
  setEntered: (entered) => set({ entered }),
  setMenu: (menuOpen) => set({ menuOpen }),
  setLenis: (lenis) => set({ lenis }),
  setHoverView: (hoverView) => set({ hoverView }),
  setWorkHover: (workHover) => set({ workHover }),
}))

/** Mutable, frame-rate data that must not trigger React renders. */
export const pointer = { x: 0, y: 0, px: 0, py: 0, speed: 0 }
export const scroll = { y: 0, progress: 0, velocity: 0 }
/** 0..1 progress of the pinned Windows XP section (written by its ScrollTrigger). */
export const xpProgress = { current: 0 }

if (typeof window !== 'undefined') {
  let lx = 0
  let ly = 0
  let last = performance.now()
  window.addEventListener(
    'pointermove',
    (e) => {
      const now = performance.now()
      const dt = Math.max(now - last, 8)
      pointer.speed = Math.min(Math.hypot(e.clientX - lx, e.clientY - ly) / dt, 4)
      lx = e.clientX
      ly = e.clientY
      last = now
      pointer.px = e.clientX
      pointer.py = e.clientY
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
    },
    { passive: true },
  )
}
