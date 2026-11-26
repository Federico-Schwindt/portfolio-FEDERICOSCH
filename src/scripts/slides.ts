/**
 * Block scroll (home, desktop with a mouse): the page is a deck. Every block is exactly one screen tall and
 * its content always fits (a fitter shrinks it a little when a window is short). One gesture moves one block.
 *  - Wheel, keys (arrows, page, space, home, end), the dots on the right and in-page links move between blocks.
 *  - Arriving is what starts things: the section gets a `slide:enter` event (scenes listen, see enter.ts) and
 *    three labelled cursors lay its pieces out like a Figma file: text is drawn as a box and then appears,
 *    cards are dragged from a little off and snap, with alignment guides. Rectangles and numbers are measured.
 * Phones, tablets and narrow windows (initScrollBuild): blocks there are taller than a screen and cannot be
 * shrunk to fit, so the deck is made of screens instead: every block starts a stop, and a tall block gets more
 * stops inside it, each starting at the top of one of its pieces. One swipe (or wheel gesture, or key) moves one
 * stop, and the same cursors lay out whatever arrives. Reduced motion keeps the plain page: nothing here runs.
 */
import { soldDive } from './dive'

export const slideMode = () =>
  !!document.querySelector('[data-slides]') &&
  matchMedia('(min-width: 861px) and (hover: hover) and (pointer: fine)').matches &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const out3 = (t: number) => 1 - (1 - t) ** 3
const px = (n: number) => `${Math.round(n)}px`
const ES = document.documentElement.lang === 'es'
const topOf = (el: HTMLElement) => Math.round(el.getBoundingClientRect().top + scrollY)
const blocks = () => [...[...document.querySelector('main')!.children].filter((e) => e.tagName === 'SECTION' || e.tagName === 'HEADER'), ...document.querySelectorAll('body > footer')] as HTMLElement[]

/* ───────────── every block fits one screen ───────────── */
function fit() {
  for (const s of blocks()) {
    const kids = [...s.children].filter((k) => { const p = getComputedStyle(k).position; return p !== 'absolute' && p !== 'fixed' }) as HTMLElement[]
    kids.forEach((k) => (k.style.zoom = ''))
    const cs = getComputedStyle(s)
    const avail = s.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
    const gap = parseFloat(cs.rowGap) || 0
    const total = () => kids.reduce((a, k) => a + k.getBoundingClientRect().height, 0) + Math.max(0, kids.length - 1) * gap
    let z = 1
    for (let i = 0; i < 5; i++) {
      const h = total()
      if (h <= avail + 1) break
      z = Math.max(0.6, z * (avail / h) * 0.995)
      kids.forEach((k) => (k.style.zoom = String(z)))
    }
    s.dataset.fit = z.toFixed(3)
  }
}

