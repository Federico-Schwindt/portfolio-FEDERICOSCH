import * as THREE from 'three'

export type Key = { p: number; pos: [number, number, number]; look: [number, number, number] }

/** The home-page camera journey. p is 0..1 scroll progress. */
export const HOME_PATH: Key[] = [
  { p: 0.0, pos: [0.2, 4.0, 0.4], look: [-0.7, 3.8, -2.3] },
  { p: 0.07, pos: [0.2, 2.1, 9.0], look: [-0.4, 2.0, -2.0] },
  { p: 0.15, pos: [5.2, 1.3, 4.6], look: [-0.8, 1.5, -1.2] },
  { p: 0.23, pos: [-5.0, 2.4, 4.2], look: [-0.6, 1.6, -1.4] },
  { p: 0.29, pos: [-0.8, 1.9, 0.6], look: [0, 1.6, -9] },
  { p: 0.35, pos: [-1.0, 1.9, -7.5], look: [-3.2, 1.6, -12] },
  { p: 0.41, pos: [1.2, 2.3, -13.5], look: [3.2, 2.1, -18] },
  { p: 0.47, pos: [0.6, 1.7, -20], look: [-2.6, 1.6, -24] },
  { p: 0.5, pos: [0, 1.7, -25.5], look: [0, 1.7, -36] },
  { p: 0.74, pos: [0, 1.7, -49.5], look: [0, 1.7, -60] },
  { p: 0.78, pos: [0, 2.6, -54], look: [0, 2.2, -68] },
  { p: 0.86, pos: [0, 2.3, -60.5], look: [0, 2.2, -68] },
  { p: 0.93, pos: [-9, 7, -30], look: [-2.1, 1.2, 0.3] },
  { p: 1.0, pos: [-4.2, 1.45, 4.2], look: [-2.1, 1.05, 0.3] },
]

export const SERVICE_POSITIONS: [number, number, number][] = [
  [-3.2, 1.6, -12],
  [3.2, 2.1, -18],
  [-2.6, 1.6, -24],
]

export const GALLERY_Z0 = -30
export const GALLERY_STEP = 4
export const GALLERY_X = 2.4
export const GALLERY_Y = 1.7
export const GALLERY_TILT = 0.55

export const CORE_POSITION: [number, number, number] = [0, 2.2, -68]

/** Scroll progress at which the camera is in front of gallery screen i. */
export const galleryProgress = (i: number) => 0.515 + 0.04 * i

const smooth = (t: number) => t * t * (3 - 2 * t)
const a = new THREE.Vector3()
const b = new THREE.Vector3()

export function samplePath(keys: Key[], p: number, outPos: THREE.Vector3, outLook: THREE.Vector3) {
  let i = 0
  while (i < keys.length - 2 && p >= keys[i + 1].p) i++
  const k0 = keys[i]
  const k1 = keys[Math.min(i + 1, keys.length - 1)]
  const span = Math.max(k1.p - k0.p, 1e-5)
  const t = smooth(Math.min(Math.max((p - k0.p) / span, 0), 1))
  a.set(...k0.pos)
  b.set(...k1.pos)
  outPos.lerpVectors(a, b, t)
  a.set(...k0.look)
  b.set(...k1.look)
  outLook.lerpVectors(a, b, t)
}
