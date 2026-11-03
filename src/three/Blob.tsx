import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { blobFragment, blobVertex } from './shaders/blob'
import { ambient } from '../lib/audio'
import { pointer } from '../lib/store'
import { RED } from './config'

type Props = {
  position?: [number, number, number]
  scale?: number
  amp?: number
  freq?: number
  speed?: number
  detail?: number
  reactive?: boolean
  mouse?: boolean
  paramsRef?: { current: { amp: number; freq: number; speed: number } }
}

export function Blob({ position = [0, 0, 0], scale = 1, amp = 0.3, freq = 1.1, speed = 0.35, detail = 64, reactive = true, mouse = false, paramsRef }: Props) {
  const mesh = useRef<THREE.Mesh>(null)
  const group = useRef<THREE.Group>(null)

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
          uAmp: { value: amp },
          uFreq: { value: freq },
          uSpeed: { value: speed },
          uAudio: { value: 0 },
          uBase: { value: new THREE.Color('#120909') },
          uAccent: { value: new THREE.Color(RED) },
          uGlow: { value: new THREE.Color('#ffffff') },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const smooth = useRef({ mx: 0, my: 0, s: scale, pulse: 0 })

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = smooth.current
    const k = 1 - Math.pow(0.001, dt)
    s.mx += (pointer.x - s.mx) * k * 0.5
    s.my += (pointer.y - s.my) * k * 0.5

    const audio = reactive ? ambient.level() : 0
    const pulse = reactive ? ambient.pulse() : 0
    s.pulse += (pulse - s.pulse) * 0.3

    const g = group.current!
    g.position.set(position[0] + (mouse ? s.mx * 0.3 : 0), position[1] + (mouse ? s.my * 0.2 : 0), position[2])
    g.scale.setScalar(scale * (1 + s.pulse * 0.06))

    const m = mesh.current!
    m.rotation.y += dt * 0.12
    m.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.25 + (mouse ? s.my * 0.2 : 0)

    const p = paramsRef?.current
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uAmp.value = (p ? p.amp : amp) + audio * 0.2 + s.pulse * 0.12 + (mouse ? pointer.speed * 0.05 : 0)
    u.uFreq.value = p ? p.freq : freq
    u.uSpeed.value = p ? p.speed : speed
    u.uAudio.value = audio
  })

  return (
    <group ref={group}>
      <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}
