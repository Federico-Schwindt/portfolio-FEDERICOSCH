import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { blobFragment, blobVertex } from './shaders/blob'
import { ambient } from '../lib/audio'
import { pointer } from '../lib/store'
import { sceneTarget } from './keyframes'

type Props = { detail: number }

export function Blob({ detail }: Props) {
  const mesh = useRef<THREE.Mesh>(null)
  const group = useRef<THREE.Group>(null)
  const { viewport } = useThree()

  const geometry = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, detail)
    const merged = mergeVertices(g)
    merged.computeVertexNormals()
    g.dispose()
    return merged
  }, [detail])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: blobVertex,
        fragmentShader: blobFragment,
        uniforms: {
          uTime: { value: 0 },
          uAmp: { value: 0.3 },
          uFreq: { value: 1.1 },
          uSpeed: { value: 0.35 },
          uAudio: { value: 0 },
          uBase: { value: new THREE.Color('#141220') },
          uAccent: { value: new THREE.Color('#c8ff3b') },
          uGlow: { value: new THREE.Color('#5b4bff') },
        },
      }),
    [],
  )

  const smooth = useRef({ x: 0, y: 0, s: 1, amp: 0.3, freq: 1.1, mx: 0, my: 0, speed: 0 })

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = sceneTarget.current
    const s = smooth.current
    const k = 1 - Math.pow(0.001, dt) // frame-rate independent lerp (~fast)
    const kSlow = 1 - Math.pow(0.02, dt)

    // viewport in world units at z=0
    const halfW = viewport.width / 2
    const halfH = viewport.height / 2
    const base = Math.min(halfW * 0.78, halfH * 0.62)

    s.x += (t.x * halfW * 0.82 - s.x) * kSlow
    s.y += (t.y * halfH * 0.78 - s.y) * kSlow
    s.s += (t.s * base - s.s) * kSlow
    s.amp += (t.amp - s.amp) * kSlow
    s.freq += (t.freq - s.freq) * kSlow
    s.mx += (pointer.x - s.mx) * k * 0.6
    s.my += (pointer.y - s.my) * k * 0.6
    s.speed += (pointer.speed - s.speed) * 0.08

    const audio = ambient.level()
    const g = group.current!
    g.position.set(s.x + s.mx * 0.25, s.y + s.my * 0.2, 0)
    g.scale.setScalar(s.s)

    const m = mesh.current!
    m.rotation.y += dt * 0.12
    m.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.25 + s.my * 0.2
    m.rotation.z = s.mx * 0.15

    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uAmp.value = s.amp + s.speed * 0.08 + audio * 0.22
    u.uFreq.value = s.freq
    u.uAudio.value = audio
  })

  return (
    <group ref={group}>
      <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}
