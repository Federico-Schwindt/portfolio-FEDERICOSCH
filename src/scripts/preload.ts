/**
 * Preloader, first visit of a session only. Cream like the hero, red lines.
 * 1. Loose red lines drift with no shape.        (noise)
 * 2. They gather into the hatching of SOLD.      (idea, shape)
 * 3. The view pushes into the word.              (zoom)
 * 4. It dives through the hole in the O: the hole is a window onto the page, already loaded,
 *    and it grows until it is the screen.        (enter)
 * Click or press a key to skip. Never runs under reduced motion (the inline script in Base removes it).
 */
import { wordLines, place, fontReady, clamp, lerp, outExpo, inCubic, inOut } from './lines'

const el = document.getElementById('pre')
const root = document.documentElement
const PAPER = document.documentElement.dataset.theme === 'dark' ? '#121110' : '#fff1e0', RED = '#f01111'

const finish = (now = false) => {
  try { sessionStorage.setItem('pre', '1') } catch { /* private mode */ }
  const done = () => { el?.remove(); root.classList.remove('pre-on'); dispatchEvent(new Event('pre:done')) }
  if (!el || now) return done()
  el.classList.add('is-out')
  setTimeout(done, 260)
}

async function run(el: HTMLElement) {
  // automated checks skip it unless they ask for it with ?pre
  if (navigator.webdriver && !location.search.includes('pre')) return finish(true)
  const cv = el.querySelector('canvas')!, ctx = cv.getContext('2d')
  if (!ctx) return finish(true)
  const count = el.querySelector('b'), stage = el.querySelector('[data-stage]')
  const dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight
  cv.width = W * dpr; cv.height = H * dpr
  await fontReady()

  const fs = Math.min(W * 0.24, H * 0.36, 320)
  const word = wordLines('SOLD', { W, H, cx: W / 2, cy: H / 2, fs })
  if (!word.segs.length) return finish(true)
  const { segs, gap, cx, cy } = word

  // the hole of the O, read from the lines themselves: in the O's columns, the gap between the top and bottom stroke
  const oL = word.x0 + word.measure('S'), oR = word.x0 + word.measure('SO')
  let hx0 = Infinity, hx1 = -Infinity, hy0 = Infinity, hy1 = -Infinity
  const cols = new Map<number, { a: number; b: number }[]>()
  for (const s of segs) if (s.tx > oL && s.tx < oR) { const c = cols.get(s.tx) ?? []; c.push({ a: s.ty - s.L / 2, b: s.ty + s.L / 2 }); cols.set(s.tx, c) }
  cols.forEach((c, x) => {
    if (c.length < 2) return
    c.sort((p, q) => p.a - q.a)
    hx0 = Math.min(hx0, x); hx1 = Math.max(hx1, x); hy0 = Math.min(hy0, c[0].b); hy1 = Math.max(hy1, c[1].a)
  })
  if (!isFinite(hx0)) { hx0 = (oL + oR) / 2 - fs * 0.08; hx1 = (oL + oR) / 2 + fs * 0.08; hy0 = cy - fs * 0.2; hy1 = cy + fs * 0.2 }
  const ox = (hx0 + hx1) / 2, oy = (hy0 + hy1) / 2, rx = (hx1 - hx0) / 2 + gap * 0.5, ry = (hy1 - hy0) / 2
  const zWord = Math.min(1.5, (W * 0.9) / word.w)
  const zEnd = (Math.hypot(W, H) / 2 / Math.min(rx, ry)) * 1.1

  const END = 4.05
  let t0 = performance.now(), skip = 0
  const jump = () => { if (!skip) skip = Math.max(0, 2.9 - (performance.now() - t0) / 1000) }
  addEventListener('pointerdown', jump, { once: true }); addEventListener('keydown', jump, { once: true })
  el.style.background = 'transparent' // the canvas paints the cream from here on, so the O can be a real window
  const names = document.documentElement.lang === 'es' ? ['ruido', 'idea', 'forma', 'zoom', 'entrar'] : ['noise', 'idea', 'shape', 'zoom', 'enter']

  const frame = (now: number) => {
    const t = (now - t0) / 1000 + skip
    if (t >= END) return finish()
    const zw = inOut(clamp((t - 2.1) / 0.7)), dive = inCubic(clamp((t - 2.95) / 0.95))
    const z = lerp(1, zWord, zw) * lerp(1, zEnd / zWord, dive)
    const focus = inOut(clamp((t - 2.55) / 0.6)) // the view slides from the word's centre to the hole
    const fx = lerp(cx, ox, focus), fy = lerp(cy, oy, focus)
    const thick = inOut(clamp((t - 1.9) / 0.45))
    const win = t > 2.7 // from here the hole shows the page

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.translate(fx, fy); ctx.scale(z, z); ctx.translate(-fx, -fy)
    // the cream sheet, with the hole of the O cut out of it
    ctx.fillStyle = PAPER
    ctx.beginPath()
    const pad = Math.max(W, H) * 2
    ctx.rect(fx - pad / z, fy - pad / z, (pad * 2) / z, (pad * 2) / z)
    if (win) ctx.ellipse(ox, oy, rx, ry, 0, 0, Math.PI * 2, true)
    ctx.fill('evenodd')

    ctx.lineCap = 'butt'; ctx.strokeStyle = RED
    for (const s of segs) {
      const k = outExpo(clamp((t - 0.8 - s.d) / 1.15))
      const p = place(s, k, t)
      ctx.globalAlpha = 0.35 + 0.65 * k; ctx.lineWidth = lerp(1, gap * 0.78, thick * k)
      ctx.beginPath(); ctx.moveTo(p.x - p.dx, p.y - p.dy); ctx.lineTo(p.x + p.dx, p.y + p.dy); ctx.stroke()
    }
    ctx.globalAlpha = 1
    if (count) count.textContent = String(Math.round(clamp(t / 2.9) * 100)).padStart(3, '0')
    if (stage) stage.textContent = names[t < 0.9 ? 0 : t < 1.7 ? 1 : t < 2.1 ? 2 : t < 2.9 ? 3 : 4]
    if (t > 2.9) el.classList.add('is-open')
    requestAnimationFrame(frame)
  }
  t0 = performance.now()
  requestAnimationFrame(frame)
}

if (el && root.classList.contains('pre-on')) run(el).catch(() => finish(true))
