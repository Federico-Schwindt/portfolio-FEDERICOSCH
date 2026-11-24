/**
 * The stick man of the studio board. A small skeleton (hip, torso, neck, head, two arms and two
 * legs of two bones each). Elbows and knees are solved with two-bone inverse kinematics, so hands
 * and feet land exactly where they are told: on the rim of a letter, on top of the next one.
 *
 * Motion follows the usual rules of animation: anticipation before every jump, jumps on a gravity
 * arc with the legs tucked, a landing that absorbs and recovers, a hang that swings like a damped
 * pendulum, a wave that comes from the elbow, and a breathing, weight-shifting idle.
 * He climbs out of the hole of the "o" in "bought", hops along the letters, grabs the top of the
 * "h", pulls himself up and waves. Point at him and he waves again; click and he jumps.
 */
type P = [number, number]
type Glyph = { ch: string; x0: number; x1: number; y0: number; y1: number }
type Ease = 'io' | 'o' | 'i' | 'l'
type Pose = { t: number; hip: P; lean: number; tilt: number; lh?: P; rh?: P; lf?: P; rf?: P; face: number; clip?: number; ease?: Ease; arc?: number; hang?: boolean }
type Full = { t: number; hip: P; lean: number; tilt: number; lh: P; rh: P; lf: P; rf: P; face: number; clip: number; ease: Ease; arc: number; hang: boolean }
type Now = Full & { air: number }

const TH = 16, SH = 16, TORSO = 25, UP = 14, FORE = 14, NECK = 5, HEAD = 9
const STAND = TH + SH - 1
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lp = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
const E: Record<Ease, (t: number) => number> = { io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2), o: (t) => 1 - (1 - t) ** 3, i: (t) => t * t * t, l: (t) => t }

const ik = (a: P, t: P, l1: number, l2: number, pick: (c1: P, c2: P) => P): [P, P] => {
  const dx = t[0] - a[0], dy = t[1] - a[1], d0 = Math.hypot(dx, dy) || 0.001
  const d = Math.min(d0, l1 + l2 - 0.01), ang = Math.atan2(dy, dx)
  const tip: P = [a[0] + (dx / d0) * d, a[1] + (dy / d0) * d]
  const off = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))))
  const c1: P = [a[0] + Math.cos(ang + off) * l1, a[1] + Math.sin(ang + off) * l1]
  const c2: P = [a[0] + Math.cos(ang - off) * l1, a[1] + Math.sin(ang - off) * l1]
  return [pick(c1, c2), tip]
}
const down = (phi: number): P => [Math.sin(phi), Math.cos(phi)] // a direction, as an angle from straight down

