/**
 * Hero threads (home, desktop). Four thin threads start as a small knot next to a loose idea
 * (a sketch, an old site...) at the edges of the hero and run, clean, into the main button.
 * They are drawn once, after the preloader, and then stay still. Pointing at the button lights
 * them up. Geometry is measured from the real button, so the ends always touch it.
 */
const NS = 'http://www.w3.org/2000/svg'
const ES = document.documentElement.lang === 'es'
const IDEAS = [
  { side: -1, y: 0.17, t: ES ? 'Un boceto en papel' : 'A sketch on paper' },
  { side: -1, y: 0.68, t: ES ? 'Una web vieja' : 'An old website' },
  { side: 1, y: 0.22, t: ES ? 'Una lista de productos' : 'A product list' },
  { side: 1, y: 0.64, t: ES ? 'Una foto del local' : 'A photo of the shop' },
]
const mk = (tag: string, a: Record<string, string | number>) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, String(a[k])); return e }

export function initThreads({ reduce }: { reduce: boolean }) {
  const hx = document.querySelector<HTMLElement>('[data-hx]')
  if (!hx) return
  const svg = hx.querySelector<SVGSVGElement>('.hx__threads')!, cta = hx.querySelector<HTMLElement>('[data-hx-cta]')!
  const build = () => {
    svg.innerHTML = ''
    if (innerWidth < 1000) return
    const h = hx.getBoundingClientRect(), c = cta.getBoundingClientRect()
    const W = h.width, H = h.height
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    const cy = c.top - h.top + c.height / 2, m = Math.max(28, W * 0.035)
    IDEAS.forEach((idea, i) => {
      const dir = -idea.side // left threads travel right, right threads travel left
      const ox = idea.side < 0 ? m : W - m, oy = H * idea.y
      const tx = idea.side < 0 ? c.left - h.left - 3 : c.right - h.left + 3
      // a small knot first (the idea, still loose), then one clean curve into the side of the button
      const k = (x: number, y: number) => `${(ox + dir * x).toFixed(1)} ${(oy + y).toFixed(1)}`
      const kx = ox + dir * 46, span = Math.abs(tx - kx)
      const d = `M${k(0, 0)} C${k(14, -22)} ${k(34, -18)} ${k(26, -2)} S${k(6, 18)} ${k(20, 14)} S${k(40, -4)} ${k(46, 0)}`
        + ` C${(kx + dir * span * 0.12).toFixed(1)} ${(oy + (cy - oy) * 0.75).toFixed(1)} ${(tx - dir * span * 0.6).toFixed(1)} ${cy.toFixed(1)} ${tx.toFixed(1)} ${cy.toFixed(1)}` // down the margin first, then straight in
      const p = mk('path', { d, pathLength: 1, class: `hx__th${i === 0 ? ' hx__th--red' : ''}`, style: `--d:${(0.35 + i * 0.18).toFixed(2)}s` })
      const dot = mk('circle', { cx: ox, cy: oy, r: 3.5, class: 'hx__node', style: `--d:${(0.1 + i * 0.12).toFixed(2)}s` })
      const lab = mk('text', { x: ox, y: oy + 26, class: 'hx__idea', 'text-anchor': idea.side < 0 ? 'start' : 'end', style: `--d:${(0.1 + i * 0.12).toFixed(2)}s` })
      lab.textContent = idea.t
      svg.append(p, dot, lab)
    })
  }
  build()
  let rt = 0
  addEventListener('resize', () => { clearTimeout(rt); hx.classList.add('no-tr'); rt = window.setTimeout(() => { build(); requestAnimationFrame(() => hx.classList.remove('no-tr')) }, 120) })
  document.fonts?.ready.then(() => { hx.classList.add('no-tr'); build(); requestAnimationFrame(() => hx.classList.remove('no-tr')) })
  cta.addEventListener('pointerenter', () => hx.classList.add('is-hot'))
  cta.addEventListener('pointerleave', () => hx.classList.remove('is-hot'))
  cta.addEventListener('focus', () => hx.classList.add('is-hot'))
  cta.addEventListener('blur', () => hx.classList.remove('is-hot'))
  const draw = () => requestAnimationFrame(() => requestAnimationFrame(() => hx.classList.add('is-drawn')))
  if (reduce) { hx.classList.add('no-tr', 'is-drawn'); return }
  if (document.documentElement.classList.contains('pre-on')) addEventListener('pre:done', draw, { once: true })
  else draw()
}
