import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { ASTRONAUT_HEIGHT, ASTRONAUT_MODEL, ASTRONAUT_ROTATION } from './config'
import { ASTRONAUT_END, LEAD, lineAt, pToA } from './journey'
import { journeyProgress, scroll, useStore } from '../lib/store'

const base = import.meta.env.BASE_URL

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function AstronautModel() {
  const inner = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(base + ASTRONAUT_MODEL!, base + 'draco/')
  const { actions, names } = useAnimations(animations, inner)
  const bump = useStore((s) => s.bumpModelsReady)
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const s = ASTRONAUT_HEIGHT / Math.max(size.y, 0.001)
    const c = new THREE.Vector3()
    box.getCenter(c)
    return { s, offset: new THREE.Vector3(-c.x * s, -c.y * s, -c.z * s) }
  }, [scene])
  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.frustumCulled = false
        const mat = m.material as THREE.MeshStandardMaterial
        if (mat && 'envMapIntensity' in mat) mat.envMapIntensity = 1.2
      }
    })
    const first = names[0]
    if (first && actions[first]) actions[first]!.reset().fadeIn(0.5).play()
    bump()
  }, [scene, actions, names, bump])
  return (
    <group ref={inner} rotation={[0, ASTRONAUT_ROTATION, 0]}>
      <primitive object={scene} position={fit.offset} scale={fit.s} />
    </group>
  )
}

/** A simple suited figure from primitives (used until the model is provided). */
function AstronautFallback() {
  const bump = useStore((s) => s.bumpModelsReady)
  useEffect(() => bump(), [bump])
  const suit = <meshStandardMaterial color="#eeeae2" roughness={0.75} metalness={0.05} />
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <capsuleGeometry args={[0.26, 0.5, 6, 14]} />
        {suit}
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.24, 18, 14]} />
        {suit}
      </mesh>
      <mesh position={[0, 0.9, 0.12]}>
        <sphereGeometry args={[0.2, 18, 14, 0, Math.PI]} />
        <meshStandardMaterial color="#c9951f" roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.4, -0.3]}>
        <boxGeometry args={[0.44, 0.56, 0.22]} />
        {suit}
      </mesh>
      {[-0.36, 0.36].map((x) => (
        <mesh key={x} position={[x, 0.3, 0]} rotation={[0, 0, x > 0 ? -0.35 : 0.35]}>
          <capsuleGeometry args={[0.09, 0.5, 4, 10]} />
          {suit}
        </mesh>
      ))}
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, -0.4, 0]}>
          <capsuleGeometry args={[0.1, 0.6, 4, 10]} />
          {suit}
        </mesh>
      ))}
    </group>
  )
}

/** The astronaut glides along the red line, leaning into the direction of travel. */
export function Astronaut({ visible }: { visible: boolean }) {
  const group = useRef<THREE.Group>(null)
  const pos = useRef(new THREE.Vector3())
  const dir = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3())
  const lean = useRef(0)
  const q = useRef(new THREE.Quaternion())
  const tilt = useRef(new THREE.Quaternion())
  const axisX = useMemo(() => new THREE.Vector3(1, 0, 0), [])

  useFrame((state, delta) => {
    const g = group.current!
    if (!visible) return
    const a = Math.min(pToA(journeyProgress()) + LEAD, ASTRONAUT_END)
    lineAt(a, pos.current, dir.current)
    const e = state.clock.elapsedTime
    g.position.copy(pos.current)
    g.position.y += 0.9 + Math.sin(e * 0.9) * 0.06
    g.position.x += Math.sin(e * 0.6) * 0.04
    look.current.copy(g.position).add(dir.current)
    g.lookAt(look.current)
    // lean forward with scroll speed; prone and gliding when moving, drifting upright when still
    const target = Math.min(Math.abs(scroll.velocity) * 0.006, 0.25) + 0.05
    lean.current += (target - lean.current) * Math.min(delta * 3, 1)
    q.current.copy(g.quaternion)
    tilt.current.setFromAxisAngle(axisX, lean.current)
    g.quaternion.multiply(tilt.current)
  })

  return (
    <group ref={group} visible={visible}>
      <Boundary fallback={<AstronautFallback />}>
        <Suspense fallback={null}>{ASTRONAUT_MODEL ? <AstronautModel /> : <AstronautFallback />}</Suspense>
      </Boundary>
      {/* key, fill and rim travel with the astronaut so the suit always reads white */}
      <pointLight position={[1.6, 2.2, 1.4]} color="#fff4e6" intensity={55} distance={14} decay={2} />
      <pointLight position={[-1.8, 0.6, -0.8]} color="#ffd9c0" intensity={22} distance={12} decay={2} />
      <pointLight position={[0.4, 1.0, -2.6]} color="#ffffff" intensity={34} distance={12} decay={2} />
    </group>
  )
}

if (ASTRONAUT_MODEL) useGLTF.preload(base + ASTRONAUT_MODEL, base + 'draco/')
