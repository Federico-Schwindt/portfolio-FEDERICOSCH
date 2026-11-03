import * as THREE from 'three'

/** Progress at which the ship crosses the disk and the scene cuts to the tesseract. */
export const ACT_SPLIT = 0.345
/** The white flash straddles the cut. */
export const FLASH = { start: 0.315, peak: 0.345, end: 0.375 }
/** Act 2 progress range. */
export const ACT2 = { start: 0.36, end: 1.0 }

/** World offset of the tesseract (far from Gargantua so the two never overlap). */
export const TESSERACT_ORIGIN = new THREE.Vector3(0, -600, 0)
/** Size of one tesseract room. */
export const ROOM = 6

// ─── Act 1: the ship's dive into Gargantua (world coords, hole at origin) ───
export const shipCurve = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(16, 10, 150),
    new THREE.Vector3(11, 7.5, 112),
    new THREE.Vector3(5, 4.6, 76),
    new THREE.Vector3(-1, 2.4, 46),
    new THREE.Vector3(-5.5, 1.1, 26),
    new THREE.Vector3(-8.5, 0.45, 14),
    new THREE.Vector3(-9.5, 0.1, 9),
  ],
  false,
  'centripetal',
)

/** Ship curve parameter for a progress value: an accelerating fall. */
export function shipT(p: number) {
  const u = Math.min(Math.max(p / ACT_SPLIT, 0), 1)
  return Math.pow(u, 1.55)
}

const tmpTan = new THREE.Vector3()
export function shipAt(p: number, outPos: THREE.Vector3, outDir: THREE.Vector3) {
  const t = Math.min(shipT(p), 0.999)
  shipCurve.getPointAt(t, outPos)
  shipCurve.getTangentAt(t, tmpTan)
  outDir.copy(tmpTan).normalize()
}

// ─── Act 2: the red line through the tesseract (local to TESSERACT_ORIGIN) ───
export const lineCurve = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 0, 8),
    new THREE.Vector3(0, 0.3, -10),
    new THREE.Vector3(1.6, 1.0, -28),
    new THREE.Vector3(-1.4, 1.4, -46),
    new THREE.Vector3(-1.8, 0.4, -64),
    new THREE.Vector3(1.2, -0.6, -82),
    new THREE.Vector3(1.9, 1.1, -100),
    new THREE.Vector3(0.4, 0.2, -118),
    new THREE.Vector3(-1.2, -0.2, -136),
    new THREE.Vector3(0, 0, -152),
    new THREE.Vector3(0, 0, -166),
  ],
  false,
  'centripetal',
  0.6,
)

export const pToA = (p: number) => Math.min(Math.max((p - ACT2.start) / (ACT2.end - ACT2.start), 0), 1)
export const aToP = (a: number) => ACT2.start + a * (ACT2.end - ACT2.start)

/** The astronaut travels this far ahead of the camera (line parameter). */
export const LEAD = 0.045
/** The astronaut stops here (line parameter) and the camera closes in. */
export const ASTRONAUT_END = 0.965

export function lineAt(a: number, outPos: THREE.Vector3, outDir: THREE.Vector3) {
  const t = Math.min(Math.max(a, 0), 0.999)
  lineCurve.getPointAt(t, outPos)
  lineCurve.getTangentAt(t, tmpTan)
  outDir.copy(tmpTan).normalize()
}

/** Chapter stations along the line (line parameter a). */
export const STATIONS = {
  welcome: 0.03,
  services: [0.09, 0.15, 0.21],
  process: 0.275,
  workIntro: 0.33,
  screens: [0.38, 0.44, 0.5, 0.56, 0.62],
  allWork: 0.675,
  trust: 0.72,
  impact: 0.78,
  about: 0.85,
  contact: 0.93,
}

const _p = new THREE.Vector3()
const _d = new THREE.Vector3()
const _s = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)

/**
 * Nominal camera position (tesseract-local) for a line parameter a: behind and
 * beside the astronaut with a slow lateral and vertical drift. The rig adds
 * small time and pointer offsets on top of this.
 */
export function cameraAt(a: number, out: THREE.Vector3) {
  const camA = Math.min(a, ASTRONAUT_END - LEAD * 0.6)
  lineAt(camA, _p, _d)
  _s.crossVectors(_d, _up).normalize()
  if (_s.lengthSq() < 1e-4) _s.set(1, 0, 0)
  const drift = Math.sin(a * 23.0)
  out
    .copy(_p)
    .addScaledVector(_up, 2.2 + Math.cos(a * 17.0) * 0.5)
    .addScaledVector(_s, 1.2 + drift * 0.9)
  if (a > ASTRONAUT_END - LEAD) {
    const k = Math.min((a - (ASTRONAUT_END - LEAD)) / LEAD, 1)
    out.addScaledVector(_up, k * 0.8)
  }
  return out
}

/** Stable side vector for the line at parameter a (perpendicular to the tangent, mostly horizontal). */
export function lineSide(dir: THREE.Vector3, out: THREE.Vector3) {
  out.crossVectors(dir, _up).normalize()
  if (out.lengthSq() < 1e-4) out.set(1, 0, 0)
  return out
}

// ─── Wall spots: things mounted flush in the room walls, like windows in the bookshelf ───
export type WallSpot = {
  a: number
  position: THREE.Vector3 // tesseract-local
  normal: THREE.Vector3 // points into the corridor
  rotationY: number
  sign: 1 | -1
  radius: number // keep-out radius for the lattice
}

/**
 * A spot on the side wall of the room the line passes through at parameter a.
 * The wall on the far side of the line is preferred so the astronaut never
 * flies through it; `prefer` breaks ties so stations alternate sides.
 */
export function wallSpot(a: number, prefer: 1 | -1, dy: number, radius: number): WallSpot {
  const p = new THREE.Vector3()
  const d = new THREE.Vector3()
  lineAt(a, p, d)
  const cx = Math.round(p.x / ROOM) * ROOM
  const cy = Math.round(p.y / ROOM) * ROOM
  const off = p.x - cx
  const sign: 1 | -1 = Math.abs(off) < 0.9 ? prefer : off > 0 ? -1 : 1
  const x = cx + sign * (ROOM / 2 - 0.16)
  return {
    a,
    position: new THREE.Vector3(x, cy + dy, p.z),
    normal: new THREE.Vector3(-sign, 0, 0),
    rotationY: sign > 0 ? -Math.PI / 2 : Math.PI / 2,
    sign,
    radius,
  }
}

export const SPOTS = {
  screens: STATIONS.screens.map((a, i) => wallSpot(a, i % 2 === 0 ? -1 : 1, 1.1, 3.3)),
  process: [-1.6, -0.55, 0.55, 1.6].map((k, i) => wallSpot(STATIONS.process + k * 0.011, i % 2 === 0 ? -1 : 1, 0.9 + (i % 2) * 0.6, 1.5)),
  trust: [-1, 0, 1].map((k, i) => wallSpot(STATIONS.trust + k * 0.013, i === 1 ? 1 : -1, 1.0, 1.5)),
  about: wallSpot(STATIONS.about, 1, 1.3, 2.6),
}

/** Every wall spot, for the lattice keep-out and the camera's "turn to look" moves. */
export const ALL_SPOTS: WallSpot[] = [...SPOTS.screens, ...SPOTS.process, ...SPOTS.trust, SPOTS.about]