export function createStickMan(svg: SVGSVGElement, lines: { text: string; glyphs: Glyph[] }[], reduce: boolean) {
  const man = svg.querySelector<SVGGElement>('[data-man]')!
  const bone = (n: string) => man.querySelector<SVGElement>(`[data-bone="${n}"]`)!
  const B = { lleg: bone('lleg'), rleg: bone('rleg'), body: bone('body'), larm: bone('larm'), rarm: bone('rarm'), head: bone('head') }
  const say = svg.querySelector<SVGGElement>('[data-say]')!
  const clipTop = svg.querySelector('[data-clip-top]')!, clipHole = svg.querySelector('[data-clip-hole]')!

  const l4 = lines[3].glyphs
  const find = (ch: string) => l4.find((g) => g.ch === ch)!
  const [o, u, g, h] = (svg.dataset.man || 'o,u,g,h').split(',').map(find)
  const cx = (q: Glyph) => (q.x0 + q.x1) / 2
  const oc = cx(o), uc = cx(u), gc = cx(g), hc = cx(h) + 2
  const oT = o.y0, uT = u.y0, gT = g.y0, hT = h.y0
  clipTop.setAttribute('height', String(oT + 1))
  clipHole.setAttribute('cx', String(oc)); clipHole.setAttribute('cy', String((o.y0 + o.y1) / 2))
  clipHole.setAttribute('rx', String((o.x1 - o.x0) * 0.26)); clipHole.setAttribute('ry', String((o.y1 - o.y0) * 0.3))

  const shoulderOf = (hip: P, lean: number): P => [hip[0] + Math.sin(lean) * (TORSO - 3), hip[1] - Math.cos(lean) * (TORSO - 3)]
  const rest = (hip: P, lean: number, side: number): P => { const s = shoulderOf(hip, lean); return [s[0] + side * 6, s[1] + UP + FORE - 3] }
  const stand = (hip: P, side: number): P => [hip[0] + side * 6, hip[1] + STAND]
  const back = (hip: P, lean: number, side: number): P => { const s = shoulderOf(hip, lean); return [s[0] - 13 + side * 3, s[1] + 16] } // arms swung back, before a jump
  const reach = (hip: P, lean: number, side: number): P => { const s = shoulderOf(hip, lean); return [s[0] + 10 + side * 3, s[1] - 14] } // arms up and forward
  const full = (p: Pose): Full => ({
    t: p.t, hip: p.hip, lean: p.lean, tilt: p.tilt, face: p.face, clip: p.clip ?? 0, ease: p.ease ?? 'io', arc: p.arc ?? 0, hang: !!p.hang,
    lh: p.lh ?? rest(p.hip, p.lean, -1), rh: p.rh ?? rest(p.hip, p.lean, 1), lf: p.lf ?? stand(p.hip, -1), rf: p.rf ?? stand(p.hip, 1),
  })
  const rim = (k: number): P => [lerp(o.x0, o.x1, k), oT + 1]
  const on = (x: number, top: number): { lf: P; rf: P } => ({ lf: [x - 6, top], rf: [x + 6, top] })
  const crouchAt = (x: number, top: number, d = 9): Pose => { const hip: P = [x + 2, top - STAND + d]; return { t: 0, hip, lean: 0.28, tilt: 0.12, face: 1, ...on(x, top), lh: back(hip, 0.28, -1), rh: back(hip, 0.28, 1) } }
  const landAt = (x: number, top: number): Pose => { const hip: P = [x, top - STAND + 11]; return { t: 0, hip, lean: 0.22, tilt: 0.1, face: 1, ...on(x, top), lh: reach(hip, 0.22, -1), rh: reach(hip, 0.22, 1) } }
  const GL: P = [h.x0 + 1, hT + 2], GR: P = [h.x0 + 8, hT + 1], PIV: P = [(GL[0] + GR[0]) / 2, hT + 2]
  const REST = -0.4 // hanging, his body rests against the left side of the h instead of covering it
  const RH = UP + FORE - 2 + TORSO - 3 // from the grip to the hip, while hanging
  const hangHip: P = [PIV[0] + Math.sin(REST) * RH, PIV[1] + Math.cos(REST) * RH]

  const K: Full[] = ([
    { t: 0, hip: [oc, oT + 82], lean: 0, tilt: 0, face: 1, clip: 1, lh: [oc - 6, oT + 76], rh: [oc + 6, oT + 76] },
    { t: 0.55, hip: [oc, oT + 54], lean: 0, tilt: 0, face: 1, clip: 1, lh: rim(0.28), rh: rim(0.72), lf: [oc - 5, oT + 84], rf: [oc + 5, oT + 84], ease: 'o' }, // the hands come out first
    { t: 1.05, hip: [oc, oT + 38], lean: 0, tilt: 0, face: 1, clip: 1, lh: rim(0.28), rh: rim(0.72), lf: [oc - 5, oT + 70], rf: [oc + 5, oT + 70], ease: 'o' }, // then the head
    { t: 1.45, hip: [oc - 1, oT + 37], lean: -0.05, tilt: -0.42, face: -1, clip: 1, lh: rim(0.28), rh: rim(0.72), lf: [oc - 5, oT + 70], rf: [oc + 5, oT + 70] },
    { t: 1.95, hip: [oc + 1, oT + 37], lean: 0.05, tilt: 0.42, face: 1, clip: 1, lh: rim(0.28), rh: rim(0.72), lf: [oc - 5, oT + 70], rf: [oc + 5, oT + 70] },
    { t: 2.2, hip: [oc, oT + 44], lean: 0, tilt: 0.05, face: 1, clip: 1, lh: rim(0.28), rh: rim(0.72), lf: [oc - 5, oT + 76], rf: [oc + 5, oT + 76] }, // dips before the pull
    { t: 2.6, hip: [oc, oT + 4], lean: 0.12, tilt: 0, face: 1, clip: 1, lh: rim(0.25), rh: rim(0.75), lf: [oc - 5, oT + 32], rf: [oc + 4, oT + 20], ease: 'o' },
    { t: 2.95, hip: [oc, oT - STAND + 6], lean: 0.08, tilt: 0, face: 1, clip: 0, ...on(oc, oT) },
    { t: 3.2, hip: [oc, oT - STAND], lean: 0, tilt: 0, face: 1, ...on(oc, oT) },
    { ...crouchAt(oc, oT), t: 3.5 },
    { ...landAt(uc, uT), t: 3.88, arc: 46, ease: 'l' },
    { t: 4.05, hip: [uc, uT - STAND + 3], lean: 0.08, tilt: 0, face: 1, ...on(uc, uT), ease: 'o' },
    { ...crouchAt(uc, uT), t: 4.28 },
    { ...landAt(gc, gT), t: 4.64, arc: 44, ease: 'l' },
    { t: 4.85, hip: [gc, gT - STAND], lean: 0, tilt: 0, face: 1, ...on(gc, gT), ease: 'o' },
    { t: 5.25, hip: [gc - 1, gT - STAND], lean: -0.1, tilt: -0.55, face: 1, rh: [gc + 8, gT - STAND - 41], ...on(gc, gT) }, // looks up at the h, a hand over the eyes
    { t: 5.6, hip: [gc - 1, gT - STAND], lean: -0.1, tilt: -0.55, face: 1, rh: [gc + 8, gT - STAND - 41], ...on(gc, gT) },
    { ...crouchAt(gc, gT, 12), t: 5.92 },
    { t: 6.3, hip: hangHip, lean: 0, tilt: -0.1, face: 1, lh: GL, rh: GR, lf: [hangHip[0] - 4, hangHip[1] + 30], rf: [hangHip[0] + 4, hangHip[1] + 30], arc: 26, ease: 'l', hang: true }, // grabs the top of the h
    { t: 7.25, hip: hangHip, lean: 0, tilt: 0, face: 1, lh: GL, rh: GR, lf: [hangHip[0] - 4, hangHip[1] + 30], rf: [hangHip[0] + 4, hangHip[1] + 30] },
    { t: 7.7, hip: [h.x0 + 3, hT - 2], lean: 0.36, tilt: 0.1, face: 1, lh: [h.x0 + 3, hT], rh: [h.x0 + 13, hT], lf: [h.x0 + 5, hT - 1], rf: [h.x0 - 6, hT + 20], ease: 'o' }, // pulls himself up, a knee on the ledge
    { t: 8.1, hip: [hc, hT - STAND + 4], lean: 0.05, tilt: 0, face: 1, ...on(hc, hT) },
    { t: 8.35, hip: [hc, hT - STAND], lean: 0, tilt: 0, face: 0, ...on(hc, hT) },
  ] as Pose[]).map(full)
  const END = K[K.length - 1].t
  const ground: P = [hc, hT]

  let t0 = 0, playing = false, wave = 0, waveUntil = 0, jumpAt = -9, raf = 0, shown = false, headLag = 0
  let lastHead: P | null = null
  const at = (t: number): Now => {
    if (t <= 0) return { ...K[0], air: 0 }
    if (t >= END) return { ...K[K.length - 1], air: 0 }
    let i = 0
    while (i < K.length - 2 && t > K[i + 1].t) i++
    const a = K[i], b = K[i + 1]
    const lin = (t - a.t) / (b.t - a.t), k = E[b.ease](lin)
    if (a.hang) { // the hang: a damped pendulum under the grip, the legs a beat behind
      const tau = t - a.t, sw = (x: number) => -Math.abs(0.3 * Math.exp(-x / 0.4) * Math.sin(x * 7.5 + 1.2)), th = REST + sw(tau), tl = REST + sw(Math.max(0, tau - 0.07)) * 1.25 // swings out to the left and settles against the letter
      const hip: P = [PIV[0] + Math.sin(th) * RH, PIV[1] + Math.cos(th) * RH]
      return { ...a, t, hip, lean: -th, tilt: -th * 0.5, lf: [hip[0] + Math.sin(tl) * 30 - 4, hip[1] + Math.cos(tl) * 30], rf: [hip[0] + Math.sin(tl) * 30 + 4, hip[1] + Math.cos(tl) * 30], air: 0 }
    }
    let hip = lp(a.hip, b.hip, k), lf = lp(a.lf, b.lf, k), rf = lp(a.rf, b.rf, k), lh = lp(a.lh, b.lh, E.o(lin)), rh = lp(a.rh, b.rh, E.o(lin)), air = 0
    if (b.arc) { // a jump: across at an even speed, up and down on gravity, legs tucked at the top, arms up
      air = Math.sin(lin * Math.PI)
      hip = [lerp(a.hip[0], b.hip[0], lin), lerp(a.hip[1], b.hip[1], lin) - b.arc * 4 * lin * (1 - lin)]
      lf = lp(lp(a.lf, b.lf, lin), [hip[0] - 5, hip[1] + 17], air * 0.85)
      rf = lp(lp(a.rf, b.rf, lin), [hip[0] + 6, hip[1] + 19], air * 0.85)
      if (!b.hang) { const s = shoulderOf(hip, lerp(a.lean, b.lean, lin)); lh = lp(lh, [s[0] + 6, s[1] - 17], air); rh = lp(rh, [s[0] + 13, s[1] - 13], air) }
    }
    return { t, hip, lean: lerp(a.lean, b.lean, k), tilt: lerp(a.tilt, b.tilt, k), face: lin < 0.5 ? a.face : b.face, clip: lin < 0.98 ? a.clip : b.clip, lh, rh, lf, rf, ease: b.ease, arc: b.arc, hang: false, air }
  }

  const pts = (pp: P[]) => `M${pp.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L')}`
  const render = (p: Now, now: number) => {
    const s = now / 1000, after = p.t >= END, w = wave
    let hip: P = [...p.hip] as P
    let lean = p.lean
    // a click: crouch, jump, land
    const jt = (now - jumpAt) / 1000
    const prep = jt >= 0 && jt < 0.14 ? Math.sin((jt / 0.14) * Math.PI) * 7 : 0
    const fly = jt >= 0.1 && jt < 0.66 ? Math.sin(((jt - 0.1) / 0.56) * Math.PI) * 38 : 0
    const land = jt >= 0.66 && jt < 0.82 ? Math.sin(((jt - 0.66) / 0.16) * Math.PI) * 6 : 0
    if (after) { // breathing and a slow shift of weight
      hip = [hip[0] + Math.sin(s * 0.7) * 1.2 * (1 - w), hip[1] + Math.sin(s * 1.9) * 0.8 + prep + land - fly]
      lean += Math.sin(s * 0.7) * 0.02 + Math.sin(s * 5.5) * 0.035 * w
    }
    const sh = shoulderOf(hip, lean)
    const neck: P = [hip[0] + Math.sin(lean) * TORSO, hip[1] - Math.cos(lean) * TORSO]
    // the head follows the body a beat late
    const tiltT = p.tilt + (after ? Math.sin(s * 0.45) * 0.12 * (1 - w) + 0.18 * w : 0) + p.air * 0.15
    headLag += (tiltT - headLag) * 0.18
    const hl = lean + headLag * 0.6
    const head: P = [neck[0] + Math.sin(hl) * (NECK + HEAD), neck[1] - Math.cos(hl) * (NECK + HEAD)]
    let lh = p.lh, rh = p.rh, lf = p.lf, rf = p.rf
    if (after) {
      lf = [ground[0] - 6, ground[1] - fly]; rf = [ground[0] + 6, ground[1] - fly]
      if (fly > 4) { lf = lp(lf, [hip[0] - 5, hip[1] + 18], 0.5); rf = lp(rf, [hip[0] + 6, hip[1] + 19], 0.5); lh = [sh[0] - 12, sh[1] - 15]; rh = [sh[0] + 12, sh[1] - 15] }
      else if (prep > 0) { lh = back(hip, lean, -1); rh = back(hip, lean, 1) }
    }
    const face = p.face || 1
    const elbowDown = (c1: P, c2: P) => (c1[1] > c2[1] ? c1 : c2)
    const kneeFwd = (c1: P, c2: P) => ((c1[0] - hip[0]) * face > (c2[0] - hip[0]) * face ? c1 : c2)
    let [le, lhh] = ik(sh, lh, UP, FORE, elbowDown)
    let [re, rhh] = ik(sh, rh, UP, FORE, elbowDown)
    if (w > 0) { // the wave: the upper arm up and out, the forearm swinging from the elbow; the other hand on the hip
      const phiU = 2.25 + Math.sin(s * 5.5) * 0.06, phiF = phiU + 0.5 + Math.sin(s * 11) * 0.5
      const e: P = [sh[0] + down(phiU)[0] * UP, sh[1] + down(phiU)[1] * UP]
      const hnd: P = [e[0] + down(phiF)[0] * FORE, e[1] + down(phiF)[1] * FORE]
      re = lp(re, e, w); rhh = lp(rhh, hnd, w)
      const [le2, lh2] = ik(sh, [hip[0] - 9, hip[1] - 3], UP, FORE, (c1, c2) => (c1[0] < c2[0] ? c1 : c2))
      le = lp(le, le2, w); lhh = lp(lhh, lh2, w)
    }
    const [lk, lff] = ik(hip, lf, TH, SH, kneeFwd)
    const [rk, rff] = ik(hip, rf, TH, SH, kneeFwd)
    B.lleg.setAttribute('d', pts([hip, lk, lff])); B.rleg.setAttribute('d', pts([hip, rk, rff]))
    B.body.setAttribute('d', pts([hip, neck])); B.larm.setAttribute('d', pts([sh, le, lhh])); B.rarm.setAttribute('d', pts([sh, re, rhh]))
    B.head.setAttribute('cx', head[0].toFixed(2)); B.head.setAttribute('cy', head[1].toFixed(2))
    if (p.clip) man.setAttribute('clip-path', 'url(#sb-out)'); else man.removeAttribute('clip-path')
    say.setAttribute('transform', `translate(${(head[0] + 26).toFixed(1)} ${(head[1] - 34).toFixed(1)})`)
    say.classList.toggle('is-on', w > 0.6)
    lastHead = head
  }
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick)
    const t = playing ? (now - t0) / 1000 : 0
    if (t >= END && !waveUntil) waveUntil = now + 2800
    const target = t >= END && now < waveUntil ? 1 : 0
    wave += (target - wave) * (target ? 0.09 : 0.06)
    render(at(t), now)
  }
  return {
    play: () => { if (playing) return; playing = true; shown = true; man.classList.add('is-on'); t0 = performance.now() - (reduce ? END * 1000 : 0); waveUntil = 0; if (!raf) raf = requestAnimationFrame(tick) },
    reset: () => { playing = false; shown = false; man.classList.remove('is-on'); say.classList.remove('is-on'); wave = 0 },
    hello: () => { const n = performance.now(); if (playing && (n - t0) / 1000 >= END && n > waveUntil - 600) waveUntil = n + 2200 },
    jump: () => { const n = performance.now(); if (playing && (n - t0) / 1000 >= END && n - jumpAt > 900) jumpAt = n },
    head: (): P | null => (shown ? lastHead : null),
  }
}
