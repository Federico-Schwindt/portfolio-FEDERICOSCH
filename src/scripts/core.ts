/**
 * Core: what every page needs and nothing else. No GSAP, no three.js.
 * Navigation, smooth scroll, reveals, counters, work filter, hover videos.
 * The home page adds its scenes and WebGL from home.ts.
 */
import Lenis from 'lenis'

declare global { interface Window { __lenis?: Lenis; __ready?: boolean } }

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)]

/* Remember where the visit started: sent with every lead so enquiries can be attributed */
try { if (!sessionStorage.getItem('entry')) sessionStorage.setItem('entry', location.pathname) } catch { /* private mode */ }

/* Smooth scroll */
let lenis: Lenis | undefined
// block mode (home, desktop) moves by itself: no smooth-scroll library there
if (!reduce && !document.documentElement.classList.contains('slides')) {
  lenis = new Lenis({ lerp: 0.11, anchors: { offset: -80 }, autoRaf: true })
  window.__lenis = lenis
}

/* Nav: hides on the way down, returns on the way up; mobile menu */
const nav = $('[data-nav]'), menu = $('[data-menu]'), burger = $('[data-burger]')
if (nav) {
  let last = scrollY, queued = false
  addEventListener('scroll', () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      const y = scrollY
      if (Math.abs(y - last) > 6) { nav.classList.toggle('is-hidden', y > last && y > 300 && !nav.classList.contains('is-open')); last = y }
    })
  }, { passive: true })
  const toggle = (open: boolean) => {
    nav.classList.toggle('is-open', open)
    menu?.classList.toggle('is-open', open)
    burger?.setAttribute('aria-expanded', String(open))
    if (open) lenis?.stop()
    else lenis?.start()
  }
  burger?.addEventListener('click', () => toggle(!nav.classList.contains('is-open')))
  menu?.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) toggle(false) })
  addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false) })
}

/* Reveals: content enters once, when it is actually on screen */
const io = new IntersectionObserver(
  (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
  { rootMargin: '0px 0px -10% 0px' },
)
$$('[data-reveal], [data-lines]').forEach((el) => io.observe(el))

/* Counters: a number is the claim, so it counts up to prove it */
const cio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return
  cio.unobserve(e.target)
  const el = e.target as HTMLElement
  const to = parseFloat(el.dataset.count!), from = parseFloat(el.dataset.from ?? '0')
  const dec = (el.dataset.count!.split('.')[1] ?? '').length
  const fmt = (v: number) => (el.dataset.prefix ?? '') + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (el.dataset.suffix ?? '')
  const t0 = performance.now(), dur = 1800
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / dur), e3 = 1 - Math.pow(1 - k, 3)
    el.textContent = fmt(from + (to - from) * e3)
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}), { rootMargin: '0px 0px -8% 0px' })
if (!reduce) $$('[data-count]').forEach((el) => cio.observe(el))

/* Videos play only while visible; card videos load and play on hover */
const vio = new IntersectionObserver((es) => es.forEach((e) => {
  const v = e.target as HTMLVideoElement
  if (e.isIntersecting) v.play().catch(() => {})
  else v.pause()
}), { threshold: 0.25 })
if (!reduce) $$<HTMLVideoElement>('video[data-auto]').forEach((v) => vio.observe(v))
$$('[data-hover-video]').forEach((card) => {
  const v = $<HTMLVideoElement>('video', card)
  if (!v || !fine || reduce) return
  card.addEventListener('pointerenter', () => { if (!v.src) v.src = v.dataset.src!; v.play().catch(() => {}); card.classList.add('is-playing') })
  card.addEventListener('pointerleave', () => { v.pause(); card.classList.remove('is-playing') })
})

/* Work filter (work index) */
$$('[data-filter]').forEach((root) => {
  const btns = $$('button', root), cards = $$('[data-kinds]')
  btns.forEach((b) => b.addEventListener('click', () => {
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)))
    const k = b.dataset.kind!
    cards.forEach((c) => (c.hidden = k !== 'all' && !c.dataset.kinds!.split(',').includes(k)))
  }))
})

window.__ready = true

/* Scroll ruler on the left edge: a counter from 000 to 100 */
{
  const r = document.createElement('div'); r.className = 'ruler'; r.setAttribute('aria-hidden', 'true'); r.innerHTML = '<b>000</b><i></i>'
  document.body.append(r)
  const n = r.querySelector('b')!
  let last = -1
  const tick = () => { const max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0, v = Math.round(p * 100); r.style.setProperty('--p', p.toFixed(4)); if (v !== last) { last = v; n.textContent = String(v).padStart(3, '0') } }
  addEventListener('scroll', tick, { passive: true }); tick()
}

/* Theme: the inline script in Base already set data-theme; the toggle flips it and remembers the choice */
document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) => {
  const root = document.documentElement
  const label = () => b.setAttribute('aria-label', root.dataset.theme === 'dark' ? b.dataset.toLight! : b.dataset.toDark!)
  label()
  b.addEventListener('click', () => {
    root.classList.add('theme-swap')
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem('theme', root.dataset.theme) } catch {}
    label()
    setTimeout(() => root.classList.remove('theme-swap'), 500)
  })
})

/* The Figma layer: selections, auto-layout gaps, hover frames (loaded on every page) */
import('./figma').then((m) => m.initFigma())
