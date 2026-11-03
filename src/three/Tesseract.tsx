import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { beamFragment, beamVertex } from './shaders/beam'
import { makeBookshelfTexture } from './books'
import { ALL_SPOTS, cameraAt, lineCurve, pToA, ROOM, STATIONS } from './journey'
import { ambient } from '../lib/audio'
import { journeyProgress } from '../lib/store'

/**
 * The tesseract, the way the film builds it: an endless lattice of rooms whose
 * walls are bookshelves extruded through time. Structural beams carry the
 * rooms; the corridor the line runs through is lined, on all four sides, with
 * dense horizontal shelf strands. Every strand and beam is one instance of a
 * unit box with a shader that paints book spines and warm light rails, so the
 * whole structure is a single draw call. Anything that would cross the red
 * line, the camera path or a wall-mounted panel is left out.
 */

const C = ROOM
const Z0 = 24
const Z1 = -206

type Beam = { x: number; y: number; z: number; axis: 0 | 1 | 2; len: number; t: number }

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function build(light: boolean) {
  const rng = mulberry32(2026)
  const NX = light ? 3 : 5
  const NY = light ? 2 : 4
  const T = 0.58
  const T2 = 0.26
  const beams: Beam[] = []

  // keep-out volumes: the red line, the camera path and every wall panel
  const keepOut: { p: THREE.Vector3; r: number }[] = lineCurve
    .getSpacedPoints(400)
    .map((p) => ({ p: p.clone().add(new THREE.Vector3(0, 0.6, 0)), r: 1.9 }))
  for (let i = 0; i <= 400; i++) keepOut.push({ p: cameraAt(i / 400, new THREE.Vector3()), r: 1.8 })
  for (const s of ALL_SPOTS) keepOut.push({ p: s.position.clone(), r: s.radius })
  const samples = new THREE.Vector3()
  const blocked = (b: Beam) => {
    const n = Math.max(2, Math.ceil(b.len / 1.0))
    for (let i = 0; i <= n; i++) {
      const s = -b.len / 2 + (i / n) * b.len
      samples.set(b.x + (b.axis === 0 ? s : 0), b.y + (b.axis === 1 ? s : 0), b.z + (b.axis === 2 ? s : 0))
      for (const k of keepOut) if (samples.distanceToSquared(k.p) < k.r * k.r) return true
    }
    return false
  }
  const add = (b: Beam) => {
    if (!blocked(b)) beams.push(b)
  }

  const xs: number[] = []
  for (let i = -NX; i <= NX + 1; i++) xs.push((i - 0.5) * C)
  const ys: number[] = []
  for (let j = -NY; j <= NY + 1; j++) ys.push((j - 0.5) * C)
  const zs: number[] = []
  for (let z = Z0; z >= Z1; z -= C) zs.push(z)

  // ── structural edges of every room ──
  for (const x of xs)
    for (const y of ys)
      for (let k = 0; k < zs.length - 1; k++) {
        if (rng() < 0.06) continue
        add({ x, y, z: (zs[k] + zs[k + 1]) / 2, axis: 2, len: C, t: T })
      }
  for (const z of zs)
    for (const y of ys)
      for (let i = 0; i < xs.length - 1; i++) {
        if (rng() < 0.06) continue
        add({ x: (xs[i] + xs[i + 1]) / 2, y, z, axis: 0, len: C, t: T })
      }
  for (const z of zs)
    for (const x of xs)
      for (let j = 0; j < ys.length - 1; j++) {
        if (rng() < 0.06) continue
        add({ x, y: (ys[j] + ys[j + 1]) / 2, z, axis: 1, len: C, t: T })
      }

  // ── the corridor: shelf strands lining the walls of the rooms around the line ──
  const N = light ? 6 : 9
  const gap = C / N
  const seen = new Set<string>()
  for (let k = 0; k < zs.length - 1; k++) {
    const zc = (zs[k] + zs[k + 1]) / 2
    const t = Math.min(Math.max((8 - zc) / 174, 0), 0.999)
    const p = lineCurve.getPointAt(t)
    const cx0 = Math.round(p.x / C) * C
    const cy0 = Math.round(p.y / C) * C
    const ring = light ? [0] : [-1, 0, 1]
    for (const dx of ring)
      for (const dy of ring) {
        const cx = cx0 + dx * C
        const cy = cy0 + dy * C
        // side walls (x = const): strands stacked in y
        for (const sx of [-1, 1]) {
          const x = cx + sx * (C / 2)
          const key = `x:${x}:${cy}:${zc}`
          if (seen.has(key)) continue
          seen.add(key)
          for (let i = 0; i < N; i++) {
            if (rng() < 0.12) continue
            const y = cy - C / 2 + (i + 0.5) * gap + (rng() - 0.5) * gap * 0.25
            add({ x, y, z: zc, axis: 2, len: C, t: gap * (0.5 + rng() * 0.3) })
          }
        }
        // floor and ceiling (y = const): strands stacked in x
        for (const sy of [-1, 1]) {
          const y = cy + sy * (C / 2)
          const key = `y:${y}:${cx}:${zc}`
          if (seen.has(key)) continue
          seen.add(key)
          for (let i = 0; i < N; i++) {
            if (rng() < 0.12) continue
            const x = cx - C / 2 + (i + 0.5) * gap + (rng() - 0.5) * gap * 0.25
            add({ x, y, z: zc, axis: 2, len: C, t: gap * (0.5 + rng() * 0.3) })
          }
        }
      }
  }

  // ── inner shelves on the outer structure (sparser) ──
  if (!light) {
    const sub = [1 / 3, 2 / 3]
    for (const x of xs)
      for (let j = 0; j < ys.length - 1; j++)
        for (let k = 0; k < zs.length - 1; k++) {
          const r = rng()
          if (r < 0.4) for (const s of sub) add({ x, y: ys[j] + s * C, z: (zs[k] + zs[k + 1]) / 2, axis: 2, len: C, t: T2 })
          else if (r < 0.6) for (const s of sub) add({ x, y: (ys[j] + ys[j + 1]) / 2, z: zs[k] - s * C, axis: 1, len: C, t: T2 })
        }
    for (const y of ys)
      for (let i = 0; i < xs.length - 1; i++)
        for (let k = 0; k < zs.length - 1; k++) {
          const r = rng()
          if (r < 0.4) for (const s of sub) add({ x: xs[i] + s * C, y, z: (zs[k] + zs[k + 1]) / 2, axis: 2, len: C, t: T2 })
          else if (r < 0.6) for (const s of sub) add({ x: (xs[i] + xs[i + 1]) / 2, y, z: zs[k] - s * C, axis: 0, len: C, t: T2 })
        }
  }
  return beams
}

