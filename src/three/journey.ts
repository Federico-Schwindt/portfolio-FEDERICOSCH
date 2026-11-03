import * as THREE from 'three'

/** Progress at which the ship crosses the disk and the scene cuts to the tesseract. */
export const ACT_SPLIT = 0.345
/** The white flash straddles the cut. */
export const FLASH = { start: 0.315, peak: 0.345, end: 0.375 }
/** Act 2 progress range. */
export const ACT2 = { start: 0.36, end: 1.0 }

/** World offset of the tesseract (far from Gargantua so the two never overlap). */
export const TESSERACT_ORIGIN = new THREE.Vector3(0, -600, 0)

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
    new THREE.Vector3(3.2, 1.2, -28),
    new THREE.Vector3(-2.4, 1.8, -46),
    new THREE.Vector3(-5.5, 0.6, -64),
    new THREE.Vector3(1.4, -1.0, -82),
    new THREE.Vector3(6.5, 1.3, -100),
    new THREE.Vector3(2.6, 0.2, -118),
    new THREE.Vector3(-1, -0.3, -136),
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
  services: [0.11, 0.18, 0.25],
  workIntro: 0.315,
  screens: [0.375, 0.445, 0.515, 0.585, 0.655],
  allWork: 0.725,
  impact: 0.81,
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
    .addScaledVector(_up, 2.4 + Math.cos(a * 17.0) * 0.6)
    .addScaledVector(_s, 1.6 + drift * 1.4)
  if (a > ASTRONAUT_END - LEAD) {
    const k = Math.min((a - (ASTRONAUT_END - LEAD)) / LEAD, 1)
    out.addScaledVector(_up, k * 0.8)
  }
  return out
}

/** Stable side vector for the line at parameter a (perpendicular to the tangent, mostly horizontal). */
const up = new THREE.Vector3(0, 1, 0)
export function lineSide(dir: THREE.Vector3, out: THREE.Vector3) {
  out.crossVectors(dir, up).normalize()
  if (out.lengthSq() < 1e-4) out.set(1, 0, 0)
  return out
}
