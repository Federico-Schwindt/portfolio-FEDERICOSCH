import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Sparkles, useGLTF } from '@react-three/drei'
import { DRAGON_HEIGHT, DRAGON_MODEL, DRAGON_MOUTH, DRAGON_POSITION, DRAGON_ROTATION, RED } from './config'
import { ambient } from '../lib/audio'
import { pointer, useStore } from '../lib/store'

const base = import.meta.env.BASE_URL

/** A red dragon hovering over the scene; animated procedurally (flight bob, banking, breathing, fire glow). */
export function Dragon({ light }: { light: boolean }) {
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const fire = useRef<THREE.PointLight>(null)
  const { scene } = useGLTF(base + DRAGON_MODEL!, base + 'draco/')
  const setDragonReady = useStore((s) => s.setDragonReady)

  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const s = DRAGON_HEIGHT / Math.max(size.y, 0.001)
    const center = new THREE.Vector3()
    box.getCenter(center)
    return { s, offset: new THREE.Vector3(-center.x * s, -box.min.y * s, -center.z * s) }
  }, [scene])

  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.frustumCulled = false
        const mat = m.material as THREE.MeshStandardMaterial
        if (mat && 'envMapIntensity' in mat) {
          mat.envMapIntensity = 0.9
          if (mat.emissive) mat.emissiveIntensity = 1.2
        }
      }
    })
    setDragonReady(true)
  }, [scene, setDragonReady])

  const yaw = useRef(0)
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const e = state.clock.elapsedTime
    const g = group.current!
    const b = body.current!
    // it stands on its rock: a slow weight shift, a turn toward the cursor, and breathing
    g.position.set(DRAGON_POSITION[0], DRAGON_POSITION[1], DRAGON_POSITION[2])
    const targetYaw = pointer.x * 0.18 + Math.sin(e * 0.2) * 0.06
    yaw.current += (targetYaw - yaw.current) * (1 - Math.pow(0.02, dt))
    g.rotation.set(0, DRAGON_ROTATION + yaw.current, Math.sin(e * 0.45) * 0.015)
    const breath = 1 + Math.sin(e * 1.4) * 0.008
    b.scale.set(breath, 1 + Math.sin(e * 1.4) * 0.012, breath)
    // fire glow pulses with the music
    const p = ambient.pulse()
    const lvl = ambient.level()
    fire.current!.intensity = 6 + p * 22 + lvl * 10 + Math.sin(e * 7) * 1.5
  })

  return (
    <group ref={group} position={DRAGON_POSITION}>
      <group ref={body}>
        <primitive object={scene} position={fit.offset} scale={fit.s} />
      </group>
      <pointLight ref={fire} position={[DRAGON_MOUTH[0], DRAGON_MOUTH[1] - 0.3, DRAGON_MOUTH[2] + 0.9]} color="#ff5a1f" intensity={8} distance={7} decay={2} />
      <pointLight position={[0, 0.8, 3]} color={RED} intensity={12} distance={12} decay={2} />
      {!light && <Sparkles count={90} scale={[3, 2, 3]} position={DRAGON_MOUTH} size={4} speed={1.2} color="#ff7a3a" opacity={0.9} noise={2} />}
    </group>
  )
}

if (DRAGON_MODEL) useGLTF.preload(base + DRAGON_MODEL, base + 'draco/')
