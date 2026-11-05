/* Site-wide behaviour: nav, menu, reveals, counters, clock, the hero lens, work previews, cards, tabs, filters. */
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)]
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
/** runs fn once the page has loaded and the main thread has had a moment */
const afterLoad = (fn: () => void, delay = 1200) => {
  const go = () => setTimeout(fn, delay)
  if (document.readyState === 'complete') go()
  else addEventListener('load', go, { once: true })
}

/* ---------- Nav: solid after scrolling, hides going down, follows the theme of the section under it ---------- */
const nav = $('[data-nav]')
if (nav) {
  let last = scrollY
  const themed = $$('[data-theme]')
  const onScroll = () => {
    const y = scrollY
    nav.classList.toggle('is-scrolled', y > 20)
    if (!document.documentElement.classList.contains('lock')) nav.classList.toggle('is-hidden', y > 400 && y > last + 4)
    if (y < last - 4) nav.classList.remove('is-hidden')
    last = y
    const probe = 30
    const sec = themed.find((s) => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe })
    if (sec) nav.dataset.on = sec.dataset.theme
  }
  addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}

/* ---------- Mobile menu ---------- */
const menu = $('[data-menu]')
const openBtn = $<HTMLButtonElement>('[data-menu-open]')
const setMenu = (open: boolean) => {
  if (!menu) return
  menu.classList.toggle('is-open', open)
  menu.inert = !open
  openBtn?.setAttribute('aria-expanded', String(open))
  document.documentElement.classList.toggle('lock', open)
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) $<HTMLElement>('a', menu)?.focus()
  else openBtn?.focus()
}
openBtn?.addEventListener('click', () => setMenu(true))
$('[data-menu-close]')?.addEventListener('click', () => setMenu(false))
menu?.addEventListener('click', (e) => { if ((e.target as Element).closest('a')) setMenu(false) })
addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu?.classList.contains('is-open')) setMenu(false) })

/* ---------- Reveal on scroll ---------- */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
$$('[data-rv],[data-lines]').forEach((el) => { if (!el.classList.contains('in')) io.observe(el) })

/* ---------- Counters ---------- */
const cio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return
  cio.unobserve(e.target)
  const el = e.target as HTMLElement
  const end = +el.dataset.count!
  if (reduced) { el.textContent = end.toLocaleString('en-US'); return }
  const t0 = performance.now()
  const dur = 1800
  const tick = (t: number) => {
    const k = Math.min(1, (t - t0) / dur)
    const eased = 1 - Math.pow(1 - k, 4)
    el.textContent = Math.round(end * eased).toLocaleString('en-US')
    if (k < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}), { threshold: 0.5 })
$$('[data-count]').forEach((el) => { el.textContent = '0'; cio.observe(el) })

/* ---------- Local time ---------- */
const clocks = $$('[data-clock]')
if (clocks.length) {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false })
  const tick = () => clocks.forEach((c) => (c.textContent = fmt.format(new Date())))
  tick()
  setInterval(tick, 15000)
}

/* ---------- Videos that play only while visible (data-src is set on first view) ---------- */
const load = (v: HTMLVideoElement) => {
  if (!v.poster && v.dataset.poster) v.poster = v.dataset.poster
  if (!v.src && v.dataset.src) { v.src = v.dataset.src; v.load() }
}
/** peek images load on first hover too */
const loadImg = (m: Element) => { if (m instanceof HTMLImageElement && m.dataset.src && !m.dataset.ok) { m.src = m.dataset.src; m.dataset.ok = '1' } }
const vio = new IntersectionObserver((es) => es.forEach((e) => {
  const v = e.target as HTMLVideoElement
  if (e.isIntersecting) { load(v); v.play().catch(() => {}) } else v.pause()
}), { rootMargin: '150px' })
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
if (!reduced && !saveData) $$<HTMLVideoElement>('video[data-autoplay]').forEach((v) => vio.observe(v))

/* ---------- Hero lens: a red circle that inverts the headline under the cursor ---------- */
$$('[data-lens]').forEach((box) => {
  let tx = 50, ty = 50, x = 50, y = 50, r = 0, tr = 0, raf = 0, idle = !fine, visible = true, t = 0
  const set = () => { box.style.setProperty('--mx', `${x}%`); box.style.setProperty('--my', `${y}%`); box.style.setProperty('--r', `${r}px`) }
  const loop = () => {
    if (idle && !reduced) { t += 0.006; tx = 50 + Math.sin(t * 1.3) * 38; ty = 50 + Math.sin(t * 2.1) * 30; tr = Math.min(innerWidth * 0.22, 220) }
    const dx = tx - x, dy = ty - y, dr = tr - r
    x += dx * 0.12; y += dy * 0.12; r += dr * 0.1
    if (Math.abs(dx) + Math.abs(dy) + Math.abs(dr) > 0.05) set()
    raf = visible ? requestAnimationFrame(loop) : 0
  }
  if (reduced) return
  let ready = fine
  if (!fine) afterLoad(() => { ready = true; if (visible && !raf) raf = requestAnimationFrame(loop) }, 1500)
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && ready && !raf) raf = requestAnimationFrame(loop) }).observe(box)
  box.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    idle = false
    const b = box.getBoundingClientRect()
    tx = ((e.clientX - b.left) / b.width) * 100
    ty = ((e.clientY - b.top) / b.height) * 100
    tr = Math.min(innerWidth * 0.16, 190)
  })
  box.addEventListener('pointerleave', () => { if (fine) tr = 0 })
})

