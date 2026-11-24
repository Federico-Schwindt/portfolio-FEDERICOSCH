/**
 * Lines that become a word. A word is rasterised once and read column by column: every run of ink
 * becomes one vertical line (its target). Each line also gets a loose starting state, so it can be
 * drawn anywhere between "no shape" (k = 0) and "the word" (k = 1). Used by the preloader and by
 * the closing band of the home.
 */
export type Seg = { tx: number; ty: number; L: number; sx: number; sy: number; sa: number; sl: number; ph: number; d: number }
export type Word = { segs: Seg[]; x0: number; w: number; top: number; bottom: number; gap: number; cx: number; cy: number; measure: (s: string) => number }

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const outExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))
export const inCubic = (t: number) => t * t * t
export const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

export const FONT = '"Archivo Variable", "Arial Black", sans-serif'
export const fontReady = () =>
  Promise.race([document.fonts.load(`900 100px ${FONT}`).catch(() => null), new Promise((r) => setTimeout(r, 700))])

export function wordLines(word: string, o: { W: number; H: number; cx: number; cy: number; fs: number; gap?: number; spread?: number; seed?: number }): Word {
  const { W, H, cx, cy, fs } = o
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const c = cv.getContext('2d', { willReadFrequently: true })!
  c.font = `900 ${fs}px ${FONT}`; c.textBaseline = 'middle'
  try { (c as unknown as { letterSpacing: string }).letterSpacing = `${-fs * 0.03}px` } catch { /* older engines */ }
  const w = c.measureText(word).width, x0 = cx - w / 2
  c.fillStyle = '#000'; c.fillText(word, x0, cy)
  const y0 = Math.max(0, Math.floor(cy - fs * 0.7)), hh = Math.min(H - y0, Math.ceil(fs * 1.4))
  const px = c.getImageData(0, y0, W, hh).data
  const gap = o.gap ?? Math.max(4, Math.round(w / 150))
  const spread = o.spread ?? 0.42
  let seed = o.seed ?? 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5
  const segs: Seg[] = []
  let top = H, bottom = 0
  for (let x = Math.floor(x0); x < x0 + w; x += gap) {
    if (x < 0 || x >= W) continue
    let start = -1
    for (let y = 0; y <= hh; y++) {
      const on = y < hh && px[(y * W + x) * 4 + 3] > 128
      if (on && start < 0) start = y
      if (!on && start >= 0) {
        const a = y0 + start, b = y0 + y
        if (b - a > 2) {
          top = Math.min(top, a); bottom = Math.max(bottom, b)
          segs.push({ tx: x, ty: (a + b) / 2, L: b - a, sx: W / 2 + gauss() * W * spread, sy: H / 2 + gauss() * H * spread, sa: rnd() * Math.PI * 2, sl: (b - a) * (0.6 + rnd() * 2.4) + 30, ph: rnd() * 6.28, d: ((x - x0) / w) * 0.55 + rnd() * 0.25 })
        }
        start = -1
      }
    }
  }
  return { segs, x0, w, top, bottom, gap, cx, cy, measure: (s: string) => c.measureText(s).width }
}

/** Where a line is at progress k (0 = loose, 1 = in the word), with drift while loose. */
export function place(s: Seg, k: number, t: number) {
  const f = 1 - k
  const x = lerp(s.sx, s.tx, k) + Math.sin(t * 0.9 + s.ph) * 46 * f
  const y = lerp(s.sy, s.ty, k) + Math.cos(t * 0.7 + s.ph * 1.3) * 46 * f
  const a = lerp(s.sa + t * 0.5 * Math.sin(s.ph), Math.PI / 2, k)
  const l = lerp(s.sl, s.L, k) / 2
  return { x, y, dx: Math.cos(a) * l, dy: Math.sin(a) * l }
}
