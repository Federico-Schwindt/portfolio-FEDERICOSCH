import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { SERVICE_POSITIONS } from './path'
import { RED } from './config'
import { ambient } from '../lib/audio'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <meshPhysicalMaterial color="#0a0a0a" roughness={0.18} metalness={0.7} clearcoat={1} clearcoatRoughness={0.1} envMapIntensity={1.5} />
      {children}
    </>
  )
}

function Edges({ geometry, color = RED, opacity = 0.9 }: { geometry: THREE.BufferGeometry; color?: string; opacity?: number }) {
  const edges = useRef(new THREE.EdgesGeometry(geometry, 12))
  return (
    <lineSegments geometry={edges.current}>
      <lineBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
    </lineSegments>
  )
}

/** 01 Development — a wireframe icosahedron with a burning core. */
function Dev({ position }: { position: [number, number, number] }) {
  const g = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const geo = useRef(new THREE.IcosahedronGeometry(1.1, 1))
  useFrame((s, d) => {
    g.current!.rotation.y += d * 0.25
    g.current!.rotation.x = Math.sin(s.clock.elapsedTime * 0.3) * 0.3
    const p = ambient.pulse()
    core.current!.scale.setScalar(0.42 + p * 0.1 + Math.sin(s.clock.elapsedTime * 2) * 0.02)
  })
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
      <group position={position} ref={g}>
        <mesh geometry={geo.current}>
          <meshPhysicalMaterial color="#0a0a0a" roughness={0.2} metalness={0.6} clearcoat={1} transparent opacity={0.35} />
        </mesh>
        <Edges geometry={geo.current} />
        <mesh ref={core}>
          <icosahedronGeometry args={[1, 3]} />
          <meshBasicMaterial color={RED} toneMapped={false} />
        </mesh>
        <pointLight color={RED} intensity={18} distance={9} decay={2} />
      </group>
    </Float>
  )
}

/** 02 Design — a glossy torus knot with a red rim. */
function Design({ position }: { position: [number, number, number] }) {
  const g = useRef<THREE.Group>(null)
  useFrame((s, d) => {
    g.current!.rotation.y -= d * 0.3
    g.current!.rotation.z = Math.sin(s.clock.elapsedTime * 0.25) * 0.4
  })
  return (
    <Float speed={1.2} rotationIntensity={0.5} floatIntensity={0.7}>
      <group position={position} ref={g}>
        <mesh>
          <torusKnotGeometry args={[0.85, 0.26, 220, 32]} />
          <Shell>{null}</Shell>
        </mesh>
        <mesh scale={1.04}>
          <torusKnotGeometry args={[0.85, 0.26, 120, 16]} />
          <meshBasicMaterial color={RED} wireframe transparent opacity={0.18} toneMapped={false} />
        </mesh>
        <pointLight color="#ffffff" intensity={10} distance={8} position={[1.5, 1.5, 1.5]} />
        <pointLight color={RED} intensity={14} distance={8} position={[-1.5, -1, 1]} />
      </group>
    </Float>
  )
}

/** 03 Marketing — rising rings of growth. */
function Marketing({ position }: { position: [number, number, number] }) {
  const g = useRef<THREE.Group>(null)
  const rings = [0.5, 0.75, 1.0, 1.25, 1.5]
  useFrame((s, d) => {
    g.current!.rotation.y += d * 0.2
    g.current!.children.forEach((c, i) => {
      c.position.y = (i - 2) * 0.32 + Math.sin(s.clock.elapsedTime * 1.2 + i * 0.6) * 0.05
    })
  })
  return (
    <Float speed={1.1} rotationIntensity={0.3} floatIntensity={0.6}>
      <group position={position} ref={g} rotation={[0.35, 0, 0.2]}>
        {rings.map((r, i) => (
          <mesh key={r} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.035, 12, 96]} />
            <meshBasicMaterial color={i === rings.length - 1 ? RED : '#f2efe9'} toneMapped={false} transparent opacity={0.35 + i * 0.13} />
          </mesh>
        ))}
        <mesh position={[0, 0.9, 0]}>
          <coneGeometry args={[0.18, 0.5, 4]} />
          <meshBasicMaterial color={RED} toneMapped={false} />
        </mesh>
        <pointLight color={RED} intensity={12} distance={8} />
      </group>
    </Float>
  )
}

export function ServiceObjects() {
  return (
    <>
      <Dev position={SERVICE_POSITIONS[0]} />
      <Design position={SERVICE_POSITIONS[1]} />
      <Marketing position={SERVICE_POSITIONS[2]} />
    </>
  )
}
