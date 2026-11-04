import { useEffect, useRef, useState, type ReactNode } from 'react'
import { about, packages, pricingNote, projects, site, xp } from '../content'
import { useStore } from '../lib/store'
import { transitionTo } from '../lib/transition'

const base = import.meta.env.BASE_URL

type Win = { id: string; title: string; x: number; y: number; w: number; h: number; z: number }

const SIZES: Record<string, [number, number]> = {
  pricing: [760, 560],
  projects: [560, 480],
  about: [520, 380],
  results: [540, 320],
  photo: [420, 520],
  contact: [520, 300],
}

/**
 * At the start of the XP section the camera fits the 1280×960 desktop to the
 * viewport's shorter axis, so part of it is cropped (the top and bottom strips
 * on a 16:9 screen, the sides on a phone) and the fixed nav covers the top
 * 48px. Windows and icons are kept inside the part that is actually visible.
 * Mirrors the camera maths in three/Retro.tsx (SCREEN 3.2×2.4 units, 400 px/unit, 0.985 fit).
 */
function safeArea() {
  const vw = window.innerWidth || 1280
  const vh = window.innerHeight || 960
  const a = vw / vh
  const visH = Math.min(1280 / a, 960) * 0.985
  const visW = Math.min(1280, 960 * a) * 0.985
  const scale = vh / visH // viewport px per desktop px
  const x = Math.max(0, (1280 - visW) / 2)
  const cutY = Math.max(0, (960 - visH) / 2)
  return { x, top: cutY + 56 / scale, bottom: cutY, visW, visH }
}

function place(id: string, n: number, safe: ReturnType<typeof safeArea>): Omit<Win, 'id' | 'title' | 'z'> {
  const [w0, h0] = SIZES[id]
  const w = Math.min(w0, safe.visW - 32)
  const h = Math.min(h0, 960 - safe.top - safe.bottom - 24)
  const x = safe.x + (safe.visW <= 640 ? 16 : 36 + n * 26)
  const y = safe.top + (safe.visW <= 640 ? 12 : 18 + n * 22)
  return { x, y, w, h }
}

function initialWins(): Win[] {
  return [{ id: 'pricing', title: 'Pricing.html', z: 1, ...place('pricing', 0, safeArea()) }]
}

function Icon({ kind }: { kind: string }) {
  if (kind === 'folder')
    return (
      <svg viewBox="0 0 48 40" width="44" height="38">
        <path d="M2 8h16l4 4h24v24H2z" fill="#7db6ff" />
        <path d="M2 14h44v22H2z" fill="#a9cfff" />
      </svg>
    )
  if (kind === 'png')
    return (
      <span className="dt__thumb">
        <img src={base + 'char/portrait.jpg'} alt="" />
      </span>
    )
  if (kind === 'exe')
    return (
      <svg viewBox="0 0 44 44" width="40" height="40">
        <rect x="4" y="4" width="36" height="36" rx="6" fill="#e11d2e" />
        <path d="M14 23l6 6 10-12" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </svg>
    )
  return (
    <svg viewBox="0 0 40 48" width="36" height="42">
      <path d="M4 2h22l10 10v34H4z" fill="#fff" stroke="#c9d2de" />
      <path d="M26 2v10h10" fill="#e6ecf4" stroke="#c9d2de" />
      <text x="20" y="34" textAnchor="middle" fontSize="9" fontFamily="Space Mono, monospace" fill="#4a5568">
        {kind.toUpperCase()}
      </text>
    </svg>
  )
}

