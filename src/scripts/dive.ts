/**
 * The way into the footer (block mode): the same move as the preloader, run backwards from the page.
 * The SOLD band at the end of the contact block is redrawn on a full-screen sheet, the view slides into the
 * hole of its O, and the hole becomes a window onto the footer, growing until it is the screen.
 */
import { wordLines, clamp, lerp, inCubic, inOut } from './lines'

export async function soldDive(box: HTMLElement, sheetColor: string, cover: () => void): Promise<void> {
  const W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2)
  const cv = document.createElement('canvas')
  cv.className = 'dive'
  cv.width = W * dpr; cv.height = H * dpr
  document.body.append(cv)
  const ctx = cv.getContext('2d')
  if (!ctx) { cv.remove(); cover(); return }

  // the word sits exactly where the band shows it now
  const r = box.getBoundingClientRect()
  const fs = Math.min(r.height * 0.86, (r.width * 0.92) / 2.9)
  const word = wordLines('SOLD', { W, H, cx: r.left + r.width / 2, cy: r.top + r.height / 2, fs })
  const { segs, gap } = word
  // the hole of the O, read from the lines: in the O's columns, the gap between the top and bottom stroke
  const oL = word.x0 + word.measure('S'), oR = word.x0 + word.measure('SO')
  let hx0 = Infinity, hx1 = -Infinity, hy0 = Infinity, hy1 = -Infinity
  const cols = new Map<number, { a: number; b: number }[]>()
  for (const s of segs) if (s.tx > oL && s.tx < oR) { const c = cols.get(s.tx) ?? []; c.push({ a: s.ty - s.L / 2, b: s.ty + s.L / 2 }); cols.set(s.tx, c) }
  cols.forEach((c, x) => {
    if (c.length < 2) return
    c.sort((p, q) => p.a - q.a)
    hx0 = Math.min(hx0, x); hx1 = Math.max(hx1, x); hy0 = Math.min(hy0, c[0].b); hy1 = Math.max(hy1, c[1].a)
  })
  const mid = (oL + oR) / 2, cy = r.top + r.height / 2
  if (!isFinite(hx0)) { hx0 = mid - fs * 0.08; hx1 = mid + fs * 0.08; hy0 = cy - fs * 0.2; hy1 = cy + fs * 0.2 }
  const ox = (hx0 + hx1) / 2, oy = (hy0 + hy1) / 2, rx = (hx1 - hx0) / 2 + gap * 0.5, ry = (hy1 - hy0) / 2
  const zEnd = (Math.hypot(W, H) / Math.min(rx, ry)) * 1.1

  const DUR = 1.55
  let covered = false
  await new Promise<void>((done) => {
    const t0 = performance.now()
    const frame = (now: number) => {
      const t = (now - t0) / 1000
      const sheet = clamp(t / 0.18) // the sheet fades in over the page (the band underneath looks the same)
      const focus = inOut(clamp((t - 0.12) / 0.5)), dive = inCubic(clamp((t - 0.45) / (DUR - 0.45)))
      const z = lerp(1, zEnd, dive)
      const fx = lerp(W / 2, ox, focus), fy = lerp(cy, oy, focus)
      if (!covered && sheet >= 1) { covered = true; cover() } // the footer is placed behind the sheet
      const win = covered && t > 0.4

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.translate(fx, fy); ctx.scale(z, z); ctx.translate(-fx, -fy)
      ctx.globalAlpha = sheet
      ctx.fillStyle = sheetColor
      ctx.beginPath()
      const pad = Math.max(W, H) * 2
      ctx.rect(fx - pad / z, fy - pad / z, (pad * 2) / z, (pad * 2) / z)
      if (win) ctx.ellipse(ox, oy, rx * clamp((t - 0.4) / 0.25), ry * clamp((t - 0.4) / 0.25), 0, 0, Math.PI * 2, true)
      ctx.fill('evenodd')
      ctx.globalAlpha = 1
      ctx.lineCap = 'butt'; ctx.strokeStyle = '#f01111'; ctx.lineWidth = gap * 0.78
      ctx.beginPath()
      for (const s of segs) { ctx.moveTo(s.tx, s.ty - s.L / 2); ctx.lineTo(s.tx, s.ty + s.L / 2) }
      ctx.stroke()
      if (t < DUR) requestAnimationFrame(frame)
      else done()
    }
    requestAnimationFrame(frame)
  })
  if (!covered) cover()
  cv.classList.add('is-out')
  setTimeout(() => cv.remove(), 250)
}