/* ───────────── blocks and movement ───────────── */
function controller(enter: (sec: HTMLElement) => void, leave: () => void) {
  let stops: number[] = [], secs: HTMLElement[] = []
  const compute = () => {
    fit()
    secs = blocks()
    stops = secs.map((s) => topOf(s)) // the footer is a block too
    dots()
  }
  const blockAt = (y: number) => {
    let best = 0
    secs.forEach((s, i) => { if (Math.abs(topOf(s) - y) < Math.abs(topOf(secs[best]) - y)) best = i })
    return secs[best]
  }

  let anim = 0, moving = false, lockUntil = 0
  const go = (to: number, dur = 950) => {
    to = Math.max(0, Math.min(to, document.documentElement.scrollHeight - innerHeight))
    cancelAnimationFrame(anim)
    const from = scrollY, d = to - from
    const target = blockAt(to)
    if (Math.abs(d) < 2) { enter(target); return }
    moving = true; leave()
    // into the footer: the view dives through the O of SOLD instead of scrolling
    const sold = document.querySelector<HTMLElement>('[data-sold]')
    if (target.tagName === 'FOOTER' && d > 0 && sold) {
      const bg = getComputedStyle(sold.closest('section')!).backgroundColor
      soldDive(sold, bg, () => { scrollTo(0, to); enter(target) }).then(() => { moving = false; lockUntil = performance.now() + 280; mark() })
      return
    }
    const t0 = performance.now()
    dur = Math.min(dur, 420 + Math.abs(d) * 0.5)
    let early = false
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      scrollTo(0, from + d * ease(k))
      // the block starts arranging itself while it is still arriving, so a screen is never empty
      if (!early && k > 0.55) { early = true; enter(target) }
      if (k < 1) anim = requestAnimationFrame(step)
      else { moving = false; lockUntil = performance.now() + 280; mark() }
    }
    anim = requestAnimationFrame(step)
  }
  const next = (dir: 1 | -1) => {
    const y = scrollY
    const t = dir > 0 ? stops.find((s) => s > y + 4) : [...stops].reverse().find((s) => s < y - 4)
    if (t !== undefined) go(t)
  }

  // wheel: one gesture, one block. A trackpad's long tail of small events counts as the same gesture.
  let lastWheel = 0, acc = 0
  addEventListener('wheel', (e) => {
    if (e.ctrlKey) return // pinch zoom
    e.preventDefault()
    const now = performance.now(), gap = now - lastWheel
    lastWheel = now
    if (moving || now < lockUntil) { acc = 0; return }
    if (gap > 180) acc = 0
    acc += e.deltaY * (e.deltaMode === 1 ? 32 : 1)
    if (Math.abs(acc) < 24) return
    const dir = acc > 0 ? 1 : -1
    acc = 0
    next(dir)
  }, { passive: false })

  addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('input, textarea, select, [contenteditable], [role=tablist], [data-lanes]') || e.altKey || e.ctrlKey || e.metaKey) return
    const k = e.key
    if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); if (!moving) next(1) }
    else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); if (!moving) next(-1) }
    else if (k === 'Home') { e.preventDefault(); go(0, 1200) }
    else if (k === 'End') { e.preventDefault(); go(stops[stops.length - 1], 1200) }
  })

  // in-page links land on their block
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]')
    if (!a || a.pathname !== location.pathname) return
    const el = a.hash.length > 1 && document.getElementById(a.hash.slice(1))
    if (!el) return
    e.preventDefault()
    const sec = el.closest('main > section, main > header') as HTMLElement | null
    go(sec ? topOf(sec) : el.getBoundingClientRect().top + scrollY, 1200)
  })

  // a drag of the scrollbar (or a find-in-page jump) settles on the nearest block, which then arrives
  let settle = 0
  addEventListener('scroll', () => {
    if (moving) return
    mark()
    clearTimeout(settle)
    settle = window.setTimeout(() => {
      if (moving) return
      const y = scrollY, near = stops.reduce((b, s) => (Math.abs(s - y) < Math.abs(b - y) ? s : b), stops[0])
      if (Math.abs(near - y) > 2) go(near, 600)
    }, 220)
  }, { passive: true })

  // the dots on the right: where you are, and a way to jump
  const rail = document.createElement('nav')
  rail.className = 'slides-rail'
  rail.setAttribute('aria-label', ES ? 'Bloques' : 'Blocks')
  document.body.append(rail)
  function dots() {
    rail.innerHTML = secs.map((s, i) => `<button type="button" aria-label="${s.dataset.slideName ?? i + 1}"><span>${String(i + 1).padStart(2, '0')} ${s.dataset.slideName ?? ''}</span></button>`).join('')
    rail.querySelectorAll<HTMLButtonElement>('button').forEach((b, i) => b.addEventListener('click', () => go(topOf(secs[i]), 1200)))
    mark()
  }
  function mark() {
    const y = scrollY + innerHeight * 0.5
    let cur = 0
    secs.forEach((s, i) => { if (topOf(s) <= y) cur = i })
    rail.querySelectorAll('button').forEach((b, i) => b.toggleAttribute('data-on', i === cur))
  }

  compute()
  let rt = 0
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(() => { compute(); go(topOf(blockAt(scrollY)), 300) }, 150) })
  addEventListener('load', () => setTimeout(compute, 200))
  document.fonts?.ready.then(compute)
  return { compute, go, blockAt }
}

