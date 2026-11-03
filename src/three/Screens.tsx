import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { projects } from '../content'
import { lineAt, lineSide, STATIONS, TESSERACT_ORIGIN } from './journey'
import { RED } from './config'
import { useStore } from '../lib/store'
import { gsap } from '../lib/gsap'
import { transitionTo } from '../lib/transition'

const base = import.meta.env.BASE_URL
const W = 4.8
const H = 3.0

/** Placement of screen i: beside the line, alternating sides, facing the approaching camera. */
export function screenPlacement(i: number) {
  const a = STATIONS.screens[i]
  const pos = new THREE.Vector3()
  const dir = new THREE.Vector3()
  lineAt(a, pos, dir)
  const side = lineSide(dir, new THREE.Vector3())
  const sign = i % 2 === 0 ? -1 : 1
  const position = pos.clone().addScaledVector(side, sign * 4.2).add(new THREE.Vector3(0, 2.0, 0))
  // look at where the camera will be as it approaches (behind, on the line)
  const target = pos.clone().addScaledVector(dir, -5).add(new THREE.Vector3(0, 1.2, 0))
  return { position, target, sign }
}

function Screen({ index }: { index: number }) {
  const project = projects[index]
  const tex = useTexture(base + project.cover)
  const setZoom = useStore((s) => s.setZoom)
  const setHoverView = useStore((s) => s.setHoverView)
  const [hover, setHover] = useState(false)
  const group = useRef<THREE.Group>(null)
  const { position, target } = useMemo(() => screenPlacement(index), [index])
  const frame = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(W + 0.1, H + 0.1)), [])

  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8

  useFrame((s, d) => {
    const g = group.current!
    const t = hover ? 1.03 : 1
    g.scale.x += (t - g.scale.x) * Math.min(d * 8, 1)
    g.scale.y = g.scale.x
    g.position.y = position.y + Math.sin(s.clock.elapsedTime * 0.7 + index) * 0.03
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (useStore.getState().zoom) return
    const g = group.current!
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion)
    const look = g.getWorldPosition(new THREE.Vector3())
    const pos = look.clone().add(normal.multiplyScalar(3.6))
    const zoom = { pos, look, t: 0 }
    setZoom(zoom)
    setHoverView(false)
    gsap.to(zoom, { t: 1, duration: 1.3, ease: 'power3.inOut' })
    transitionTo('/work/' + project.slug, { delay: 0.8 })
  }

  return (
    <group
      ref={group}
      position={position}
      onUpdate={(g) => g.lookAt(target)}
    >
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
      <lineSegments geometry={frame} position={[0, 0, 0.002]}>
        <lineBasicMaterial color={hover ? RED : '#8a847a'} toneMapped={false} />
      </lineSegments>
      <mesh position={[-W / 2 + 0.16, H / 2 + 0.18, 0]}>
        <circleGeometry args={[0.045, 12]} />
        <meshBasicMaterial color={RED} toneMapped={false} />
      </mesh>
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

/** World-space position of screen i (for the camera). */
export function screenWorld(i: number) {
  return screenPlacement(i).position.clone().add(TESSERACT_ORIGIN)
}

useTexture.preload(projects.map((p) => base + p.cover))
