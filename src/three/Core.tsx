import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { Blob } from './Blob'
import { CORE_POSITION } from './path'
import { RED } from './config'
import { ambient } from '../lib/audio'

/** The red core at the end of the journey: growth, energy, the +551%. */
export function Core({ light }: { light: boolean }) {
  const r1 = useRef<THREE.Mesh>(null)
  const r2 = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  useFrame((s, d) => {
    const e = s.clock.elapsedTime
    r1.current!.rotation.set(1.2 + Math.sin(e * 0.2) * 0.2, e * 0.18, 0.4)
    r2.current!.rotation.set(-0.8 + Math.cos(e * 0.17) * 0.2, -e * 0.12, 1.1)
    const p = ambient.pulse()
    lightRef.current!.intensity = 60 + p * 80 + ambient.level() * 40
    r1.current!.rotation.z += d * 0.05
  })
  return (
    <group position={CORE_POSITION}>
      <Blob scale={1.7} amp={0.5} freq={1.1} speed={0.4} detail={light ? 40 : 72} />
      <mesh ref={r1}>
        <torusGeometry args={[2.9, 0.012, 8, 160]} />
        <meshBasicMaterial color={RED} toneMapped={false} transparent opacity={0.8} />
      </mesh>
      <mesh ref={r2}>
        <torusGeometry args={[3.6, 0.008, 8, 160]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} transparent opacity={0.35} />
      </mesh>
      <pointLight ref={lightRef} color={RED} intensity={80} distance={30} decay={2} />
      {!light && <Sparkles count={160} scale={[12, 8, 12]} size={3} speed={0.4} color={RED} opacity={0.8} />}
    </group>
  )
}
