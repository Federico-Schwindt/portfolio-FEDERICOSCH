/**
 * Home page only: the elastic name, the two pinned scenes (design file, keyboard), the process
 * player and the service rows. The WebGL layers (paint, keycap) are imported after first paint,
 * so the hero is readable and clickable before any 3D arrives.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { initStudio } from './studio'
import { initPaths } from './paths'
import { initSold } from './comb'
import { initThreads } from './threads'
import { initWritten } from './written'
import { slides, onEnter, play } from './enter'

gsap.registerPlugin(ScrollTrigger)
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
const wide = matchMedia('(min-width: 861px)').matches
const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)]
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t))

window.__lenis?.on('scroll', ScrollTrigger.update)

// preview a hero composition with ?hero=b or ?hero=c (the chosen one is set in the markup)
const heroPick = new URLSearchParams(location.search).get('hero')
if (heroPick) $('.hero')?.setAttribute('data-hero', heroPick)
const tonePick = new URLSearchParams(location.search).get('tone')
if (tonePick) $('.hero')?.setAttribute('data-tone', tonePick)

/* Elastic name: each letter widens near the cursor while the word keeps its total width */
$$('[data-elastic]').forEach((word) => {
  const text = word.textContent!.trim()
  word.innerHTML = [...text].map((c) => `<span>${c}</span>`).join('')
  const letters = $$('span', word)
  const fit = () => {
    word.style.fontSize = '100px'
    letters.forEach((l) => (l.style.fontVariationSettings = '"wdth" 100'))
    const cs = getComputedStyle(word.parentElement!)
    const w = word.getBoundingClientRect().width, box = word.parentElement!.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    word.style.fontSize = `${(100 * box) / w}px`
  }
  fit()
  document.fonts.ready.then(fit)
  addEventListener('resize', fit)
  if (reduce) return
  const cur = letters.map(() => 100)
  let mx = -1, active = false, visible = true
  const t0 = performance.now()
  if (fine) addEventListener('pointermove', (e) => {
    const r = word.getBoundingClientRect()
    active = e.clientY > r.top - 200 && e.clientY < r.bottom + 260
    mx = (e.clientX - r.left) / r.width
  }, { passive: true })
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(word)
  gsap.ticker.add(() => {
    if (!visible) return
    const n = letters.length, t = (performance.now() - t0) / 1000
    const pos = active && mx >= -0.2 && mx <= 1.2 ? mx : 0.5 + 0.5 * Math.sin(t * 0.6)
    const raw = letters.map((_, i) => { const d = (i + 0.5) / n - pos; return 0.7 + 0.9 * Math.exp(-(d * d) / 0.035) })
    const mean = raw.reduce((a, b) => a + b, 0) / n
    raw.forEach((r, i) => {
      const target = Math.min(125, Math.max(62, (r / mean) * 100))
      cur[i] += (target - cur[i]) * 0.09
      letters[i].style.fontVariationSettings = `"wdth" ${cur[i].toFixed(1)}`
    })
  })
})

initStudio({ reduce, wide, fine })

/* Keyboard: the section holds while the key drops into its gap, then the code is typed by the scroll */
$$('[data-kb]').forEach((root) => {
  const codeEl = $('[data-code]', root)!, full = codeEl.dataset.code!
  const keys = new Map($$('[data-k]', root).map((k) => [k.dataset.k!, k]))
  const SYM: Record<string, string> = { ' ': 'Space', '\n': 'Enter', '(': '9', ')': '0', '{': '[', '}': ']', '"': "'" }
  const keyFor = (ch: string) => SYM[ch] ?? ch.toUpperCase()
  let last = -1
  const type = (n: number) => {
    if (n === last) return
    last = n
    codeEl.textContent = full.slice(0, n)
    keys.forEach((k) => k.classList.remove('is-down'))
    if (n > 0 && n < full.length) keys.get(keyFor(full[n - 1]))?.classList.add('is-down')
  }
  if (reduce || !wide) { type(full.length); return } // the finished code, the full keyboard
  type(0)
  if (slides()) { onEnter(root, () => setTimeout(() => play(2200, (k) => type(Math.round(k * full.length)), (t) => t), 500)); return }
  ScrollTrigger.create({ trigger: root, start: 'top top', end: '+=72%', pin: $('[data-pin]', root), onUpdate: (s) => type(Math.round(Math.min(1, Math.max(0, (s.progress - 0.36) / 0.6)) * full.length)) })
})

/* Hero: one example request, shown moving through the plan (sent → in progress → review → delivered), then the next */
$$('[data-live]').forEach((root) => {
  const d = JSON.parse(root.dataset.live!) as { states: string[]; items: string[] }
  const title = $('[data-live-title]', root)!, state = $('[data-live-state]', root)!, bar = $('[data-live-bar]', root)!, num = $('[data-live-n]', root)!
  const set = (i: number, st: number, p: number) => { title.textContent = d.items[i % d.items.length]; num.textContent = '#' + (128 + i); state.textContent = d.states[st]; root.dataset.state = String(st); bar.style.transform = `scaleX(${p})` }
  if (reduce) { set(0, 3, 1); return }
  let i = 0, timers: number[] = [], on = false
  const run = () => {
    timers.forEach(clearTimeout); timers = []
    root.classList.add('is-swap'); set(i, 0, 0.04)
    const at = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms))
    at(60, () => root.classList.remove('is-swap'))
    at(900, () => set(i, 1, 0.72))
    at(3300, () => set(i, 2, 0.92))
    at(4500, () => set(i, 3, 1))
    at(6100, () => { i++; if (on) run() })
  }
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) run(); else { timers.forEach(clearTimeout); timers = [] } }, { threshold: 0.2 }).observe(root)
})

