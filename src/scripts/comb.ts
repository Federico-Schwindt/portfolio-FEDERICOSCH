/**
 * Closing band (home): loose strokes write SOLD. as you scroll into the last section.
 */
import { slides, onEnter, play } from './enter'
import { wordLines, place, fontReady, clamp, outExpo } from './lines'

const INK = '#f01111' // the closing word is written in red on the warm cream

export function initSold({ reduce }: { reduce: boolean }) {
  const box = document.querySelector<HTMLElement>('[data-sold]')
  if (!box) return
  const cv = box.querySelector('canvas')!, ctx = cv.getContext('2d')!
  let word: ReturnType<typeof wordLines> | null = null, W = 0, H = 0, dpr = 1, shown = -1
  const size = async () => {
    await fontReady()
    dpr = Math.min(devicePixelRatio || 1, 2); W = box.clientWidth; H = box.clientHeight
    cv.width = W * dpr; cv.height = H * dpr
    const fs = Math.min(H * 0.95, W * 0.27)
    word = wordLines('SOLD.', { W, H, cx: W / 2, cy: H * 0.52, fs, gap: Math.max(5, Math.round(W / 210)), spread: 0.5, seed: 21 })
    shown = -1
  }
  const draw = (p: number) => {
    if (!word) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineCap = 'butt'; ctx.strokeStyle = INK
    const thick = clamp((p - 0.75) / 0.25)
    for (const s of word.segs) {
      const k = outExpo(clamp((p * 1.35 - s.d * 0.5) / 0.75))
      const q = place(s, k, p * 6)
      ctx.globalAlpha = 0.25 + 0.75 * k; ctx.lineWidth = 1.2 + (word.gap * 0.72 - 1.2) * thick * k
      ctx.beginPath(); ctx.moveTo(q.x - q.dx, q.y - q.dy); ctx.lineTo(q.x + q.dx, q.y + q.dy); ctx.stroke()
    }
  }
  let tp = 0
  if (slides()) onEnter(box, () => setTimeout(() => play(2600, (k) => (tp = k), (t) => t), 500))
  const prog = () => { if (slides()) return tp; const r = box.getBoundingClientRect(); return reduce ? 1 : clamp((innerHeight - r.top) / (innerHeight * 0.45 + r.height * 0.5)) }
  const loop = () => { const p = prog(); if (Math.abs(p - shown) > 0.001) { shown = p; draw(p) } requestAnimationFrame(loop) }
  size().then(() => (reduce ? draw(1) : requestAnimationFrame(loop)))
  addEventListener('resize', () => { size().then(() => draw(prog())) })
}
