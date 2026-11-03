import { scroll } from '../lib/store'

export type SceneKey = { x: number; y: number; s: number; amp: number; freq: number }

/** Blob state per section (x/y are -1..1 fractions of the viewport). */
export const KEYS: Record<string, SceneKey> = {
  hero: { x: 0.6, y: -0.04, s: 0.95, amp: 0.3, freq: 1.1 },
  about: { x: 0.7, y: 0.05, s: 0.66, amp: 0.4, freq: 1.35 },
  services: { x: 0.8, y: 0.6, s: 0.5, amp: 0.22, freq: 2.2 },
  work: { x: -0.74, y: 0.55, s: 0.4, amp: 0.2, freq: 1.0 },
  process: { x: 0.9, y: 0.76, s: 0.3, amp: 0.45, freq: 1.3 },
  contact: { x: 0.6, y: 0.3, s: 0.9, amp: 0.45, freq: 1.1 },
}

type Frame = { at: number; key: SceneKey }

export const sceneTarget = { current: { ...KEYS.hero } }

let frames: Frame[] = []

if (import.meta.env.DEV) {
  ;(window as unknown as { __scene: unknown }).__scene = {
    get frames() {
      return frames
    },
    sceneTarget,
  }
}

/**
 * Measure [data-scene] sections and build scroll keyframes.
 * Each section "settles" once its top reaches 35% of the viewport and holds
 * its state until the next section is 95% of a viewport away, so the blob
 * rests during a section and only travels in the gap between two sections.
 */
export function measureScene() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'))
  const vh = window.innerHeight
  const sections = els
    .map((el) => ({ key: KEYS[el.dataset.scene ?? ''], top: el.getBoundingClientRect().top + window.scrollY }))
    .filter((s) => s.key)
    .sort((a, b) => a.top - b.top)
  const list: Frame[] = []
  sections.forEach((s, i) => {
    const settle = i === 0 ? 0 : Math.max(0, s.top - vh * 0.35)
    list.push({ at: settle, key: s.key })
    const next = sections[i + 1]
    if (next) list.push({ at: Math.max(settle + 1, next.top - vh * 0.95), key: s.key })
  })
  frames = list
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/** Update sceneTarget from the current scroll position. Call every frame. */
export function updateSceneTarget() {
  if (!frames.length) return
  const y = scroll.y
  let i = 0
  while (i < frames.length - 1 && y >= frames[i + 1].at) i++
  const a = frames[i]
  const b = frames[Math.min(i + 1, frames.length - 1)]
  const span = Math.max(b.at - a.at, 1)
  const p = a === b ? 1 : smooth(Math.min(Math.max((y - a.at) / span, 0), 1))
  const out = sceneTarget.current
  out.x = a.key.x + (b.key.x - a.key.x) * p
  out.y = a.key.y + (b.key.y - a.key.y) * p
  out.s = a.key.s + (b.key.s - a.key.s) * p
  out.amp = a.key.amp + (b.key.amp - a.key.amp) * p
  out.freq = a.key.freq + (b.key.freq - a.key.freq) * p
}
