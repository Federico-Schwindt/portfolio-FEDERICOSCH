import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { sceneTarget } from './keyframes'
import { pointer } from '../lib/store'

function circle(r: number, n = 160) {
  const pts: [number, number, number][] = []
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    pts.push([Math.cos(a) * r, Math.sin(a) * r, 0])
  }
  return pts
}

export function Rings() {
  const group = useRef<THREE.Group>(null)
  const r1 = useRef<THREE.Group>(null)
  const r2 = useRef<THREE.Group>(null)
  const { viewport } = useThree()
  const pts1 = useMemo(() => circle(1.65), [])
  const pts2 = useMemo(() => circle(2.05), [])
  const smooth = useRef({ x: 0, y: 0, s: 1 })

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = sceneTarget.current
    const s = smooth.current
    const kSlow = 1 - Math.pow(0.02, dt)
    const halfW = viewport.width / 2
    const halfH = viewport.height / 2
    const base = Math.min(halfW * 0.78, halfH * 0.62)
    s.x += (t.x * halfW * 0.82 - s.x) * kSlow
    s.y += (t.y * halfH * 0.78 - s.y) * kSlow
    s.s += (t.s * base - s.s) * kSlow
    const g = group.current!
    g.position.set(s.x + pointer.x * 0.2, s.y + pointer.y * 0.15, 0)
    g.scale.setScalar(s.s)
    const e = state.clock.elapsedTime
    r1.current!.rotation.set(1.2 + Math.sin(e * 0.2) * 0.2, e * 0.18, 0.4)
    r2.current!.rotation.set(-0.8 + Math.cos(e * 0.17) * 0.2, -e * 0.12, 1.1)
  })

  return (
    <group ref={group}>
      <group ref={r1}>
        <Line points={pts1} color="#c8ff3b" lineWidth={1} transparent opacity={0.45} />
      </group>
      <group ref={r2}>
        <Line points={pts2} color="#ecebe6" lineWidth={1} transparent opacity={0.22} dashed dashSize={0.4} gapSize={0.25} />
      </group>
    </group>
  )
}
