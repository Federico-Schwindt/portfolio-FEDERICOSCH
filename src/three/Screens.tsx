import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { projects } from '../content'
import { SPOTS } from './journey'
import { RED } from './config'
import { useStore } from '../lib/store'
import { gsap } from '../lib/gsap'
import { transitionTo } from '../lib/transition'

const base = import.meta.env.BASE_URL
export const SCREEN_W = 4.4
export const SCREEN_H = 2.75

/** A project screen set flush into the room wall, like a window in the bookshelf. */
function Screen({ index }: { index: number }) {
  const project = projects[index]
  const spot = SPOTS.screens[index]
  const tex = useTexture(base + project.cover)
  const setZoom = useStore((s) => s.setZoom)
  const setHoverView = useStore((s) => s.setHoverView)
  const [hover, setHover] = useState(false)
  const group = useRef<THREE.Group>(null)
  const frame = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(SCREEN_W + 0.16, SCREEN_H + 0.16)), [])

  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8

  useFrame((_, d) => {
    const g = group.current!
    const t = hover ? 1.02 : 1
    g.scale.x += (t - g.scale.x) * Math.min(d * 8, 1)
    g.scale.y = g.scale.x
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (useStore.getState().zoom) return
    const g = group.current!
    const look = g.getWorldPosition(new THREE.Vector3())
    const normal = spot.normal.clone()
    const pos = look.clone().addScaledVector(normal, 3.4)
    const zoom = { pos, look, t: 0 }
    setZoom(zoom)
    setHoverView(false)
    gsap.to(zoom, { t: 1, duration: 1.3, ease: 'power3.inOut' })
    transitionTo('/work/' + project.slug, { delay: 0.8 })
  }

  return (
    <group ref={group} position={spot.position} rotation={[0, spot.rotationY, 0]}>
      {/* recess: a dark box sunk into the wall */}
      <mesh position={[0, 0, -0.22]}>
        <boxGeometry args={[SCREEN_W + 0.6, SCREEN_H + 0.6, 0.4]} />
        <meshStandardMaterial color="#070605" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          setHoverView(true)
        }}
        onPointerOut={() => {
          setHover(false)
          setHoverView(false)
        }}
      >
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <lineSegments geometry={frame} position={[0, 0, 0.004]}>
        <lineBasicMaterial color={hover ? RED : '#c9bda6'} toneMapped={false} />
      </lineSegments>
      <mesh position={[-SCREEN_W / 2 + 0.18, SCREEN_H / 2 + 0.22, 0]}>
        <circleGeometry args={[0.05, 12]} />
        <meshBasicMaterial color={RED} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 1.6]} color={hover ? RED : '#fff1dc'} intensity={hover ? 14 : 6} distance={7} decay={2} />
    </group>
  )
}

export function Screens({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      {projects.map((_, i) => (
        <Screen key={i} index={i} />
      ))}
    </group>
  )
}

useTexture.preload(projects.map((p) => base + p.cover))
