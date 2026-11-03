import * as THREE from 'three'

/**
 * A procedural bookshelf texture: rows of book spines with varied widths,
 * heights and colours, gold title lines and a wooden shelf board under each
 * row. Tiles horizontally. Generated once at runtime (no image files).
 */
const PALETTE = [
  '#5a1f1a', '#7a2a22', '#a0352a', '#3a2316', '#5c3a21', '#8a5a2b', '#1e2a44', '#2b3f66', '#3b5a7a',
  '#2e4a3a', '#4b6b3f', '#6f6a2b', '#b08a3a', '#c9a24a', '#d9c7a2', '#e8dcc0', '#8c8276', '#4a4540', '#2a2a2a',
]

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeBookshelfTexture(width = 2048, height = 512, rows = 4, seed = 7): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d')!
  const rng = mulberry32(seed)
  const rowH = height / rows
  ctx.fillStyle = '#120d09'
  ctx.fillRect(0, 0, width, height)

  for (let r = 0; r < rows; r++) {
    const y1 = (r + 1) * rowH // shelf board at the bottom of the row
    const boardH = rowH * 0.1
    // back of the shelf, slightly lit from above
    const back = ctx.createLinearGradient(0, r * rowH, 0, y1)
    back.addColorStop(0, '#1b1410')
    back.addColorStop(1, '#0c0907')
    ctx.fillStyle = back
    ctx.fillRect(0, r * rowH, width, rowH)

    let x = -rng() * 20
    while (x < width + 20) {
      const w = 7 + rng() * 15
      const h = rowH * (0.55 + rng() * 0.34)
      const lean = rng() < 0.07 ? (rng() - 0.5) * 0.12 : 0
      const col = PALETTE[Math.floor(rng() * PALETTE.length)]
      const gap = rng() < 0.08 ? 6 + rng() * 14 : 0 // the odd missing book
      x += gap
      ctx.save()
      ctx.translate(x + w / 2, y1 - boardH)
      ctx.rotate(lean)
      // spine
      const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0)
      g.addColorStop(0, shade(col, -0.35))
      g.addColorStop(0.3, col)
      g.addColorStop(0.75, col)
      g.addColorStop(1, shade(col, -0.45))
      ctx.fillStyle = g
      ctx.fillRect(-w / 2, -h, w, h)
      // top edge (pages)
      ctx.fillStyle = 'rgba(232, 220, 190, 0.5)'
      ctx.fillRect(-w / 2 + 1, -h, w - 2, 2)
      // title bands in gold or cream
      const bands = 1 + Math.floor(rng() * 3)
      for (let b = 0; b < bands; b++) {
        const by = -h * (0.18 + rng() * 0.62)
        ctx.fillStyle = rng() < 0.55 ? 'rgba(222, 184, 92, 0.85)' : 'rgba(236, 228, 210, 0.75)'
        ctx.fillRect(-w / 2 + 2, by, w - 4, 1 + rng() * 1.5)
      }
      // a thin dark separator
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      ctx.fillRect(w / 2 - 1, -h, 1, h)
      ctx.restore()
      x += w
    }
    // shelf board
    const bg = ctx.createLinearGradient(0, y1 - boardH, 0, y1)
    bg.addColorStop(0, '#6b4a2a')
    bg.addColorStop(0.5, '#4a3119')
    bg.addColorStop(1, '#2a1b0e')
    ctx.fillStyle = bg
    ctx.fillRect(0, y1 - boardH, width, boardH)
    ctx.fillStyle = 'rgba(255, 220, 160, 0.18)'
    ctx.fillRect(0, y1 - boardH, width, 1)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  return tex
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 + k))))
  return `rgb(${f(r)},${f(g)},${f(b)})`
}
