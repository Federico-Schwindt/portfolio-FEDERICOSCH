import { create } from 'zustand'
import type Lenis from 'lenis'

type State = {
  loaded: boolean
  entered: boolean
  soundOn: boolean
  menuOpen: boolean
  sceneReady: boolean
  lenis: Lenis | null
  setLoaded: (v: boolean) => void
  setEntered: (v: boolean) => void
  setSound: (v: boolean) => void
  toggleSound: () => void
  setMenu: (v: boolean) => void
  setSceneReady: (v: boolean) => void
  setLenis: (l: Lenis | null) => void
}

export const useStore = create<State>((set) => ({
  loaded: false,
  entered: false,
  soundOn: false,
  menuOpen: false,
  sceneReady: false,
  lenis: null,
  setLoaded: (loaded) => set({ loaded }),
  setEntered: (entered) => set({ entered }),
  setSound: (soundOn) => set({ soundOn }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
  setMenu: (menuOpen) => set({ menuOpen }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setLenis: (lenis) => set({ lenis }),
}))

/** Mutable, frame-rate data that must not trigger React renders. */
export const pointer = {
  x: 0, // -1..1
  y: 0, // -1..1
  px: 0, // pixels
  py: 0,
  speed: 0,
}

export const scroll = {
  y: 0,
  progress: 0,
  velocity: 0,
}

if (typeof window !== 'undefined') {
  let lx = 0
  let ly = 0
  let last = performance.now()
  window.addEventListener(
    'pointermove',
    (e) => {
      const now = performance.now()
      const dt = Math.max(now - last, 8)
      const dx = e.clientX - lx
      const dy = e.clientY - ly
      pointer.speed = Math.min(Math.hypot(dx, dy) / dt, 4)
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
