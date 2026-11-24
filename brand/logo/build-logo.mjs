// Rebuilds Federico's mark as clean geometry from the source image (brand/logo/source.png):
// two italic blades (a horizontal bar that turns 45° into a diagonal, a convex cut at each end) and a red dot.
// Each blade is measured from the image, then its curve radii are tuned to match it, and the SVGs are written.
// Run: node brand/logo/build-logo.mjs
import sharp from 'sharp'
import fs from 'node:fs'

const W = 1536, H = 1024
const S2 = Math.SQRT2, t22 = Math.tan(Math.PI / 8)

/** one blade. T/B: top and bottom of the bar; O/I: the outer and inner diagonals (x + y = const);
 *  Xr: sharp top-right corner; Rr: right end arc; R1/R2: outer and inner elbow radii; Rt: tip arc; yt: tip height */
function blade({ T, B, O, I, Xr, Rr, R1, R2, Rt, yt }) {
  const f = (n) => +n.toFixed(2)
  // right end: a circle tangent to the bottom line that passes through the sharp corner (Xr, T)
  const h = B - T, xb = Xr - Math.sqrt(Math.max(0, Rr * Rr - (Rr - h) ** 2))
  // inner elbow (concave): corner (I - B, B)
  const ci = I - B, d2 = R2 * t22
  const inA = [ci + d2, B], inB = [ci - d2 / S2, B + d2 / S2]
  // tip: the point on the inner diagonal, and a circle through it tangent to the outer diagonal
  const tip = [I - yt, yt]
  // centre on x + y = O + Rt*√2, at distance Rt from the tip: solve along that line
  const k = O + Rt * S2
  // parametrise centre c = (u, k - u); |c - tip| = Rt
  const a = 2, bq = -2 * tip[0] - 2 * (k - tip[1]), cq = tip[0] ** 2 + (k - tip[1]) ** 2 - Rt * Rt
  const disc = Math.max(0, bq * bq - 4 * a * cq), u = (-bq + Math.sqrt(disc)) / (2 * a) // the centre to the upper right of the tip
  const c = [u, k - u], tOut = [c[0] - Rt / S2, c[1] - Rt / S2]
  // outer elbow (convex): corner (O - T, T)
  const co = O - T, d1 = R1 * t22
  const outA = [co - d1 / S2, T + d1 / S2], outB = [co + d1, T]
  return [
    `M${f(Xr)} ${f(T)}`,
    `A${f(Rr)} ${f(Rr)} 0 0 1 ${f(xb)} ${f(B)}`,
    `L${f(inA[0])} ${f(inA[1])}`,
    `A${f(R2)} ${f(R2)} 0 0 0 ${f(inB[0])} ${f(inB[1])}`,
    `L${f(tip[0])} ${f(tip[1])}`,
    `A${f(Rt)} ${f(Rt)} 0 0 1 ${f(tOut[0])} ${f(tOut[1])}`,
    `L${f(outA[0])} ${f(outA[1])}`,
    `A${f(R1)} ${f(R1)} 0 0 1 ${f(outB[0])} ${f(outB[1])}`,
    'Z',
  ].join('')
}

// measured from the source image (see the row scans in the commit that added this file)
const A0 = { T: 301, B: 403, O: 970, I: 1098, Xr: 969, Rr: 107, R1: 150, R2: 80, Rt: 105, yt: 555 }
const B0 = { T: 458, B: 566, O: 1171, I: 1306, Xr: 1039, Rr: 109, R1: 150, R2: 80, Rt: 105, yt: 756 }
const DOT = { cx: 1046.5, cy: 337.5, r: 44 }

