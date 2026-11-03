import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Blob } from './Blob'
import { Particles } from './Particles'
import { RED } from './config'
import { pointer, useStore } from '../lib/store'
import { ambient } from '../lib/audio'

export const labParams = { current: { amp: 0.45, freq: 1.3, speed: 0.5 } }

/** Thousands of particles that form the name and scatter under the cursor. */
function ParticleText({ text }: { text: string }) {
  const { viewport } = useThree()
  const points = useRef<THREE.Points>(null)
  const data = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 256
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.fillStyle = '#fff'
    ctx.font = `800 108px 'Syne Variable', 'Syne', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text.toUpperCase(), c.width / 2, c.height / 2 + 8)
    const img = ctx.getImageData(0, 0, c.width, c.height).data
    const targets: number[] = []
    const step = 3
    for (let y = 0; y < c.height; y += step) {
      for (let x = 0; x < c.width; x += step) {
        if (img[(y * c.width + x) * 4] > 128) {
          targets.push((x / c.width - 0.5) * 7.6, -(y / c.height - 0.5) * 1.9, (Math.random() - 0.5) * 0.4)
        }
      }
    }
    const n = targets.length / 3
    const pos = new Float32Array(n * 3)
    const vel = new Float32Array(n * 3)
    for (let i = 0; i < n * 3; i++) pos[i] = (Math.random() - 0.5) * 12
    const colors = new Float32Array(n * 3)
    const red = new THREE.Color(RED)
    const white = new THREE.Color('#f2efe9')
    for (let i = 0; i < n; i++) {
      const col = Math.random() < 0.18 ? red : white
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }
    return { targets: new Float32Array(targets), pos, vel, colors, n }
  }, [text])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(data.pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(data.colors, 3))
    return g
  }, [data])

  const mouse = useRef(new THREE.Vector3())
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.04)
    const { targets, pos, vel, n } = data
    mouse.current.set((pointer.x * viewport.width) / 2, 1 + (pointer.y * viewport.height) / 2, 0)
    const mx = mouse.current.x
    const my = mouse.current.y - 1
    const pulse = ambient.pulse() * 0.6
    for (let i = 0; i < n; i++) {
      const i3 = i * 3
      const tx = targets[i3]
      const ty = targets[i3 + 1]
      const tz = targets[i3 + 2]
      let ax = (tx - pos[i3]) * 6
      let ay = (ty - pos[i3 + 1]) * 6
      let az = (tz - pos[i3 + 2]) * 6
      const dx = pos[i3] - mx
      const dy = pos[i3 + 1] - my
      const d2 = dx * dx + dy * dy
      if (d2 < 2.2) {
        const f = (2.2 - d2) * 28
        ax += dx * f
        ay += dy * f
        az += (Math.random() - 0.5) * f
      }
      if (pulse > 0.05) {
        ax += (Math.random() - 0.5) * pulse * 40
        ay += (Math.random() - 0.5) * pulse * 40
      }
      vel[i3] = (vel[i3] + ax * dt) * 0.88
      vel[i3 + 1] = (vel[i3 + 1] + ay * dt) * 0.88
      vel[i3 + 2] = (vel[i3 + 2] + az * dt) * 0.88
      pos[i3] += vel[i3] * dt * 6
      pos[i3 + 1] += vel[i3 + 1] * dt * 6
      pos[i3 + 2] += vel[i3 + 2] * dt * 6
    }
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute
    attr.needsUpdate = true
  })

  return (
    <points ref={points} geometry={geometry} position={[0, 1, 0]}>
      <pointsMaterial size={0.035} vertexColors sizeAttenuation transparent opacity={0.95} depthWrite={false} />
    </points>
  )
}

/** A ring of 64 bars driven by the generative soundtrack's spectrum. */
function Spectrum() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const N = 64
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colors = useMemo(() => {
    const arr = new Float32Array(N * 3)
    const red = new THREE.Color(RED)
    const white = new THREE.Color('#f2efe9')
    for (let i = 0; i < N; i++) {
      const c = i % 8 === 0 ? red : white
      arr[i * 3] = c.r
      arr[i * 3 + 1] = c.g
      arr[i * 3 + 2] = c.b
    }
    return arr
  }, [])
  useEffect(() => {
    mesh.current!.instanceColor = new THREE.InstancedBufferAttribute(colors, 3)
  }, [colors])
  const smooth = useRef(new Float32Array(N))
  useFrame((s, d) => {
    const spec = ambient.spectrum(N)
    const m = mesh.current!
    for (let i = 0; i < N; i++) {
      const target = 0.08 + spec[i] * 2.2 + Math.sin(s.clock.elapsedTime * 2 + i * 0.4) * 0.02
      smooth.current[i] += (target - smooth.current[i]) * Math.min(d * 12, 1)
      const a = (i / N) * Math.PI * 2
      dummy.position.set(Math.cos(a) * 2.6, 1 + smooth.current[i] / 2, Math.sin(a) * 2.6)
      dummy.scale.set(0.12, smooth.current[i], 0.12)
      dummy.rotation.set(0, -a, 0)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
    m.rotation.y += d * 0.15
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.3} metalness={0.4} emissiveIntensity={0.6} emissive="#2a0a0a" />
    </instancedMesh>
  )
}

export function LabScene({ light }: { light: boolean }) {
  const lab = useStore((s) => s.lab)
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 4, 4]} intensity={40} color="#ffffff" />
      <pointLight position={[-4, 2, 2]} intensity={30} color={RED} />
      {lab === 'particles' && <ParticleText text="Federico" />}
      {lab === 'liquid' && <Blob position={[0, 1, 0]} scale={1.7} detail={light ? 48 : 96} paramsRef={labParams} mouse />}
      {lab === 'spectrum' && <Spectrum />}
      <Particles count={light ? 200 : 500} box={[24, 14, 16]} center={[0, 2, -6]} />
    </>
  )
}
