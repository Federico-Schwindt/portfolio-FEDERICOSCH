import { gsap, SplitText } from './gsap'

type Opts = {
  start?: string
  delay?: number
  stagger?: number
  immediate?: boolean
  duration?: number
}

/** True while scripts/prerender.mjs snapshots the page: skip splitting so crawlers get whole words. */
const PRERENDER = typeof window !== 'undefined' && Boolean((window as unknown as { __PRERENDER__?: boolean }).__PRERENDER__)
const stub = (el: HTMLElement) => {
  el.style.visibility = 'visible'
  return { revert() {} } as unknown as ReturnType<typeof SplitText.create>
}

const trigger = (el: Element, opts: Opts, start: string) =>
  opts.immediate ? undefined : { trigger: el, start: opts.start ?? start, once: true }

/** Line-by-line masked reveal. Returns the SplitText instance (call .revert() on cleanup). */
export function revealLines(el: HTMLElement, opts: Opts = {}) {
  if (PRERENDER) return stub(el)
  return SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    linesClass: 'split-line',
    onSplit: (self) => {
      el.style.visibility = 'visible'
      return gsap.from(self.lines, {
        yPercent: 110,
        duration: opts.duration ?? 1.2,
        ease: 'power4.out',
        stagger: opts.stagger ?? 0.09,
        delay: opts.delay ?? 0,
        scrollTrigger: trigger(el, opts, 'top 88%'),
      })
    },
  })
}

/** Character reveal with a subtle rotation, masked per line. */
export function revealChars(el: HTMLElement, opts: Opts = {}) {
  if (PRERENDER) return stub(el)
  return SplitText.create(el, {
    type: 'chars,lines',
    mask: 'lines',
    autoSplit: true,
    charsClass: 'split-char',
    onSplit: (self) => {
      el.style.visibility = 'visible'
      return gsap.from(self.chars, {
        yPercent: 120,
        rotate: 5,
        duration: opts.duration ?? 1.3,
        ease: 'power4.out',
        stagger: { each: opts.stagger ?? 0.03, from: 'start' },
        delay: opts.delay ?? 0,
        scrollTrigger: trigger(el, opts, 'top 85%'),
      })
    },
  })
}

export function fadeUp(
  targets: gsap.TweenTarget,
  opts: Opts & { trigger?: Element; y?: number } = {},
) {
  if (PRERENDER) return gsap.set(targets, { clearProps: 'opacity,transform' })
  const first = opts.trigger ?? (targets instanceof Element ? targets : undefined)
  return gsap.from(targets, {
    y: opts.y ?? 32,
    opacity: 0,
    duration: opts.duration ?? 1.1,
    stagger: opts.stagger ?? 0.1,
    delay: opts.delay ?? 0,
    ease: 'power3.out',
    scrollTrigger:
      opts.immediate || !first ? undefined : { trigger: first, start: opts.start ?? 'top 88%', once: true },
  })
}