function Pricing() {
  return (
    <div className="dt__page">
      <p className="dt__pill">Packages</p>
      <div className="dt__cards">
        {packages.map((p) => (
          <article className="pkg pkg--sm" key={p.code}>
            <div className="pkg__top">
              <h4>{p.name}</h4>
              <p>{p.text}</p>
              <ul>
                {p.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
            <div className="pkg__tear" />
            <div className="pkg__bottom">
              <div className="pkg__price">
                <span>Price starts at:</span>
                <strong>{p.price}</strong>
              </div>
              <div className="pkg__barcode" aria-hidden="true" />
              <span className="pkg__stamp">{p.stamp}</span>
            </div>
          </article>
        ))}
      </div>
      <p className="dt__note">
        <em>{pricingNote.lead}</em> {pricingNote.text}
      </p>
    </div>
  )
}

function Projects() {
  return (
    <div className="dt__page dt__page--list">
      {projects.map((p) => (
        <button key={p.slug} className="dt__row" onClick={() => transitionTo('/work/' + p.slug)}>
          <img src={base + p.cover} alt="" />
          <span>
            <strong>{p.title}</strong>
            <small>{p.tags} · {p.year}</small>
          </span>
          <i>Open →</i>
        </button>
      ))}
    </div>
  )
}

function AboutTxt() {
  return (
    <div className="dt__page dt__page--txt">
      <p>{about.intro}</p>
      {about.bio.map((b) => (
        <p key={b.slice(0, 12)}>{b}</p>
      ))}
      <p>— {site.name}, {site.city}</p>
    </div>
  )
}

function Results() {
  const rows = [
    ['Metric', 'Value', 'Source'],
    ['Sales growth (UDS)', '+551%', '2024 → 2026'],
    ['Parts in catalog', '6,821', 'dev.udshafts.com'],
    ['Driveshafts in finder', '4,433', 'dev.udshafts.com'],
    ['Projects delivered', '13', 'Freelancer.com'],
    ['Client rating', '5.0 / 5', 'Freelancer.com'],
    ['On time · on budget', '100%', 'Freelancer.com'],
  ]
  return (
    <div className="dt__page dt__page--xls">
      <table>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Photo() {
  return (
    <div className="dt__page dt__page--photo">
      <img src={base + 'char/portrait.jpg'} alt={site.name} />
    </div>
  )
}

function ContactExe() {
  return (
    <div className="dt__page dt__page--exe">
      <p>C:\Users\Federico&gt; run contact.exe</p>
      <p>Initialising…  OK</p>
      <p>Opening channel to {site.email}…  OK</p>
      <p>
        <a href={`mailto:${site.email}`}>▶ Send an email</a>
      </p>
      <p>
        <button onClick={() => transitionTo('/contact')}>▶ Open the contact page</button>
      </p>
      <p className="dt__blink">_</p>
    </div>
  )
}

const BODIES: Record<string, () => ReactNode> = {
  pricing: Pricing,
  projects: Projects,
  about: AboutTxt,
  results: Results,
  photo: Photo,
  contact: ContactExe,
}


/** A small, real "desktop": draggable windows, icons, a clock. Lives on the CRT. */
export function Desktop() {
  const [wins, setWins] = useState<Win[]>(initialWins)
  const [safe, setSafe] = useState(safeArea)
  const [time, setTime] = useState('')
  const zTop = useRef(2)
  const root = useRef<HTMLDivElement>(null)
  const setHoverView = useStore((s) => s.setHoverView)

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: site.timeZone, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = window.setInterval(tick, 15000)
    const onResize = () => setSafe(safeArea())
    window.addEventListener('resize', onResize)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const open = (id: string) => {
    const icon = xp.icons.find((i) => i.id === id)!
    setWins((ws) => {
      const z = ++zTop.current
      const existing = ws.find((w) => w.id === id)
      if (existing) return ws.map((w) => (w.id === id ? { ...w, z } : w))
      return [...ws, { id, title: icon.label, z, ...place(id, ws.length, safe) }]
    })
  }
  const close = (id: string) => setWins((ws) => ws.filter((w) => w.id !== id))
  const focus = (id: string) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z: ++zTop.current } : w)))

  const drag = (e: React.PointerEvent, id: string) => {
    const win = wins.find((w) => w.id === id)
    if (!win) return
    focus(id)
    const sx = e.clientX
    const sy = e.clientY
    const ox = win.x
    const oy = win.y
    const bounds = root.current!.getBoundingClientRect()
    const scale = bounds.width / root.current!.offsetWidth
    const move = (ev: PointerEvent) => {
      const nx = ox + (ev.clientX - sx) / scale
      const ny = oy + (ev.clientY - sy) / scale
      setWins((ws) => ws.map((w) => (w.id === id ? { ...w, x: Math.max(-w.w * 0.6, nx), y: Math.max(0, ny) } : w)))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      className="dt"
      ref={root}
      style={{ '--safe-x': safe.x + 'px', '--safe-top': safe.top + 'px', '--safe-bottom': safe.bottom + 'px' } as React.CSSProperties}
      onPointerEnter={() => setHoverView(true)}
      onPointerLeave={() => setHoverView(false)}
    >
      <div className="dt__wall">
        <svg viewBox="0 0 1280 960" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2f78d6" />
              <stop offset="0.55" stopColor="#7fb6ef" />
              <stop offset="1" stopColor="#c9e4fb" />
            </linearGradient>
            <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9bd24e" />
              <stop offset="0.5" stopColor="#5fa534" />
              <stop offset="1" stopColor="#2f6d22" />
            </linearGradient>
            <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="22" />
            </filter>
          </defs>
          <rect width="1280" height="960" fill="url(#sky)" />
          <g fill="#fff" opacity="0.85" filter="url(#soft)">
            <ellipse cx="260" cy="210" rx="190" ry="48" />
            <ellipse cx="420" cy="170" rx="140" ry="40" />
            <ellipse cx="900" cy="150" rx="230" ry="46" />
            <ellipse cx="1060" cy="230" rx="160" ry="36" />
            <ellipse cx="640" cy="300" rx="260" ry="34" opacity="0.6" />
          </g>
          <path d="M-40 640 C 200 520, 420 500, 640 560 S 1060 700, 1320 600 L 1320 980 L -40 980 Z" fill="url(#hill)" />
          <path d="M-40 760 C 300 700, 700 760, 1320 690 L 1320 980 L -40 980 Z" fill="#3f8a2a" opacity="0.75" />
        </svg>
      </div>
      <div className="dt__icons">
        {xp.icons.map((i) => (
          <button key={i.id} className="dt__icon" onDoubleClick={() => open(i.id)} onClick={() => open(i.id)}>
            <Icon kind={i.kind} />
            <span>{i.label}</span>
          </button>
        ))}
      </div>
      {wins.map((w) => {
        const Body = BODIES[w.id]
        return (
          <div key={w.id} className="dt__win" style={{ left: w.x, top: w.y, width: w.w, height: w.h, zIndex: w.z }} onPointerDown={() => focus(w.id)}>
            <div className="dt__bar" onPointerDown={(e) => drag(e, w.id)}>
              <span className="dt__dots">
                <i onPointerDown={(e) => e.stopPropagation()} onClick={() => close(w.id)} />
                <i />
                <i />
              </span>
              <span className="dt__title">{w.title}</span>
            </div>
            <div className="dt__body">
              <Body />
            </div>
          </div>
        )
      })}
      <div className="dt__glass" aria-hidden="true" />
      <div className="dt__tray">
        <span className="dt__sys">▮ ◉ ⌕ ◠</span>
        <span>{time}</span>
      </div>
    </div>
  )
}