export function Tesseract({ visible, light }: { visible: boolean; light: boolean }) {
  const impactZ = useMemo(() => lineCurve.getPointAt(STATIONS.impact).z, [])

  const { mesh, material } = useMemo(() => {
    const beams = build(light)
    const geo = new THREE.BoxGeometry(1, 1, 1)
    const seeds = new Float32Array(beams.length)
    const axes = new Float32Array(beams.length)
    const material = new THREE.ShaderMaterial({
      vertexShader: beamVertex,
      fragmentShader: beamFragment,
      uniforms: {
        uBooks: { value: makeBookshelfTexture() },
        uCam: { value: new THREE.Vector3() },
        uFogNear: { value: 8 },
        uFogFar: { value: light ? 64 : 96 },
        uTime: { value: 0 },
        uPulse: { value: 0 },
        uRedZ: { value: impactZ },
        uRedMix: { value: 0 },
        uGlow: { value: 1.15 },
      },
    })
    const mesh = new THREE.InstancedMesh(geo, material, beams.length)
    const dummy = new THREE.Object3D()
    beams.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z)
      if (b.axis === 0) dummy.scale.set(b.len, b.t, b.t)
      else if (b.axis === 1) dummy.scale.set(b.t, b.len, b.t)
      else dummy.scale.set(b.t, b.t, b.len)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      seeds[i] = (i * 0.618033) % 1
      axes[i] = b.axis
    })
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1))
    geo.setAttribute('aAxis', new THREE.InstancedBufferAttribute(axes, 1))
    mesh.instanceMatrix.needsUpdate = true
    mesh.frustumCulled = false
    if (import.meta.env.DEV) console.info('[tesseract] beams:', beams.length)
    return { mesh, material }
  }, [light, impactZ])

  useEffect(() => {
    return () => {
      mesh.geometry.dispose()
      material.dispose()
    }
  }, [mesh, material])

  const world = useMemo(() => new THREE.Vector3(), [])
  useFrame((state) => {
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uPulse.value = ambient.pulse()
    mesh.getWorldPosition(world)
    u.uCam.value.copy(state.camera.position)
    u.uRedZ.value = impactZ + world.z
    const dz = Math.abs(state.camera.position.z - (impactZ + world.z))
    u.uRedMix.value = 1 - Math.min(dz / 32, 1)
    const a = pToA(journeyProgress())
    u.uGlow.value = 1.15 + Math.max(0, (a - 0.86) / 0.14) * 2.0
  })

  return <primitive object={mesh} visible={visible} />
}
