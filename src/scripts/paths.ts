/**
 * Services as roads (home). One idea on the left. Solid roads run to the three things I build; dashed
 * roads run to what gets dropped on the way. The roads are drawn by the scroll, then small packets
 * keep travelling to each result. Pointing at a result lights up its road.
 */
import { slides, onEnter, play } from './enter'
const NS = 'http://www.w3.org/2000/svg'
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))

export function initPaths({ reduce }: { reduce: boolean }) {
  document.querySelectorAll<HTMLElement>('[data-map]').forEach((map) => {
    const svg = map.querySelector('svg')!, idea = map.querySelector<HTMLElement>('[data-idea]')!
    const ends = [...map.querySelectorAll<HTMLElement>('[data-end]')], deads = [...map.querySelectorAll<HTMLElement>('[data-dead]')]
    let roads: { el: SVGPathElement; len: number; dot?: SVGRectElement; dead: boolean; delay: number }[] = []

    const build = () => {
      svg.innerHTML = ''
      const m = map.getBoundingClientRect(), wide = innerWidth > 860
      svg.setAttribute('viewBox', `0 0 ${m.width} ${m.height}`)
      const rel = (r: DOMRect) => ({ l: r.left - m.left, t: r.top - m.top, r: r.right - m.left, b: r.bottom - m.top, cx: r.left - m.left + r.width / 2, cy: r.top - m.top + r.height / 2 })
      const a = rel(idea.getBoundingClientRect())
      const from = wide ? { x: a.r, y: a.cy } : { x: 10, y: a.b }
      const curve = (p: { x: number; y: number }, q: { x: number; y: number }) => wide
        ? `M${p.x} ${p.y} C${p.x + (q.x - p.x) * 0.55} ${p.y} ${q.x - (q.x - p.x) * 0.45} ${q.y} ${q.x} ${q.y}`
        : `M${p.x} ${p.y} L${p.x} ${q.y - 18} Q${p.x} ${q.y} ${p.x + 18} ${q.y} L${q.x} ${q.y}`
      roads = []
      const add = (d: string, dead: boolean, delay: number) => {
        const el = document.createElementNS(NS, 'path')
        el.setAttribute('d', d); el.setAttribute('class', dead ? 'pt__road pt__road--dead' : 'pt__road')
        svg.append(el)
        const len = el.getTotalLength()
        el.style.strokeDasharray = dead ? `4 8` : `${len} ${len}`
        const r = { el, len, dead, delay } as (typeof roads)[number]
        if (!dead) { const dot = document.createElementNS(NS, 'rect'); dot.setAttribute('width', '8'); dot.setAttribute('height', '8'); dot.setAttribute('class', 'pt__dot'); svg.append(dot); r.dot = dot }
        roads.push(r)
        return r
      }
      deads.forEach((d, i) => {
        const b = rel(d.getBoundingClientRect())
        add(curve(from, wide ? { x: b.l, y: b.cy } : { x: b.l, y: b.cy }), true, 0.05 + i * 0.12)
      })
      ends.forEach((e, i) => {
        const b = rel(e.getBoundingClientRect())
        const r = add(curve(from, { x: b.l, y: b.cy }), false, 0.15 + i * 0.12)
        e.onpointerenter = () => { map.classList.add('has-hot'); r.el.classList.add('is-hot') }
        e.onpointerleave = () => { map.classList.remove('has-hot'); r.el.classList.remove('is-hot') }
        e.onfocus = e.onpointerenter as () => void; e.onblur = e.onpointerleave as () => void
      })
      paint(true)
    }

    let shown = -1, visible = false, tp = 0
    if (slides()) onEnter(map, () => setTimeout(() => play(2600, (k) => (tp = k), (t) => t), 300))
    const progress = () => { if (slides()) return tp * 1.35; const r = map.getBoundingClientRect(); return (reduce ? 1 : clamp((innerHeight * 0.92 - r.top) / (r.height * 0.75))) * 1.35 } // the last road starts at 0.75 and needs 0.55 more
    const paint = (force = false) => {
      const p = progress()
      if (!force && Math.abs(p - shown) < 0.002) return
      shown = p
      map.style.setProperty('--p', p.toFixed(3))
      for (const r of roads) {
        const k = clamp((p - r.delay) / 0.55)
        if (r.dead) { r.el.style.opacity = String(k > 0 ? 0.25 + 0.6 * k : 0); r.el.style.clipPath = `inset(0 ${100 - k * 100}% 0 0)` }
        else r.el.style.strokeDashoffset = String(r.len * (1 - k))
      }
      deads.forEach((d, i) => d.classList.toggle('is-on', p > 0.4 + i * 0.12))
      ends.forEach((e, i) => e.classList.toggle('is-on', p > 0.55 + i * 0.12))
    }
    // packets: they only travel once a road is complete
    const t0 = performance.now()
    const move = (now: number) => {
      if (visible) {
        paint()
        roads.forEach((r, i) => {
          if (!r.dot) return
          const done = shown >= r.delay + 0.55
          r.dot.style.opacity = done ? '1' : '0'
          if (!done) return
          const hot = r.el.classList.contains('is-hot')
          const u = (((now - t0) / (hot ? 900 : 2600)) + i * 0.33) % 1
          const q = r.el.getPointAtLength(u * r.len)
          r.dot.setAttribute('x', String(q.x - 4)); r.dot.setAttribute('y', String(q.y - 4))
        })
      }
      requestAnimationFrame(move)
    }
    new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '20% 0px' }).observe(map)
    build()
    addEventListener('resize', () => requestAnimationFrame(build))
    document.fonts?.ready.then(build)
    if (!reduce) requestAnimationFrame(move)
  })
}
