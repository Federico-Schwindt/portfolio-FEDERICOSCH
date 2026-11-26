/**
 * The line from the hero (home). It leaves from the bottom of the hero, runs down into the work
 * section, makes one loop, and arrives at the first letter of "Work that moved numbers." Then it
 * writes the heading letter by letter, and the letters fill in. Everything follows the scroll, both
 * ways. Under reduced motion the heading is simply there.
 */
import { slides, onEnter, play } from './enter'
const NS = 'http://www.w3.org/2000/svg'
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))

export function initWritten({ reduce }: { reduce: boolean }) {
  const main = document.getElementById('main'), from = document.querySelector<HTMLElement>('[data-hx-from]')
  const head = document.querySelector<HTMLElement>('[data-written]')
  if (!main || !from || !head) return
  const glyphs = [...head.querySelectorAll<SVGPathElement>('path')]
  const svgHead = head.querySelector('svg')!
  if (reduce) { head.classList.add('is-written'); return }

  const over = document.createElementNS(NS, 'svg'); over.setAttribute('class', 'wline'); over.setAttribute('aria-hidden', 'true')
  const line = document.createElementNS(NS, 'path'); line.setAttribute('pathLength', '1'); over.append(line)
  main.prepend(over)
  let range = { a: 0, b: 1 }, tp = 0
  if (slides()) onEnter(head, () => play(2600, (k) => { tp = k; paint(true) }, (t) => t))

  // the request card and the proof sit under the button, and in free scroll (phones, tablets) they are on screen
  // with the line: it leaves from under the proof so it never crosses them. In block mode the hero has already
  // left the screen when the line draws, so the visible curve is the same.
  const origin = () => document.querySelector<HTMLElement>('.hx__proof') ?? from
  const build = () => {
    const m = main.getBoundingClientRect(), f = origin().getBoundingClientRect(), h = svgHead.getBoundingClientRect()
    const sec = head.closest('section')!.getBoundingClientRect()
    over.setAttribute('width', String(m.width)); over.setAttribute('height', String(h.bottom - m.top + 40))
    const x0 = f.left + f.width / 2 - m.left, y0 = f.bottom - m.top + 10
    const top = sec.top - m.top, hx = h.left - m.left + 2, hy = h.top - m.top + h.height * 0.08
    const ly = top + (hy - top) * 0.45, lx = hx + (x0 - hx) * 0.42, r = Math.min(26, (hy - top) * 0.12)
    const d = [
      `M${x0} ${y0}`, `L${x0} ${Math.max(y0 + 8, top - 30)}`,
      `C${x0} ${ly - 10} ${lx + 160} ${ly} ${lx + r} ${ly}`, // down, then a soft turn to the left
      `C${lx - r * 0.6} ${ly} ${lx - r} ${ly + r * 1.8} ${lx} ${ly + r * 1.8}`, // the loop
      `C${lx + r} ${ly + r * 1.8} ${lx + r * 0.6} ${ly} ${lx - r * 1.2} ${ly}`,
      `C${lx - 140} ${ly} ${hx + 10} ${hy - (hy - ly) * 0.7} ${hx} ${hy}`, // into the first letter
    ].join(' ')
    line.setAttribute('d', d)
    const sy = scrollY
    range = { a: f.bottom + sy - innerHeight * 0.75, b: h.top + sy - innerHeight * 0.32 }
    paint(true)
  }

  let last = -1
  const paint = (force = false) => {
    const p = slides() ? tp : clamp((scrollY - range.a) / Math.max(1, range.b - range.a))
    if (!force && Math.abs(p - last) < 0.0005) return
    last = p
    line.style.strokeDashoffset = String(1 - clamp(p / 0.5)) // the line travels in the first half
    line.style.opacity = p > 0.002 ? '1' : '0' // a round cap would otherwise leave a dot before it starts
    const q = clamp((p - 0.48) / 0.52), n = glyphs.length // then it writes, one letter after another
    glyphs.forEach((g, i) => {
      const k = clamp((q * (n + 4) - i) / 5)
      g.style.strokeDashoffset = String(1 - k)
      g.style.fillOpacity = String(clamp((k - 0.7) / 0.3))
    })
    head.classList.toggle('is-written', p >= 1)
  }
  build()
  addEventListener('resize', () => requestAnimationFrame(build))
  document.fonts?.ready.then(build)
  addEventListener('load', build)
  addEventListener('scroll', () => paint(), { passive: true })
}
