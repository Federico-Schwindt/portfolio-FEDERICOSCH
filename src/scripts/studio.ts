/**
 * Studio board (home). A design file, driven by the scroll: two cursors delete the template, the
 * statement is scaled up with its selection box, the third line is typed, the last one drops in
 * letter by letter, the comments arrive, and the stick man climbs out of a letter.
 * Every box and every cursor is computed from the real letter boxes, in the board's own units.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createStickMan } from './stick'
import { slides, onEnter, play } from './enter'

type P = [number, number]
type Glyph = { ch: string; x0: number; x1: number; y0: number; y1: number }
type Line = { text: string; base: number; size: number; glyphs: Glyph[] }
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const seg = (q: number, a: number, b: number) => clamp((q - a) / (b - a))
const io = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const ES = document.documentElement.lang === 'es'

export function initStudio({ reduce, wide, fine }: { reduce: boolean; wide: boolean; fine: boolean }) {
  const root = document.querySelector<HTMLElement>('[data-st2]')
  if (!root) return
  const svg = root.querySelector<SVGSVGElement>('[data-sb]')!
  const lines: Line[] = JSON.parse(svg.dataset.meta!)
  const q$ = <T extends Element>(s: string) => svg.querySelector<T>(s)!
  const set = (n: string, v: string) => { const e = root.querySelector<HTMLElement>(`[data-i="${n}"]`); if (e && e.textContent !== v) e.textContent = v }
  const man = createStickMan(svg, lines, reduce)

  // letters
  const l12 = q$<SVGGElement>('[data-l12]')
  const g3 = [...svg.querySelectorAll<SVGPathElement>('[data-line="2"] path')], g4 = [...svg.querySelectorAll<SVGPathElement>('[data-line="3"] path')]
  const caret = q$<SVGRectElement>('[data-caret]')
  const box = (gs: Glyph[]) => ({ x0: Math.min(...gs.map((g) => g.x0)), y0: Math.min(...gs.map((g) => g.y0)), x1: Math.max(...gs.map((g) => g.x1)), y1: Math.max(...gs.map((g) => g.y1)) })
  const B12 = box([...lines[0].glyphs, ...lines[1].glyphs]), ORIGIN: P = [70, 60]
  const S0 = 0.38
  // template
  const img = q$<SVGGElement>('[data-tpl-img]'), cta = q$<SVGGElement>('[data-tpl-cta]'), badge = q$<SVGGElement>('.sb__badge')
  const dels = { img: q$<SVGGElement>('[data-del="img"]'), cta: q$<SVGGElement>('[data-del="cta"]') }
  const guides = q$<SVGGElement>('[data-guides]')
  const cms = [...svg.querySelectorAll<SVGGElement>('[data-cm]')]
  const CM: P[] = [[600, 158], [528, 268], [690, 500]]
  // selection
  const selG = q$<SVGGElement>('[data-sel]'), selR = selG.querySelector('.sb__selr')!, selH = [...selG.querySelectorAll('.sb__selh')], selT = selG.querySelector<SVGGElement>('.sb__selt')!
  const selTB = selT.querySelector('rect')!, selTT = selT.querySelector('text')!
  const select = (x: number, y: number, w: number, h: number, label?: string, ink = false) => {
    selG.classList.add('is-on'); selG.classList.toggle('is-ink', ink)
    selR.setAttribute('x', x.toFixed(1)); selR.setAttribute('y', y.toFixed(1)); selR.setAttribute('width', w.toFixed(1)); selR.setAttribute('height', h.toFixed(1))
    const pts: P[] = [[x, y], [x + w / 2, y], [x + w, y], [x + w, y + h / 2], [x + w, y + h], [x + w / 2, y + h], [x, y + h], [x, y + h / 2]]
    pts.forEach(([hx, hy], i) => { selH[i].setAttribute('x', (hx - 4).toFixed(1)); selH[i].setAttribute('y', (hy - 4).toFixed(1)) })
    const t = label ?? `${Math.round(w * 1.44)} × ${Math.round(h * 1.44)}`
    if (selTT.textContent !== t) selTT.textContent = t
    const tw = t.length * 6.6 + 12
    selTB.setAttribute('width', tw.toFixed(1)); selTT.setAttribute('x', '6')
    selT.setAttribute('transform', `translate(${(x + w / 2 - tw / 2).toFixed(1)} ${(y + h + 9).toFixed(1)})`)
  }
  const unselect = () => selG.classList.remove('is-on')

  // cursors: key positions along the scroll, eased between
  type Track = [number, number, number, number?][] // q, x, y, press
  const curEl = { d: q$<SVGGElement>('[data-cur="d"]'), c: q$<SVGGElement>('[data-cur="c"]'), w: q$<SVGGElement>('[data-cur="w"]') }
  const s1: P = [ORIGIN[0] + (B12.x1 - ORIGIN[0]) * S0, ORIGIN[1] + (B12.y1 - ORIGIN[1]) * S0]
  const l3 = lines[2].glyphs, l4 = lines[3].glyphs
  const tracks: Record<'d' | 'c' | 'w', Track> = {
    d: [[0, -40, 330], [0.08, 770, 158], [0.13, 770, 158, 1], [0.2, 770, 158], [0.3, ORIGIN[0] + 4, ORIGIN[1] + 4], [0.35, s1[0], s1[1]], [0.36, s1[0], s1[1], 1], [0.48, B12.x1, B12.y1], [0.56, 470, 612], [1, 470, 612]],
    c: [[0, 1040, 120], [0.14, 1040, 120], [0.21, 160, 412], [0.24, 160, 412, 1], [0.32, 1040, 300], [0.48, l3[0].x0 - 6, lines[2].base - 40], [0.62, l3[l3.length - 1].x1 + 12, lines[2].base - 40], [0.7, 1040, 250], [1, 1040, 250]],
    w: [[0, 1040, 560], [0.6, 1040, 560], [0.64, l4[0].x0, lines[3].base - 96], [0.75, l4[l4.length - 1].x1 + 10, lines[3].base - 96], [0.82, 960, 616], [1, 960, 616]],
  }
  const posAt = (tr: Track, q: number): { p: P; press: boolean } => {
    let i = 0
    while (i < tr.length - 2 && q > tr[i + 1][0]) i++
    const a = tr[i], b = tr[i + 1], k = io(seg(q, a[0], b[0]))
    const press = tr.some((t) => t[3] && Math.abs(q - t[0]) < 0.012)
    return { p: [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k], press }
  }
  // the visitor's pointer nudges the cursors aside
  let mx = -999, my = -999
  const away: Record<string, P> = { d: [0, 0], c: [0, 0], w: [0, 0] }
  const toBoard = (e: PointerEvent): P => { const m = svg.getScreenCTM(); if (!m) return [-999, -999]; const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); return [p.x, p.y] }

  let lastQ = -1
  const apply = (q: number) => {
    lastQ = q
    // 1. the template, then its deletion
    const di = seg(q, 0.15, 0.19), dc = seg(q, 0.25, 0.29)
    img.style.opacity = String(1 - di); img.style.transform = `scale(${1 - di * 0.06})`
    cta.style.opacity = String(1 - dc); cta.style.transform = `scale(${1 - dc * 0.06})`
    badge.style.opacity = String(1 - seg(q, 0.27, 0.31))
    dels.img.classList.toggle('is-on', q > 0.15 && q < 0.26); dels.cta.classList.toggle('is-on', q > 0.25 && q < 0.35)
    // 2. the statement, scaled up by its corner
    const sc = S0 + (1 - S0) * io(seg(q, 0.36, 0.48))
    l12.style.opacity = String(seg(q, 0.29, 0.32))
    l12.setAttribute('transform', `translate(${ORIGIN[0]} ${ORIGIN[1]}) scale(${sc.toFixed(4)}) translate(${-ORIGIN[0]} ${-ORIGIN[1]})`)
    guides.classList.toggle('is-on', q > 0.36 && q < 0.5)
    // 3. typed
    const typed = Math.round(seg(q, 0.5, 0.62) * g3.length)
    g3.forEach((p, i) => (p.style.opacity = i < typed ? '1' : '0'))
    const lastG = l3[Math.max(0, typed - 1)]
    caret.setAttribute('x', String((typed ? lastG.x1 : l3[0].x0) + 5)); caret.setAttribute('y', String(lines[2].base - 76))
    caret.classList.toggle('is-on', q > 0.49 && q < 0.66)
    // 4. dropped in
    g4.forEach((p, i) => {
      const k = io(seg(q, 0.63 + i * 0.008, 0.665 + i * 0.008))
      p.style.opacity = String(k); p.style.transform = `translate(0px, ${(-64 * (1 - k)).toFixed(1)}px) rotate(${(-12 * (1 - k)).toFixed(1)}deg)`
    })
    // 5. comments
    cms.forEach((c, i) => c.classList.toggle('is-on', q > 0.76 + i * 0.035))
    // selection box, by phase
    if (q > 0.11 && q < 0.17) select(600, 70, 330, 170, undefined, false)
    else if (q > 0.22 && q < 0.27) select(70, 330, 290, 106, undefined, true)
    else if (q > 0.3 && q < 0.52) { const x1 = ORIGIN[0] + (B12.x1 - ORIGIN[0]) * sc, y1 = ORIGIN[1] + (B12.y1 - ORIGIN[1]) * sc, x0 = ORIGIN[0] + (B12.x0 - ORIGIN[0]) * sc, y0 = ORIGIN[1] + (B12.y0 - ORIGIN[1]) * sc; select(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12) }
    else if (q > 0.62 && q < 0.76) { const b = box(l4); select(b.x0 - 6, b.y0 - 6, b.x1 - b.x0 + 12, b.y1 - b.y0 + 12, 'Instrument Serif · Italic', true) }
    else unselect()
    // cursors
    ;(['d', 'c', 'w'] as const).forEach((k) => {
      const { p, press } = posAt(tracks[k], q)
      curEl[k].style.transform = `translate(${(p[0] + away[k][0]).toFixed(1)}px, ${(p[1] + away[k][1]).toFixed(1)}px)`
      curEl[k].classList.toggle('is-press', press)
    })
    // inspector
    const ph = q < 0.2 ? 0 : q < 0.3 ? 1 : q < 0.5 ? 2 : q < 0.62 ? 3 : q < 0.76 ? 4 : q < 0.84 ? 5 : 6
    const I = [
      { sel: ES ? 'Plantilla / Imagen' : 'Template / Image', font: ES ? 'Ninguna' : 'None', weight: '400', width: '100 %', size: '16 px', track: '0 %', hex: '#9B9285' },
      { sel: ES ? 'Plantilla / Botón' : 'Template / Button', font: ES ? 'Ninguna' : 'None', weight: '400', width: '100 %', size: '16 px', track: '0 %', hex: '#9B9285' },
      { sel: `${lines[0].text} ${lines[1].text}`, font: 'Archivo', weight: '900 Black', width: '100 %', size: `${Math.round(100 * sc * 1.44)} px`, track: '-4.5 %', hex: '#0B0B0B' },
      { sel: lines[2].text, font: 'Archivo', weight: '900 Black', width: '100 %', size: '144 px', track: '-4.5 %', hex: '#0B0B0B' },
      { sel: lines[3].text, font: 'Instrument Serif', weight: '400 Italic', width: '100 %', size: '173 px', track: '0 %', hex: '#F01111' },
      { sel: ES ? 'Comentarios · 3' : 'Comments · 3', font: 'Hanken Grotesk', weight: '500', width: '100 %', size: '13 px', track: '0 %', hex: '#0B0B0B' },
      { sel: ES ? 'Federico (palito)' : 'Federico (stick)', font: ES ? 'A mano' : 'Hand drawn', weight: '4.6 stroke', width: ES ? '1 persona' : '1 person', size: '76 px', track: ES ? 'Saluda' : 'Waves', hex: '#0B0B0B' },
    ][ph]
    set('sel', I.sel); set('font', I.font); set('weight', I.weight); set('width', I.width); set('size', I.size); set('track', I.track); set('hex', I.hex)
    const sw = root.querySelector<HTMLElement>('[data-i="sw"]'); if (sw) sw.style.background = I.hex
    // 6. the stick man
    if (q >= 0.84) man.play(); else if (q < 0.7) man.reset()
  }

  // hover: the notes light up under the pointer, comments lean and can be dragged, the stick man waves back
  const words = root.querySelector<HTMLElement>('[data-words]')
  if (words) words.innerHTML = words.textContent!.trim().split(/\s+/).map((w) => `<span>${w}</span>`).join(' ')
  const wordEls = words ? [...words.querySelectorAll<HTMLElement>('span')] : []
  if (fine && !reduce) {
    let cx = -999, cy = -999
    addEventListener('pointermove', (e) => { cx = e.clientX; cy = e.clientY; const p = toBoard(e); mx = p[0]; my = p[1] }, { passive: true })
    svg.addEventListener('pointerleave', () => { mx = my = -999; root.classList.remove('has-you') })
    svg.addEventListener('pointerenter', () => root.classList.add('has-you'))
    let seen = false
    new IntersectionObserver(([e]) => (seen = e.isIntersecting)).observe(root)
    gsap.ticker.add(() => {
      if (!seen) return
      wordEls.forEach((w) => { const r = w.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy); w.style.opacity = d < 90 ? String(1 - (d / 90) * 0.55) : '' })
      let moved = false
      ;(['d', 'c', 'w'] as const).forEach((k) => {
        const { p } = posAt(tracks[k], Math.max(0, lastQ)), dx = p[0] + away[k][0] - mx, dy = p[1] + away[k][1] - my, d = Math.hypot(dx, dy) || 1
        const push = d < 90 ? (1 - d / 90) * 34 : 0, tx = (dx / d) * push, ty = (dy / d) * push
        const nx = away[k][0] + (tx - away[k][0]) * 0.15, ny = away[k][1] + (ty - away[k][1]) * 0.15
        if (Math.abs(nx - away[k][0]) > 0.05 || Math.abs(ny - away[k][1]) > 0.05) moved = true
        away[k] = [nx, ny]
      })
      if (moved && lastQ >= 0) apply(lastQ)
      const hd = man.head()
      if (hd && Math.hypot(hd[0] - mx, hd[1] - my) < 70) man.hello()
    })
    svg.addEventListener('click', (e) => { const hd = man.head(), p = toBoard(e as PointerEvent); if (hd && Math.hypot(hd[0] - p[0], hd[1] + 30 - p[1]) < 60) man.jump() })
    cms.forEach((cm, i) => {
      const inner = cm.querySelector<SVGGElement>('.sb__cmi')!
      let ox = 0, oy = 0, sx = 0, sy = 0, drag = false
      const place = () => cm.setAttribute('transform', `translate(${CM[i][0] + ox} ${CM[i][1] + oy})`)
      cm.addEventListener('pointermove', (e) => {
        const p = toBoard(e)
        if (drag) { ox += p[0] - sx; oy += p[1] - sy; sx = p[0]; sy = p[1]; place(); return }
        const lx = p[0] - (CM[i][0] + ox), ly = p[1] - (CM[i][1] + oy)
        inner.style.transform = `rotate(${((lx / 250 - 0.5) * 4).toFixed(2)}deg)`
        void ly
      })
      cm.addEventListener('pointerleave', () => { if (!drag) inner.style.transform = '' })
      cm.addEventListener('pointerdown', (e) => { drag = true; const p = toBoard(e); sx = p[0]; sy = p[1]; cm.setPointerCapture(e.pointerId); cm.classList.add('is-drag') })
      cm.addEventListener('pointerup', () => { drag = false; cm.classList.remove('is-drag') })
      place()
    })
  } else cms.forEach((cm, i) => cm.setAttribute('transform', `translate(${CM[i][0]} ${CM[i][1]})`))

  if (reduce || !wide) { // the finished file; the stick man plays when it comes into view
    apply(0.86); man.reset()
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { man.play(); o.disconnect() } }, { threshold: 0.4 }).observe(svg)
    return
  }
  apply(0)
  // block mode: the whole file plays when the block arrives, nothing waits for the scroll
  if (slides()) { onEnter(root, () => play(6400, apply, (t) => t)); return }
  ScrollTrigger.create({ trigger: root, start: 'top top', end: '+=180%', pin: root.querySelector('[data-pin]'), scrub: 0.4, onUpdate: (s) => apply(s.progress), onRefresh: (s) => apply(s.progress) })
}
