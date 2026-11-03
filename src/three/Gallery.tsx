import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useNavigate } from 'react-router'
import { projects } from '../content'
import { GALLERY_STEP, GALLERY_TILT, GALLERY_X, GALLERY_Y, GALLERY_Z0 } from './path'
import { RED } from './config'
import { useStore } from '../lib/store'
import { gsap } from '../lib/gsap'
import { transitionTo } from '../lib/transition'

const base = import.meta.env.BASE_URL
const W = 3.2
const H = 2.0

export function screenTransform(i: number) {
  const left = i % 2 === 0
  const x = left ? -GALLERY_X : GALLERY_X
  const z = GALLERY_Z0 - i * GALLERY_STEP
  const ry = left ? GALLERY_TILT : -GALLERY_TILT
  return { position: [x, GALLERY_Y, z] as [number, number, number], rotationY: ry }
}

function Screen({ index }: { index: number }) {
  const project = projects[index]
  const tex = useTexture(base + project.cover)
  const navigate = useNavigate()
  const setZoom = useStore((s) => s.setZoom)
  const setHoverView = useStore((s) => s.setHoverView)
  const [hover, setHover] = useState(false)
  const group = useRef<THREE.Group>(null)
  const { position, rotationY } = useMemo(() => screenTransform(index), [index])
  const frame = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(W + 0.12, H + 0.12)), [])

  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8

  useFrame((s, d) => {
    const g = group.current!
    const target = hover ? 1.03 : 1
    g.scale.x += (target - g.scale.x) * Math.min(d * 8, 1)
    g.scale.y = g.scale.x
    g.position.y = position[1] + Math.sin(s.clock.elapsedTime * 0.8 + index) * 0.03
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (useStore.getState().zoom) return
    const normal = new THREE.Vector3(Math.sin(rotationY), 0, Math.cos(rotationY))
    const look = new THREE.Vector3(...position)
    const pos = look.clone().add(normal.multiplyScalar(2.55))
    const zoom = { pos, look, t: 0 }
    setZoom(zoom)
    setHoverView(false)
    gsap.to(zoom, { t: 1, duration: 1.25, ease: 'power3.inOut' })
    transitionTo('/work/' + project.slug, { delay: 0.75 })
    void navigate
  }

  return (
    <group ref={group} position={position} rotation={[0, rotationY, 0]}>
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
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[W + 0.12, H + 0.12]} />
        <meshStandardMaterial color="#0b0b0b" roughness={0.4} metalness={0.6} />
      </mesh>
      <lineSegments geometry={frame} position={[0, 0, 0.001]}>
        <lineBasicMaterial color={hover ? RED : '#3a3a3a'} toneMapped={false} />
      </lineSegments>
      {/* index marker */}
      <mesh position={[-W / 2 + 0.18, H / 2 + 0.2, 0]}>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial color={RED} toneMapped={false} />
      </mesh>
      <pointLight color={hover ? RED : '#ffffff'} intensity={hover ? 10 : 3} distance={6} position={[0, 0, 1.2]} />
    </group>
  )
}

export function Gallery() {
  return (
    <group>
      {projects.map((_, i) => (
        <Screen key={i} index={i} />
      ))}
      {/* corridor light strips */}
      {projects.map((_, i) => (
        <mesh key={'l' + i} position={[0, 0.01, GALLERY_Z0 - i * GALLERY_STEP]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 0.02]} />
          <meshBasicMaterial color={RED} toneMapped={false} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

useTexture.preload(projects.map((p) => base + p.cover))
