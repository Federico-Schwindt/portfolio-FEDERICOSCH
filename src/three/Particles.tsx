import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { particlesFragment, particlesVertex } from './shaders/particles'
import { pointer } from '../lib/store'

type Props = { count: number; box?: [number, number, number]; center?: [number, number, number]; size?: number }

export function Particles({ count, box = [30, 24, 14], center = [0, 0, -4], size = 7 }: Props) {
  const points = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const scale = new Float32Array(count)
    const speed = new Float32Array(count)
    const offset = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = center[0] + (Math.random() - 0.5) * box[0]
      pos[i * 3 + 1] = center[1] + (Math.random() - 0.5) * box[1]
      pos[i * 3 + 2] = center[2] + (Math.random() - 0.5) * box[2]
      scale[i] = 0.3 + Math.pow(Math.random(), 2.2) * 1.7
      speed[i] = 0.3 + Math.random() * 1.2
      offset[i] = Math.random() * 100
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
    g.setAttribute('aOffset', new THREE.BufferAttribute(offset, 1))
    return g
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particlesVertex,
        fragmentShader: particlesFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uParallax: { value: new THREE.Vector2() },
          uScroll: { value: 0 },
          uSize: { value: size },
          uColor: { value: new THREE.Color('#9a8c8c') },
          uColor2: { value: new THREE.Color('#ffffff') },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const par = useRef(new THREE.Vector2())
  const tmp = useRef(new THREE.Vector2())

  useFrame((state) => {
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uPixelRatio.value = state.gl.getPixelRatio()
    tmp.current.set(pointer.x * 0.4, pointer.y * 0.3)
    par.current.lerp(tmp.current, 0.04)
    u.uParallax.value.copy(par.current)
  })

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}