// the source as a mask of cream pixels
const { data } = await sharp('brand/logo/source.png').raw().toBuffer({ resolveWithObject: true })
const want = new Uint8Array(W * H)
for (let i = 0; i < W * H; i++) want[i] = data[i * 3] > 128 && data[i * 3 + 1] > 128 ? 1 : 0
const iou = async (d) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%"/><path fill="#fff" d="${d}"/></svg>`
  const { data: g } = await sharp(Buffer.from(svg)).greyscale().raw().toBuffer({ resolveWithObject: true })
  let inter = 0, uni = 0
  for (let y = 250; y < 800; y++) for (let x = 450; x < 1100; x++) { const i = y * W + x, a = g[i] > 128 ? 1 : 0, b = want[i]; if (a && b) inter++; if (a || b) uni++ }
  return inter / uni
}

// tune the radii of each blade (coordinate search) against the source
async function tune(p0) {
  let p = { ...p0 }, best = await iou(blade(p))
  for (const step of [16, 8, 4, 2, 1]) {
    for (const key of ['R1', 'R2', 'Rt', 'Rr', 'yt', 'Xr', 'T', 'B', 'O', 'I']) {
      for (const dir of [-1, 1]) {
        for (;;) {
          const q = { ...p, [key]: p[key] + dir * step }
          const s = await iou(blade(q))
          if (s > best + 1e-5) { best = s; p = q } else break
        }
      }
    }
  }
  return { p, best }
}
const A = await tune(A0), B = await tune(B0)
console.log('blade 1', A.best.toFixed(4), A.p)
console.log('blade 2', B.best.toFixed(4), B.p)

const dA = blade(A.p), dB = blade(B.p)
fs.writeFileSync('brand/logo/geometry.json', JSON.stringify({ blade1: A.p, blade2: B.p, dot: DOT, iou: [A.best, B.best] }, null, 2))

// the mark sits in its own square box: the blades and the dot, with the dot's right edge as the right bound
const minX = 518, minY = 292, maxX = DOT.cx + DOT.r, maxY = 758
const vw = maxX - minX, vh = maxY - minY
const view = `${minX} ${minY} ${vw.toFixed(1)} ${vh}`
const mark = (blade, dot, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}" role="img" aria-label="Federico Schwindt">${bg ? `<rect x="${minX - 1}" y="${minY - 1}" width="${vw + 2}" height="${vh + 2}" fill="${bg}"/>` : ''}<path fill="${blade}" d="${dA}${dB}"/><circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${dot}"/></svg>\n`
// a square tile with optical padding, for favicons and avatars
const side = Math.max(vw, vh) * 1.36, ox = minX - (side - vw) / 2, oy = minY - (side - vh) / 2
const tile = (bgc, blade, dot, rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ox.toFixed(1)} ${oy.toFixed(1)} ${side.toFixed(1)} ${side.toFixed(1)}" role="img" aria-label="Federico Schwindt"><rect x="${ox.toFixed(1)}" y="${oy.toFixed(1)}" width="${side.toFixed(1)}" height="${side.toFixed(1)}" rx="${rx}" fill="${bgc}"/><path fill="${blade}" d="${dA}${dB}"/><circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${dot}"/></svg>\n`

const INK = '#0B0B0B', PAPER = '#FFF1E0', RED = '#F01111'
const out = {
  'mark-paper.svg': mark(PAPER, RED),       // on dark backgrounds
  'mark-ink.svg': mark(INK, RED),           // on light backgrounds
  'mark-mono-ink.svg': mark(INK, INK),      // one colour, for stamps and engraving
  'mark-mono-paper.svg': mark(PAPER, PAPER),
  'tile-ink.svg': tile(INK, PAPER, RED, side * 0.22),
  'tile-paper.svg': tile(PAPER, INK, RED, side * 0.22),
  'tile-red.svg': tile(RED, PAPER, PAPER, side * 0.22),
}
fs.mkdirSync('brand/logo/svg', { recursive: true })
for (const [n, s] of Object.entries(out)) fs.writeFileSync(`brand/logo/svg/${n}`, s)
console.log('viewBox', view, 'tile side', side.toFixed(1))
