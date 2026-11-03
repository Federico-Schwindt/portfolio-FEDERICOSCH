import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { journeyProgress, useStore } from '../lib/store'
import { ACT_SPLIT, FLASH, pToA } from '../three/journey'
import { chapters } from '../content'
import { ambient } from '../lib/audio'

const CHAPTER_AT = [0, 0.12, 0.27, 0.36, 0.42, 0.55, 0.86, 0.94]

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')

/**
 * Spacecraft-style telemetry over the journey: distance to the singularity,
 * velocity, chapter counter, progress rail and the white flash at the crossing.
 * All values are written straight to the DOM from the GSAP ticker.
 */
export function Hud() {
  const entered = useStore((s) => s.entered)
  const root = useRef<HTMLDivElement>(null)
  const l1 = useRef<HTMLSpanElement>(null)
  const l2 = useRef<HTMLSpanElement>(null)
  const l3 = useRef<HTMLSpanElement>(null)
  const k1 = useRef<HTMLSpanElement>(null)
  const k2 = useRef<HTMLSpanElement>(null)
  const chapter = useRef<HTMLSpanElement>(null)
  const chapterName = useRef<HTMLSpanElement>(null)
  const rail = useRef<HTMLSpanElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const dive = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!entered) return
    gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 1.4, delay: 1.2 })
    let lastChapter = -1
    let lastMode = ''
    let lastAct = 0
    const tick = () => {
      const p = journeyProgress()
      // chapter
      let i = 0
      while (i < CHAPTER_AT.length - 1 && p >= CHAPTER_AT[i + 1]) i++
      if (i !== lastChapter) {
        lastChapter = i
        if (chapter.current) chapter.current.textContent = `${String(i).padStart(2, '0')} / ${String(chapters.length - 1).padStart(2, '0')}`
        if (chapterName.current) chapterName.current.textContent = chapters[i].label
      }
      if (rail.current) rail.current.style.transform = `scaleY(${p.toFixed(4)})`

      const act = p < ACT_SPLIT ? 1 : 2
      if (act !== lastAct) {
        lastAct = act
        if (k1.current) k1.current.textContent = act === 1 ? 'Dist. to singularity' : 'Line'
        if (k2.current) k2.current.textContent = act === 1 ? 'Velocity' : 'Position'
      }
      // telemetry + score
      if (p < ACT_SPLIT) {
        const u = p / ACT_SPLIT
        const dist = 1_284_000 * Math.pow(1 - u, 1.6)
        const vel = 0.08 + Math.pow(u, 2.2) * 0.9
        if (l1.current) l1.current.textContent = `${fmt(dist)} km`
        if (l2.current) l2.current.textContent = `${vel.toFixed(3)} c`
        if (l3.current) l3.current.textContent = u > 0.75 ? 'CRITICAL' : u > 0.4 ? 'NOMINAL' : 'STABLE'
        const mode = p > 0.26 ? 'dive' : 'space'
        if (mode !== lastMode) {
          lastMode = mode
          ambient.setMode(mode)
        }
        ambient.setIntensity(0.28 + u * 0.55 + (p > 0.26 ? (p - 0.26) * 3.5 : 0))
      } else {
        const a = pToA(p)
        if (l1.current) l1.current.textContent = `${(a * 100).toFixed(1)} %`
        if (l2.current) l2.current.textContent = `-Z  ·  ${fmt(166 * a)} m`
        if (l3.current) l3.current.textContent = a > 0.9 ? 'EXIT AHEAD' : 'ON THE LINE'
        const mode = a > 0.86 ? 'end' : 'tesseract'
        if (mode !== lastMode) {
          lastMode = mode
          ambient.setMode(mode)
        }
        ambient.setIntensity(a > 0.86 ? 0.5 + (a - 0.86) * 3 : 0.3 + a * 0.3)
      }

      // flash across the cut
      if (flash.current) {
        let o = 0
        if (p > FLASH.start && p < FLASH.end) {
          o = p < FLASH.peak ? (p - FLASH.start) / (FLASH.peak - FLASH.start) : 1 - (p - FLASH.peak) / (FLASH.end - FLASH.peak)
          o = o * o
        }
        flash.current.style.opacity = o.toFixed(3)
      }
      if (dive.current) {
        const on = p > 0.265 && p < FLASH.peak
        dive.current.style.opacity = on ? '1' : '0'
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [entered])

  return (
    <>
      <div className="hud" ref={root}>
        <div className="hud__corner hud__corner--tl" />
        <div className="hud__corner hud__corner--tr" />
        <div className="hud__corner hud__corner--bl" />
        <div className="hud__corner hud__corner--br" />
        <div className="hud__tele">
          <div>
            <span className="hud__k" ref={k1}>
              Dist. to singularity
            </span>
            <span className="hud__v" ref={l1}>
              1,284,000 km
            </span>
          </div>
          <div>
            <span className="hud__k" ref={k2}>
              Velocity
            </span>
            <span className="hud__v" ref={l2}>
              0.080 c
            </span>
          </div>
          <div>
            <span className="hud__k">Status</span>
            <span className="hud__v" ref={l3}>
              STABLE
            </span>
          </div>
        </div>
        <div className="hud__chapter">
          <span className="hud__v" ref={chapter}>
            00 / 07
          </span>
          <span className="hud__k" ref={chapterName}>
            Gargantua
          </span>
        </div>
        <div className="hud__rail">
          <span ref={rail} />
        </div>
      </div>
      <div className="dive" ref={dive}>
        <span className="hud__k">Crossing the event horizon</span>
      </div>
      <div className="flash" ref={flash} />
    </>
  )
}
