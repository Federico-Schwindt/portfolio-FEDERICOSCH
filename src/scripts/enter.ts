/**
 * Block mode helpers. In block mode (home, desktop with a mouse) nothing is driven by the scroll position:
 * every scene plays when its block arrives, announced by slides.ts with a `slide:enter` event on the section.
 */
export const slides = () => document.documentElement.classList.contains('slides')

/** run fn the first time the block holding el arrives */
export function onEnter(el: Element, fn: () => void) {
  const sec = el.closest('section, header')
  if (!sec) return
  let done = false
  sec.addEventListener('slide:enter', () => { if (!done) { done = true; fn() } })
}

/** 0 → 1 over dur ms, eased; calls back every frame */
export function play(dur: number, cb: (k: number) => void, ease: (t: number) => number = (t) => 1 - (1 - t) ** 3) {
  const t0 = performance.now()
  const step = (now: number) => { const t = Math.min(1, (now - t0) / dur); cb(ease(t)); if (t < 1) requestAnimationFrame(step) }
  requestAnimationFrame(step)
}