/* ---------- Work index: preview follows the cursor ---------- */
$$('[data-windex]').forEach((list) => {
  const box = list.nextElementSibling as HTMLElement | null
  if (!box || !fine) return
  const media = [...box.children] as (HTMLImageElement | HTMLVideoElement)[]
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0, cur = -1
  const loop = () => {
    x += (tx - x) * 0.16; y += (ty - y) * 0.16
    box.style.setProperty('--px', `${x}px`); box.style.setProperty('--py', `${y}px`)
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(loop) : 0
  }
  const move = (e: PointerEvent) => {
    tx = e.clientX - box.offsetWidth * 0.5; ty = e.clientY - box.offsetHeight * 0.5
    if (!raf) raf = requestAnimationFrame(loop)
  }
  $$<HTMLAnchorElement>('[data-peek]', list).forEach((row) => {
    const i = +row.dataset.peek!
    row.addEventListener('pointerenter', (e) => {
      if (cur === -1) { x = tx = e.clientX - box.offsetWidth * 0.5; y = ty = e.clientY - box.offsetHeight * 0.5 }
      media.forEach((m, k) => {
        m.classList.toggle('on', k === i)
        if (k === i) loadImg(m)
        if (m instanceof HTMLVideoElement) { if (k === i && !reduced) { load(m); m.play().catch(() => {}) } else m.pause() }
      })
      cur = i
      box.classList.add('on')
    })
    row.addEventListener('pointermove', move)
  })
  list.addEventListener('pointerleave', () => { box.classList.remove('on'); cur = -1; media.forEach((m) => m instanceof HTMLVideoElement && m.pause()) })
})

/* ---------- Project cards: film on hover ---------- */
if (fine && !reduced) $$('[data-card]').forEach((card) => {
  const v = $<HTMLVideoElement>('video', card)
  if (!v) return
  card.addEventListener('pointerenter', () => { load(v); v.play().then(() => card.classList.add('is-playing')).catch(() => {}) })
  card.addEventListener('pointerleave', () => { card.classList.remove('is-playing'); v.pause() })
})

/* ---------- Tabs ---------- */
$$('[data-tabs]').forEach((g) => {
  const btns = $$<HTMLButtonElement>('[data-tab]', g)
  btns.forEach((b) => b.addEventListener('click', () => {
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)))
    $$('[data-panel]', g).forEach((p) => {
      p.hidden = p.dataset.panel !== b.dataset.tab
      if (!p.hidden) $$('[data-rv]', p).forEach((el) => el.classList.add('in'))
    })
  }))
})

/* ---------- Filters on /work ---------- */
$$('[data-filters]').forEach((bar) => {
  const items = $$('[data-kinds]')
  const count = $('[data-filter-count]')
  $$<HTMLButtonElement>('[data-filter]', bar).forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.filter!
    $$('[data-filter]', bar).forEach((x) => x.setAttribute('aria-pressed', String(x === b)))
    const run = () => {
      let n = 0
      items.forEach((it) => { const show = k === 'all' || it.dataset.kinds!.split(',').includes(k); it.hidden = !show; if (show) { n++; it.classList.add('in') } })
      if (count) count.textContent = String(n).padStart(2, '0')
    }
    const d = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (d.startViewTransition && !reduced) d.startViewTransition(run)
    else run()
  }))
})

/* ---------- Reel in the hero: cycles project films ---------- */
$$('[data-reel]').forEach((reel) => {
  const items = $$('[data-reel-item]', reel)
  const cap = $('[data-reel-cap]', reel)
  if (items.length < 2 || reduced) return
  let i = 0
  const show = (k: number) => {
    items.forEach((it, j) => {
      it.classList.toggle('on', j === k)
      const v = $<HTMLVideoElement>('video', it)
      if (v) { if (j === k) { load(v); v.currentTime = 0; v.play().catch(() => {}) } else v.pause() }
    })
    if (cap) { cap.innerHTML = items[k].dataset.cap!; cap.setAttribute('href', items[k].dataset.href!) }
  }
  let timer = 0
  const start = () => { stop(); timer = window.setInterval(() => show((i = (i + 1) % items.length)), 5200) }
  const stop = () => window.clearInterval(timer)
  afterLoad(() => {
    show(0)
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(reel)
  }, 2000)
})
