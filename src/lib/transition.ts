/**
 * Page transition controller: a black wipe that covers the screen before a
 * route change and reveals the new page after it mounts.
 */
import { gsap } from './gsap'

type Navigate = (to: string) => void

let overlay: HTMLElement | null = null
let navigate: Navigate | null = null
let busy = false

export function registerTransition(el: HTMLElement, nav: Navigate) {
  overlay = el
  navigate = nav
}

export function transitionTo(to: string, opts: { delay?: number } = {}) {
  if (!overlay || !navigate || busy) {
    navigate?.(to)
    return
  }
  busy = true
  const el = overlay
  gsap
    .timeline({
      onComplete: () => {
        busy = false
      },
    })
    .set(el, { visibility: 'visible', pointerEvents: 'auto' })
    .fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.6, ease: 'power4.inOut', delay: opts.delay ?? 0 })
    .add(() => navigate?.(to))
    .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'power4.inOut', delay: 0.25 })
    .set(el, { visibility: 'hidden', pointerEvents: 'none', clipPath: 'inset(100% 0 0 0)' })
}