/* ───────────── builder: cursors that lay each block out ───────────── */
type Cur = { el: HTMLElement; x: number; y: number; busy: Promise<void>; jobs: number }
function builder() {
  const layer = document.createElement('div')
  layer.className = 'bd-layer'
  layer.setAttribute('aria-hidden', 'true')
  document.body.append(layer)
  const ARROW = '<svg viewBox="0 0 18 26" width="18" height="26"><path d="M0 0L0 21L5.6 15.9L9.4 24.6L13.2 23L9.5 14.6L16.6 14.6Z"/></svg>'
  const names = ES ? ['Diseño', 'Código', 'Textos'] : ['Design', 'Code', 'Words']
  const curs: Cur[] = names.map((n, i) => {
    const el = document.createElement('div')
    el.className = `bd-cur bd-cur--${i}`
    el.innerHTML = `${ARROW}<b>${n}</b>`
    layer.append(el)
    const c = { el, x: innerWidth * (0.2 + 0.3 * i), y: innerHeight * 1.2, busy: Promise.resolve(), jobs: 0 }
    el.classList.add('is-idle')
    el.style.transform = `translate(${px(c.x)}, ${px(c.y)})`
    return c
  })

  const tween = (dur: number, fn: (k: number) => void, e = out3) => new Promise<void>((res) => {
    const t0 = performance.now()
    const step = (now: number) => { const k = Math.min(1, (now - t0) / dur); fn(e(k)); if (k < 1) requestAnimationFrame(step); else res() }
    requestAnimationFrame(step)
  })
  const place = (c: Cur) => { c.el.style.transform = `translate(${px(c.x)}, ${px(c.y)})` }
  const moveCur = async (c: Cur, x: number, y: number, top: number, bot: number) => {
    // a cursor left on another block enters from the nearest edge of this one instead of crossing the page
    if (c.y < top - 40 || c.y > bot + 40) { c.y = c.y < top ? top - 30 : bot + 30; c.x = Math.min(innerWidth - 40, Math.max(20, x + (Math.random() - 0.5) * 300)) }
    c.el.classList.remove('is-idle')
    const x0 = c.x, y0 = c.y, d = Math.hypot(x - x0, y - y0)
    await tween(Math.min(340, 140 + d * 0.26), (k) => { c.x = x0 + (x - x0) * k; c.y = y0 + (y - y0) * k; place(c) }, ease)
  }
  const sel = (x: number, y: number, w: number, h: number, label: string) => {
    const s = document.createElement('div')
    s.className = 'bd-sel'
    s.innerHTML = '<i></i><i></i><i></i><i></i><b></b>'
    s.querySelector('b')!.textContent = label
    Object.assign(s.style, { left: px(x), top: px(y), width: px(w), height: px(h) })
    layer.append(s)
    return s
  }
  const guides = (x: number, y: number, w: number, top: number, height: number) => {
    const v = document.createElement('div'), hz = document.createElement('div')
    v.className = 'bd-guide bd-guide--v'; hz.className = 'bd-guide bd-guide--h'
    Object.assign(v.style, { left: px(x), top: px(top), height: px(height) })
    Object.assign(hz.style, { left: px(Math.max(0, x - 60)), top: px(y), width: px(w + 120) })
    v.innerHTML = `<b>x ${Math.round(x)}</b>`
    layer.append(v, hz)
    setTimeout(() => { v.classList.add('is-out'); hz.classList.add('is-out') }, 320)
    setTimeout(() => { v.remove(); hz.remove() }, 700)
  }

  const isText = (el: HTMLElement) => /^(H1|H2|H3|P)$/.test(el.tagName) || el.dataset.bd === 'text'
  const OFF: [number, number][] = [[-54, 30], [62, -26], [-40, -34], [48, 36]]
  let n = 0, gen = 0
  const pending = new Set<HTMLElement>()
  const finish = (el: HTMLElement) => {
    el.style.transition = ''; el.style.transform = ''; el.style.clipPath = ''
    el.classList.add('bd-show', 'bd-done'); pending.delete(el)
  }

  const build = async (el: HTMLElement, c: Cur, g: number, secEl: HTMLElement, view = false) => {
    // page coordinates measured against where the block will rest (it may still be arriving).
    // In free scroll (view) the piece is where it is, and the cursors come in from the edges of the screen.
    const r = el.getBoundingClientRect(), sr = secEl.getBoundingClientRect()
    const top = view ? scrollY : topOf(secEl), span = view ? innerHeight : sr.height, bot = top + span
    const x = r.left + scrollX, y = view ? r.top + scrollY : r.top - sr.top + top, w = r.width, h = r.height
    const label = `${Math.round(w)} × ${Math.round(h)}`
    el.style.transition = 'none'
    if (isText(el)) {
      // text tool: drag out a box, then the words appear inside it
      await moveCur(c, x, y, top, bot)
      if (g !== gen) return finish(el)
      const s = sel(x, y, 0, 0, label)
      s.classList.add('is-on')
      await tween(Math.min(320, 160 + w * 0.2), (k) => { s.style.width = px(w * k); s.style.height = px(h * k); c.x = x + w * k; c.y = y + h * k; place(c) }, ease)
      el.style.clipPath = 'inset(0 100% 0 0)'
      el.classList.add('bd-show')
      await tween(Math.min(380, 200 + w * 0.22), (k) => { el.style.clipPath = `inset(0 ${(100 - k * 100).toFixed(2)}% 0 0)` }, (t) => t)
      setTimeout(() => { s.classList.add('is-out'); setTimeout(() => s.remove(), 300) }, 260)
      finish(el)
    } else {
      // move tool: the piece arrives a little off, is dragged into place and snaps to its guides
      const [ox, oy] = OFF[n++ % OFF.length]
      await moveCur(c, x + ox + Math.min(28, w * 0.2), y + oy + Math.min(22, h * 0.2), top, bot)
      if (g !== gen) return finish(el)
      el.style.transform = `translate(${ox}px, ${oy}px)`
      el.classList.add('bd-show')
      const s = sel(x + ox, y + oy, w, h, label)
      s.classList.add('is-on', 'is-grab')
      const cx0 = c.x, cy0 = c.y
      await tween(360, (k) => {
        const dx = ox * (1 - k), dy = oy * (1 - k)
        el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`
        s.style.left = px(x + dx); s.style.top = px(y + dy)
        c.x = cx0 - ox * k; c.y = cy0 - oy * k; place(c)
      })
      s.classList.remove('is-grab')
      guides(x, y, w, top, span)
      setTimeout(() => { s.classList.add('is-out'); setTimeout(() => s.remove(), 300) }, 300)
      finish(el)
    }
  }

  /** lay out every piece of a block, three cursors in parallel */
  const run = (sec: HTMLElement) => {
    const g = gen
    const items = [...sec.querySelectorAll<HTMLElement>('[data-bd]:not(.bd-done)')].filter((el) => !pending.has(el))
    items.forEach((el, i) => {
      pending.add(el)
      const c = curs[i % 3]
      c.jobs++
      c.busy = c.busy.then(() => (g === gen ? build(el, c, g, sec) : finish(el))).then(() => {
        // a cursor with nothing left to do steps out of the way
        if (--c.jobs === 0) setTimeout(() => { if (c.jobs === 0) c.el.classList.add('is-idle') }, 450)
      })
    })
  }
  /** free scroll: lay out one piece on the least busy cursor. If its turn comes late (a fast scroll) or it has
   *  left the screen, it simply appears, so the content never lags behind the reader. */
  const one = (el: HTMLElement, patience = 1400) => {
    if (pending.has(el) || el.classList.contains('bd-done')) return
    const sec = (el.closest('section, header, footer') as HTMLElement | null) ?? document.body
    pending.add(el)
    const c = curs.reduce((a, b) => (b.jobs < a.jobs ? b : a))
    const g = gen, queued = performance.now()
    c.jobs++
    c.busy = c.busy.then(() => {
      const r = el.getBoundingClientRect()
      const late = performance.now() - queued > patience || r.bottom < 0 || r.top > innerHeight
      return g === gen && !late ? build(el, c, g, sec, true) : finish(el)
    }).then(() => {
      if (--c.jobs === 0) setTimeout(() => { if (c.jobs === 0) c.el.classList.add('is-idle') }, 450)
    })
  }
  /** leaving mid-build: whatever is still waiting appears at once */
  const flush = () => { gen++; [...pending].forEach((el) => finish(el)) }
  return { run, one, flush }
}

export function initSlides() {
  if (!slideMode()) return null
  document.documentElement.classList.add('slides')
  // the old reveal system stays settled; arriving is the builder's job now
  document.querySelectorAll('[data-reveal], [data-lines]').forEach((e) => e.classList.add('in'))
  const b = builder()
  const enter = (sec: HTMLElement) => { sec.dispatchEvent(new CustomEvent('slide:enter')); b.run(sec) }
  const c = controller(enter, () => b.flush())
  // the first block: after the preloader
  const first = () => setTimeout(() => enter(c.blockAt(scrollY)), 150)
  if (document.documentElement.classList.contains('pre-on')) addEventListener('pre:done', first, { once: true })
  else first()
  return c
}

/** Phones, tablets and narrow windows: the deck moves one screen per gesture and the builder lays out each screen. */
export function initScrollBuild() {
  if (slideMode() || !document.querySelector('[data-slides]') || matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  const root = document.documentElement
  const preOn = root.classList.contains('pre-on')
  const els = [...document.querySelectorAll<HTMLElement>('main [data-bd]')]
  // without the preloader to cover it, what is already on screen stays as it is (no flash, then rebuild)
  if (!preOn) els.forEach((el) => { const r = el.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) el.classList.add('bd-show', 'bd-done') })
  // pieces this layout does not render (hidden on phones) are left visible for when the window changes
  els.forEach((el) => { if (!el.getClientRects().length) el.classList.add('bd-show', 'bd-done') })
  // these pieces arrive with the builder, not with the fade-in
  els.forEach((el) => el.classList.add('in'))
  root.classList.add('bd-scroll', 'bd-deck')
  // the deck moves the page by itself: the smooth-scroll library would fight it
  window.__lenis?.destroy(); root.classList.remove('lenis', 'lenis-smooth')
  const b = builder()

  /* ── stops: every block starts one; a tall block gets more, each at the top of one of its pieces ── */
  let stops: number[] = []
  const PIECES = 'h2, h3, p, li, figure, img, form, table, pre, [data-bd], .card'
  const compute = () => {
    const vh = innerHeight, max = root.scrollHeight - vh, out: number[] = []
    for (const blk of blocks()) {
      const T = topOf(blk), B = T + blk.offsetHeight
      out.push(T)
      if (B - T <= vh + 8) continue
      const tops = [...new Set([...blk.querySelectorAll<HTMLElement>(PIECES)].filter((e) => e.getClientRects().length).map((e) => topOf(e)))].sort((a, c) => a - c)
      let pos = T
      while (B - pos > vh + 8) {
        const ideal = pos + vh * 0.86
        // the last piece that starts before the bottom of this screen, as long as it is not too close to the top
        const pick = tops.filter((t) => t - 16 > pos + vh * 0.4 && t - 16 <= ideal).pop()
        let next = Math.min(pick !== undefined ? pick - 16 : ideal, B - vh)
        if (next <= pos + 24) next = Math.min(pos + vh * 0.86, B - vh)
        if (next <= pos + 24) break
        out.push(next)
        pos = next
      }
    }
    const sorted = [...new Set(out.map((y) => Math.round(Math.max(0, Math.min(y, max)))))].sort((a, c) => a - c)
    // a stop too close to the one before feels like nothing happened: drop it when the next one is still
    // within a screen of the previous (so nothing in between is skipped)
    // (a few pixels of overlap may go: a screen is allowed to be 3% taller than the window)
    const reach = vh * 1.03
    stops = []
    sorted.forEach((y, i) => {
      const prev = stops[stops.length - 1], prev2 = stops[stops.length - 2], next = sorted[i + 1]
      if (prev !== undefined && y - prev < vh * 0.3) {
        if (prev2 !== undefined && y - prev2 <= reach) { stops[stops.length - 1] = y; return } // keep the later one (a block start)
        if (next === undefined ? max - prev <= reach : next - prev <= reach) return
      }
      stops.push(y)
    })
  }
  const nearest = (y: number) => stops.reduce((bi, s, i) => (Math.abs(s - y) < Math.abs(stops[bi] - y) ? i : bi), 0)

  /* ── arriving: the cursors lay out whatever is on this screen ── */
  const arrive = () => {
    for (const el of els) {
      if (el.classList.contains('bd-done')) continue
      const r = el.getBoundingClientRect()
      if (r.height && r.bottom > 0 && r.top < innerHeight * 0.96) b.one(el, 5000)
    }
  }

  /* ── movement ── */
  let anim = 0, moving = false, lockUntil = 0, cur = 0
  const go = (i: number, dur = 760) => {
    i = Math.max(0, Math.min(stops.length - 1, i))
    cur = i
    const to = stops[i], from = scrollY, d = to - from
    cancelAnimationFrame(anim)
    if (Math.abs(d) < 2) { scrollTo(0, to); arrive(); return }
    moving = true
    const t0 = performance.now()
    dur = Math.min(dur, 360 + Math.abs(d) * 0.45)
    let early = false
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      scrollTo(0, from + d * ease(k))
      if (!early && k > 0.6) { early = true; arrive() }
      if (k < 1) anim = requestAnimationFrame(step)
      else { moving = false; lockUntil = performance.now() + 180; arrive() }
    }
    anim = requestAnimationFrame(step)
  }

  /* ── touch: the page follows the finger, and on release it moves one stop (or settles back) ── */
  const own = (t: EventTarget | null) => {
    let el = t as HTMLElement | null
    if (!el || !el.closest) return false
    if (el.closest('input, textarea, select, [contenteditable], [data-lanes], iframe, .is-open[data-menu], [data-menu].is-open')) return true
    for (; el && el !== document.body; el = el.parentElement) {
      const cs = getComputedStyle(el)
      if (/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 2) return true // its own horizontal scroll
      if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2) return true // its own vertical scroll
    }
    return false
  }
  let g: { y0: number; s0: number; i0: number; native: boolean; last: { y: number; t: number }[] } | null = null
  addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { g = null; return }
    const y = e.touches[0].clientY
    const native = own(e.target) || !!document.querySelector('[data-nav].is-open')
    if (moving) { g = { y0: y, s0: scrollY, i0: cur, native, last: [] }; return }
    g = { y0: y, s0: scrollY, i0: nearest(scrollY), native, last: [{ y, t: performance.now() }] }
  }, { passive: true })
  addEventListener('touchmove', (e) => {
    if (!g || g.native || e.touches.length !== 1) return
    e.preventDefault()
    if (moving) return
    const y = e.touches[0].clientY, dy = y - g.y0
    // follow the finger, but only as far as the neighbouring stops
    const lo = stops[Math.max(0, g.i0 - 1)] - 30, hi = stops[Math.min(stops.length - 1, g.i0 + 1)] + 30
    scrollTo(0, Math.max(lo, Math.min(hi, g.s0 - dy)))
    g.last.push({ y, t: performance.now() }); if (g.last.length > 6) g.last.shift()
  }, { passive: false })
  const release = () => {
    if (!g || g.native || moving || g.last.length < 1) { g = null; return }
    const a = g.last[0], z = g.last[g.last.length - 1]
    const dy = z.y - g.y0, v = (z.y - a.y) / Math.max(1, z.t - a.t) // px per ms, negative = finger going up
    const i0 = g.i0
    g = null
    if (dy < -44 || v < -0.35) go(i0 + 1)
    else if (dy > 44 || v > 0.35) go(i0 - 1)
    else go(i0, 420)
  }
  addEventListener('touchend', release, { passive: true })
  addEventListener('touchcancel', release, { passive: true })

  /* ── wheel and keys (narrow windows and tablets with a trackpad): one gesture, one stop ── */
  let lastWheel = 0, acc = 0
  addEventListener('wheel', (e) => {
    if (e.ctrlKey || own(e.target)) return
    e.preventDefault()
    const now = performance.now(), gap = now - lastWheel
    lastWheel = now
    if (moving || now < lockUntil) { acc = 0; return }
    if (gap > 180) acc = 0
    acc += e.deltaY * (e.deltaMode === 1 ? 32 : 1)
    if (Math.abs(acc) < 24) return
    const dir = acc > 0 ? 1 : -1
    acc = 0
    go(nearest(scrollY) + dir)
  }, { passive: false })
  addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('input, textarea, select, [contenteditable], [role=tablist], [data-lanes]') || e.altKey || e.ctrlKey || e.metaKey) return
    const k = e.key
    if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); if (!moving) go(nearest(scrollY) + 1) }
    else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); if (!moving) go(nearest(scrollY) - 1) }
    else if (k === 'Home') { e.preventDefault(); go(0, 1000) }
    else if (k === 'End') { e.preventDefault(); go(stops.length - 1, 1000) }
  })

  // in-page links land on the stop of their block
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]')
    if (!a || a.pathname !== location.pathname) return
    const el = a.hash.length > 1 && document.getElementById(a.hash.slice(1))
    if (!el) return
    e.preventDefault()
    const blk = el.closest('main > section, main > header') as HTMLElement | null
    go(nearest(blk ? topOf(blk) : topOf(el)), 1000)
  }, true)

  // anything that moves the page some other way (find in page, focus, the browser restoring a position):
  // what ends up on screen is laid out too
  let settle = 0
  addEventListener('scroll', () => { if (moving) return; clearTimeout(settle); settle = window.setTimeout(arrive, 220) }, { passive: true })

  compute()
  let rt = 0
  const remeasure = () => { clearTimeout(rt); rt = window.setTimeout(() => { compute(); if (!moving && !g) go(nearest(scrollY), 300) }, 180) }
  addEventListener('resize', remeasure)
  addEventListener('orientationchange', remeasure)
  addEventListener('load', () => setTimeout(compute, 200))
  document.fonts?.ready.then(compute)
  // images and late layout change the heights: measure again when they settle
  new ResizeObserver(() => { clearTimeout(rt); rt = window.setTimeout(compute, 250) }).observe(document.querySelector('main')!)

  const first = () => setTimeout(() => { cur = nearest(scrollY); arrive() }, 150)
  if (preOn) { addEventListener('pre:done', first, { once: true }); setTimeout(first, 7600) } // the preloader gives up at 7 s
  else first()
  return { go, compute }
}
