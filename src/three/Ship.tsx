import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SHIP_LENGTH, SHIP_MODEL, SHIP_ROTATION } from './config'
import { shipAt } from './journey'
import { journeyProgress, useStore } from '../lib/store'

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

function ShipModel() {
  const { scene } = useGLTF(base + SHIP_MODEL!, base + 'draco/')
  const bump = useStore((s) => s.bumpModelsReady)
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const s = SHIP_LENGTH / Math.max(size.x, size.y, size.z, 0.001)
    const c = new THREE.Vector3()
    box.getCenter(c)
    return { s, offset: new THREE.Vector3(-c.x * s, -c.y * s, -c.z * s) }
  }, [scene])
  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) m.frustumCulled = false
    })
    bump()
  }, [scene, bump])
  return (
    <group rotation={[0, SHIP_ROTATION, 0]}>
      <primitive object={scene} position={fit.offset} scale={fit.s} />
    </group>
  )
}

/** A clean wedge-shaped shuttle built from primitives (used until a model is provided). */
function ShipFallback() {
  const bump = useStore((s) => s.bumpModelsReady)
  useEffect(() => bump(), [bump])
  const hull = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-1.6, -0.4)
    shape.lineTo(1.6, -0.4)
    shape.lineTo(1.9, 0.15)
    shape.lineTo(0.2, 0.42)
    shape.lineTo(-1.6, 0.42)
    shape.lineTo(-1.9, 0.15)
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 })
    g.translate(0, 0, -3)
    g.scale(1, 0.75, 1)
    return g
  }, [])
  return (
    <group>
      <mesh geometry={hull}>
        <meshStandardMaterial color="#e9e6df" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.25, 1.6]}>
        <boxGeometry args={[1.2, 0.3, 1.6]} />
        <meshStandardMaterial color="#111318" roughness={0.2} metalness={0.8} />
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0, -3.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.34, 0.5, 16]} />
          <meshStandardMaterial color="#2a2c32" roughness={0.4} metalness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/** The Ranger. Follows the dive curve; the engines glow brighter as it falls. */
export function Ship({ visible }: { visible: boolean }) {
  const group = useRef<THREE.Group>(null)
  const engine = useRef<THREE.PointLight>(null)
  const pos = useRef(new THREE.Vector3())
  const dir = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3())
  const roll = useRef(0)

  useFrame((state, delta) => {
    const g = group.current!
    if (!visible) return
    const p = journeyProgress()
    shipAt(p, pos.current, dir.current)
    const e = state.clock.elapsedTime
    g.position.copy(pos.current)
    g.position.y += Math.sin(e * 1.3) * 0.05
    look.current.copy(pos.current).add(dir.current)
    g.parent?.localToWorld(look.current)
    g.lookAt(look.current)
    // bank into the turn
    const targetRoll = -dir.current.x * 0.9 + Math.sin(e * 0.5) * 0.04
    roll.current += (targetRoll - roll.current) * Math.min(delta * 2, 1)
    g.rotateZ(roll.current)
    if (engine.current) engine.current.intensity = 3 + p * 14 + Math.sin(e * 9) * 0.6
  })

  return (
    <group ref={group} visible={visible}>
      <Boundary fallback={<ShipFallback />}>
        <Suspense fallback={null}>{SHIP_MODEL ? <ShipModel /> : <ShipFallback />}</Suspense>
      </Boundary>
      {/* the disk lights the ship from ahead: a warm key that travels with it */}
      <pointLight position={[1.5, 2.2, 9]} color="#ffb074" intensity={60} distance={30} decay={2} />
      <pointLight ref={engine} position={[0, 0, -3.4]} color="#8fb8ff" intensity={6} distance={10} decay={2} />
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.05, -3.05]}>
          <circleGeometry args={[0.11, 12]} />
          <meshBasicMaterial color="#bcd6ff" toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

if (SHIP_MODEL) useGLTF.preload(base + SHIP_MODEL, base + 'draco/')
