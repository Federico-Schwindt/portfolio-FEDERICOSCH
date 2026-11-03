import { create } from 'zustand'
import type Lenis from 'lenis'
import * as THREE from 'three'

export type ZoomTarget = { pos: THREE.Vector3; look: THREE.Vector3; t: number }
export type LabMode = 'particles' | 'liquid' | 'spectrum'

type State = {
  loaded: boolean
  entered: boolean
  soundOn: boolean
  menuOpen: boolean
  sceneReady: boolean
  modelsReady: number
  lenis: Lenis | null
  journeyHeight: number
  zoom: ZoomTarget | null
  hoverView: boolean
  lab: LabMode
  setLoaded: (v: boolean) => void
  setEntered: (v: boolean) => void
  setSound: (v: boolean) => void
  setMenu: (v: boolean) => void
  setSceneReady: (v: boolean) => void
  bumpModelsReady: () => void
  setLenis: (l: Lenis | null) => void
  setJourneyHeight: (h: number) => void
  setZoom: (z: ZoomTarget | null) => void
  setHoverView: (v: boolean) => void
  setLab: (m: LabMode) => void
}

export const useStore = create<State>((set) => ({
  loaded: false,
  entered: false,
  soundOn: false,
  menuOpen: false,
  sceneReady: false,
  modelsReady: 0,
  lenis: null,
  journeyHeight: 0,
  zoom: null,
  hoverView: false,
  lab: 'particles',
  setLoaded: (loaded) => set({ loaded }),
  setEntered: (entered) => set({ entered }),
  setSound: (soundOn) => set({ soundOn }),
  setMenu: (menuOpen) => set({ menuOpen }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  bumpModelsReady: () => set((s) => ({ modelsReady: s.modelsReady + 1 })),
  setLenis: (lenis) => set({ lenis }),
  setJourneyHeight: (journeyHeight) => set({ journeyHeight }),
  setZoom: (zoom) => set({ zoom }),
  setHoverView: (hoverView) => set({ hoverView }),
  setLab: (lab) => set({ lab }),
}))

/** Mutable, frame-rate data that must not trigger React renders. */
export const pointer = { x: 0, y: 0, px: 0, py: 0, speed: 0 }
export const scroll = { y: 0, progress: 0, velocity: 0 }

/** 0..1 progress through the home-page journey. */
export function journeyProgress() {
  const h = useStore.getState().journeyHeight
  if (!h) return 0
  const max = Math.max(h - window.innerHeight, 1)
  return Math.min(Math.max(scroll.y / max, 0), 1)
}

if (import.meta.env.DEV && typeof window !== 'undefined') Object.assign(window, { __store: useStore })

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
