/**
 * Figma layer: the site shows the tools it was made with, measured from the real layout.
 *  1. Headings get a selection frame when they arrive: dragged from the corner, with handles and their true size.
 *  2. Grids marked data-fx="gap" show their auto-layout spacing (pink bands with the gap in px) once.
 *  3. Cards show a selection with their size while hovered (mouse only).
 *  4. Text marked data-fx="type" is typed in with a text caret.
 * Every number on screen is read from getBoundingClientRect, so it is always the real one.
 * Nothing here runs under reduced motion; nothing takes pointer events.
 */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)]
const px = (n: number) => `${Math.round(n)}px`

let layer: HTMLDivElement | null = null
const getLayer = () => {
  if (!layer) { layer = document.createElement('div'); layer.className = 'fx'; layer.setAttribute('aria-hidden', 'true'); document.body.append(layer) }
  return layer
}
/** a rect in page coordinates (survives scrolling while it is on screen) */
const pageRect = (r: DOMRect) => ({ x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height })

/** tight box around the text of an element, not its full block width */
const textBox = (el: HTMLElement) => {
  const range = document.createRange(); range.selectNodeContents(el)
  const rs = [...range.getClientRects()].filter((r) => r.width > 2 && r.height > 2)
  if (!rs.length) return el.getBoundingClientRect()
  const x0 = Math.min(...rs.map((r) => r.left)), y0 = Math.min(...rs.map((r) => r.top))
  const x1 = Math.max(...rs.map((r) => r.right)), y1 = Math.max(...rs.map((r) => r.bottom))
  return new DOMRect(x0, y0, x1 - x0, y1 - y0)
}

function frame(cls: string, label: string) {
  const f = document.createElement('div')
  f.className = `fx-sel ${cls}`
  f.innerHTML = '<i></i><i></i><i></i><i></i><b class="fx-tag"></b>'
  f.querySelector('b')!.textContent = label
  return f
}

/* 1. Heading selections */
function headings() {
  const tag = (el: HTMLElement) => el.tagName === 'H1' ? 'H1' : el.tagName === 'H2' ? 'H2' : 'Text'
  const play = (el: HTMLElement) => {
    // wait for the heading's own reveal to settle, then measure the letters as they now sit
    setTimeout(() => {
      const r = textBox(el)
      if (r.width < 40 || r.bottom < 0 || r.top > innerHeight) return
      const p = pageRect(r), pad = 8
      const f = frame('fx-sel--draw', `${tag(el)} · ${Math.round(r.width)} × ${Math.round(r.height)}`)
      Object.assign(f.style, { left: px(p.x - pad), top: px(p.y - pad), width: px(p.w + pad * 2), height: px(p.h + pad * 2) })
      getLayer().append(f)
      requestAnimationFrame(() => f.classList.add('is-on'))
      setTimeout(() => f.classList.add('is-out'), 1700)
      setTimeout(() => f.remove(), 2300)
    }, 950)
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return
    io.unobserve(e.target); play(e.target as HTMLElement)
  }), { rootMargin: '0px 0px -25% 0px' })
  $$('main section h2.d, main header h1.d').forEach((el) => { if (!el.closest('.sr-only, [data-st2], .cs-next')) io.observe(el) })
}