/* Process player: plays once when it enters; the visitor takes over with click, drag or keys.
   It never holds the scroll. Bounds: Discover W1, Design W2-3, Build W4-6, Grow W7. */
$$('[data-ed]').forEach((root) => {
  const ph = $('[data-ph]', root)!, tc = $('[data-tc]', root)!, lane = $('[data-lanes]', root)!
  const clips = $$('[data-clip]', root), tabs = $$('[role=tab]', root), panels = $$('[data-s].ed__step', root)
  const bounds = [0, 1 / 7, 3 / 7, 6 / 7, 1]
  let p = 0, playing = false, raf = 0
  const apply = (v: number) => {
    p = Math.min(1, Math.max(0, v))
    ph.style.setProperty('--x', String(p))
    const step = p >= bounds[3] ? 3 : p >= bounds[2] ? 2 : p >= bounds[1] ? 1 : 0
    if (root.dataset.step !== String(step)) {
      root.dataset.step = String(step)
      tabs.forEach((t, i) => { t.setAttribute('aria-selected', String(i === step)); t.tabIndex = i === step ? 0 : -1 })
      panels.forEach((x, i) => x.toggleAttribute('data-on', i === step))
    }
    const days = p * 49, w = Math.min(7, Math.floor(days / 7) + 1), d = Math.min(7, Math.floor(days % 7) + 1)
    const mins = Math.floor((days % 1) * 24 * 60)
    tc.textContent = `${root.dataset.wk ?? 'W'}${String(w).padStart(2, '0')} / D${d} / ${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
    clips.forEach((c) => c.classList.toggle('is-on', p >= +c.dataset.clip!))
    root.style.setProperty('--local', String((p - bounds[step]) / (bounds[step + 1] - bounds[step])))
  }
  const stop = () => { playing = false; cancelAnimationFrame(raf); root.classList.remove('is-playing') }
  const play = () => {
    if (reduce || playing) return
    playing = true; root.classList.add('is-playing')
    let last = performance.now()
    const tick = (now: number) => {
      if (!playing) return
      apply(p + (now - last) / 16000); last = now // the whole edit runs in 16 seconds
      if (p >= 1) { stop(); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  }
  // a stage is shown at the point where its preview is complete
  const goStage = (i: number) => { stop(); apply(bounds[i] + (bounds[i + 1] - bounds[i]) * 0.92) }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => goStage(i))
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
      if (!d) return
      e.preventDefault()
      const k = (i + d + tabs.length) % tabs.length
      tabs[k].focus(); goStage(k)
    })
  })
  const seek = (e: PointerEvent) => { const r = lane.getBoundingClientRect(); apply((e.clientX - r.left) / r.width) }
  lane.addEventListener('pointerdown', (e) => { stop(); seek(e); lane.setPointerCapture(e.pointerId) })
  lane.addEventListener('pointermove', (e) => { if (lane.hasPointerCapture(e.pointerId)) seek(e) })
  $('[data-play]', root)?.addEventListener('click', () => { if (playing) stop(); else { if (p >= 1) apply(0); play() } })

  if (reduce) { apply(1); return } // every stage is listed statically (see CSS)
  apply(0)
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { play(); o.disconnect() } }, { threshold: 0.45 }).observe(root)
})

/* Service rows: the selected row shows its picture */
$$('[data-offers]').forEach((root) => {
  const rows = $$('[data-offer]', root), shots = $$('[data-shot]', root)
  const pick = (i: number) => { rows.forEach((r, k) => r.classList.toggle('is-on', k === i)); shots.forEach((s, k) => s.classList.toggle('is-on', k === i)) }
  rows.forEach((r, i) => { r.addEventListener('pointerenter', () => pick(i)); r.addEventListener('focusin', () => pick(i)) })
  pick(0)
})

initPaths({ reduce })
initThreads({ reduce })
initWritten({ reduce })
initSold({ reduce })

// triggers are created in page order here, but measure again once everything has loaded
addEventListener('load', () => { ScrollTrigger.sort(); ScrollTrigger.refresh() })

// block scroll and the Figma builder (desktop with a mouse); measured after the pinned scenes exist.
// Everywhere else the scroll stays free and the builder lays each piece out as it comes into view.
import('./slides').then((m) => m.initSlides() ?? m.initScrollBuild())

/* WebGL arrives after the page is usable */
const startGL = async () => {
  if (reduce) return // no three.js at all under reduced motion: the stills and the plain portrait are the page
  const paint = fine ? await import('../gl/paint') : null
  paint?.initPaint()
}
const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback
if (document.readyState === 'complete') (idle ? idle(startGL, { timeout: 1500 }) : setTimeout(startGL, 300))
else addEventListener('load', () => (idle ? idle(startGL, { timeout: 1500 }) : setTimeout(startGL, 300)))
