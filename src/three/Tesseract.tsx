import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { beamFragment, beamVertex } from './shaders/beam'
import { cameraAt, lineCurve, pToA, STATIONS } from './journey'
import { screenPlacement } from './Screens'
import { projects } from '../content'
import { ambient } from '../lib/audio'
import { journeyProgress } from '../lib/store'

/**
 * The tesseract, built the way the film builds it: an endless lattice of cubic
 * rooms whose structure is thick beams covered in extruded "bookshelf" stripes
 * and warm light rails. Every beam is one instance of a unit box; the whole
 * lattice is a single draw call. Beams that would cross the red line or a
 * project screen are left out so the path is always clear.
 */

const C = 6 // room size
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
  const T = 0.58 // edge beam thickness
  const T2 = 0.26 // inner beam thickness
  const beams: Beam[] = []

  // keep-out volumes: the red line and the screens
  const linePts = lineCurve.getSpacedPoints(400)
  const keepOut: { p: THREE.Vector3; r: number }[] = linePts.map((p) => ({ p: p.clone().add(new THREE.Vector3(0, 0.6, 0)), r: 1.9 }))
  for (let i = 0; i <= 400; i++) keepOut.push({ p: cameraAt(i / 400, new THREE.Vector3()), r: 1.8 })
  projects.forEach((_, i) => keepOut.push({ p: screenPlacement(i).position, r: 3.4 }))
  const samples = new THREE.Vector3()
  const blocked = (b: Beam) => {
    const n = Math.max(2, Math.ceil(b.len / 1.2))
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

  // ── inner shelves: thinner beams across the faces, like the film's subdivided walls ──
  if (!light) {
    const sub = [1 / 3, 2 / 3]
    // on x-facing walls (planes x = const): beams along z at fractional y, and along y at fractional z
    for (const x of xs)
      for (let j = 0; j < ys.length - 1; j++)
        for (let k = 0; k < zs.length - 1; k++) {
          const r = rng()
          if (r < 0.45) {
            for (const s of sub) add({ x, y: ys[j] + s * C, z: (zs[k] + zs[k + 1]) / 2, axis: 2, len: C, t: T2 })
          } else if (r < 0.7) {
            for (const s of sub) add({ x, y: (ys[j] + ys[j + 1]) / 2, z: zs[k] - s * C, axis: 1, len: C, t: T2 })
          }
        }
    // on y-facing walls (planes y = const)
    for (const y of ys)
      for (let i = 0; i < xs.length - 1; i++)
        for (let k = 0; k < zs.length - 1; k++) {
          const r = rng()
          if (r < 0.45) {
            for (const s of sub) add({ x: xs[i] + s * C, y, z: (zs[k] + zs[k + 1]) / 2, axis: 2, len: C, t: T2 })
          } else if (r < 0.7) {
            for (const s of sub) add({ x: (xs[i] + xs[i + 1]) / 2, y, z: zs[k] - s * C, axis: 0, len: C, t: T2 })
          }
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
        uCam: { value: new THREE.Vector3() },
        uFogNear: { value: 8 },
        uFogFar: { value: light ? 70 : 105 },
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
    // the shader works in world space (vWorld); the lattice group is offset, so convert the impact z once per frame
    mesh.getWorldPosition(world)
    u.uCam.value.copy(state.camera.position)
    u.uRedZ.value = impactZ + world.z
    const dz = Math.abs(state.camera.position.z - (impactZ + world.z))
    u.uRedMix.value = 1 - Math.min(dz / 32, 1)
    // the rails burn brighter as the exit approaches
    const a = pToA(journeyProgress())
    u.uGlow.value = 1.15 + Math.max(0, (a - 0.86) / 0.14) * 2.0
  })

  return <primitive object={mesh} visible={visible} />
}