/* 2. Auto-layout gaps */
function gaps() {
  const show = (grid: HTMLElement) => {
    const kids = [...grid.children].filter((k) => (k as HTMLElement).offsetParent !== null) as HTMLElement[]
    const rs = kids.map((k) => k.getBoundingClientRect())
    const bands: { x: number; y: number; w: number; h: number; v: number; dir: 'x' | 'y' }[] = []
    for (let i = 0; i < rs.length - 1; i++) {
      const a = rs[i], b = rs[i + 1]
      const sameRow = Math.abs(a.top - b.top) < 4 && b.left > a.right
      if (sameRow) {
        const g = b.left - a.right
        if (g >= 4) bands.push({ x: a.right, y: Math.max(a.top, b.top), w: g, h: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top), v: g, dir: 'x' })
      } else if (b.top > a.bottom && Math.abs(a.left - b.left) < 4) {
        const g = b.top - a.bottom
        if (g >= 4) bands.push({ x: Math.max(a.left, b.left), y: a.bottom, w: Math.min(a.right, b.right) - Math.max(a.left, b.left), h: g, v: g, dir: 'y' })
      }
    }
    if (!bands.length) return
    const wrap = document.createElement('div')
    wrap.className = 'fx-gaps'
    const g = grid.getBoundingClientRect(), gp = pageRect(g)
    const outline = document.createElement('div')
    outline.className = 'fx-al'
    Object.assign(outline.style, { left: px(gp.x), top: px(gp.y), width: px(gp.w), height: px(gp.h) })
    outline.innerHTML = '<b class="fx-tag fx-tag--al"></b>'
    outline.querySelector('b')!.textContent = `Auto layout · ${bands[0].dir === 'x' ? '→' : '↓'} ${Math.round(bands[0].v)}`
    wrap.append(outline)
    bands.forEach((bd, i) => {
      const p = pageRect(new DOMRect(bd.x, bd.y, bd.w, bd.h))
      const e = document.createElement('div')
      e.className = `fx-gap fx-gap--${bd.dir}`
      e.style.setProperty('--d', `${i * 70}ms`)
      Object.assign(e.style, { left: px(p.x), top: px(p.y), width: px(p.w), height: px(p.h) })
      e.innerHTML = `<span>${Math.round(bd.v)}</span>`
      wrap.append(e)
    })
    getLayer().append(wrap)
    requestAnimationFrame(() => wrap.classList.add('is-on'))
    setTimeout(() => wrap.classList.add('is-out'), 2200)
    setTimeout(() => wrap.remove(), 2800)
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return
    io.unobserve(e.target)
    // after the children have revealed into place
    setTimeout(() => show(e.target as HTMLElement), 1100)
  }), { rootMargin: '0px 0px -30% 0px' })
  $$('[data-fx="gap"]').forEach((el) => io.observe(el))
}

/* 3. Hover selection on cards */
function hover() {
  const f = frame('fx-sel--hov', '')
  const tagEl = f.querySelector('b')!
  let on: HTMLElement | null = null, raf = 0
  const place = () => {
    if (!on) return
    const r = on.getBoundingClientRect(), p = pageRect(r)
    Object.assign(f.style, { left: px(p.x), top: px(p.y), width: px(p.w), height: px(p.h) })
    tagEl.textContent = `${on.dataset.fxName ?? 'Frame'} · ${Math.round(r.width)} × ${Math.round(r.height)}`
    raf = requestAnimationFrame(place)
  }
  $$<HTMLElement>('[data-fx-hover]').forEach((el) => {
    el.addEventListener('pointerenter', () => { on = el; getLayer().append(f); cancelAnimationFrame(raf); place(); f.classList.add('is-on') })
    el.addEventListener('pointerleave', () => { if (on === el) { on = null; cancelAnimationFrame(raf); f.classList.remove('is-on') } })
  })
}

/* 4. Typed text */
function typed() {
  $$<HTMLElement>('[data-fx="type"]').forEach((el) => {
    // keep the decorations (like the live dot), type only the text nodes
    const nodes = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent!.trim()) as Text[]
    const full = nodes.map((n) => n.textContent!)
    nodes.forEach((n) => (n.textContent = ''))
    const caret = document.createElement('span'); caret.className = 'fx-caret'; el.append(caret)
    const total = full.reduce((a, s) => a + s.length, 0)
    const go = () => {
      const t0 = performance.now(), dur = Math.min(1400, total * 28)
      const step = (now: number) => {
        let k = Math.round(Math.min(1, (now - t0) / dur) * total)
        nodes.forEach((n, i) => { const s = full[i]; n.textContent = s.slice(0, Math.max(0, k)); k -= s.length })
        if (now - t0 < dur) requestAnimationFrame(step)
        else setTimeout(() => caret.remove(), 1600)
      }
      requestAnimationFrame(step)
    }
    if (document.documentElement.classList.contains('pre-on')) addEventListener('pre:done', () => setTimeout(go, 250), { once: true })
    else setTimeout(go, 300)
  })
}

export function initFigma() {
  if (reduce) return
  // in block mode the builder already selects and places every piece
  if (!document.documentElement.classList.contains('slides')) { headings(); gaps() }
  typed()
  if (fine) hover()
}
