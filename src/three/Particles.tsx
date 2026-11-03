import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { particlesFragment, particlesVertex } from './shaders/particles'
import { pointer, scroll } from '../lib/store'

type Props = { count: number }

export function Particles({ count }: Props) {
  const points = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const scale = new Float32Array(count)
    const speed = new Float32Array(count)
    const offset = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22
      pos[i * 3 + 2] = -8 + Math.random() * 12
      scale[i] = 0.3 + Math.pow(Math.random(), 2.2) * 1.7
      speed[i] = 0.3 + Math.random() * 1.2
      offset[i] = Math.random() * 100
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
    g.setAttribute('aOffset', new THREE.BufferAttribute(offset, 1))
    return g
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
          uSize: { value: 7 },
          uColor: { value: new THREE.Color('#9b94c9') },
          uColor2: { value: new THREE.Color('#ffffff') },
        },
      }),
    [],
  )

  const par = useRef(new THREE.Vector2())

  useFrame((state) => {
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uPixelRatio.value = state.gl.getPixelRatio()
    par.current.lerp(new THREE.Vector2(pointer.x * 0.6, pointer.y * 0.4), 0.04)
    u.uParallax.value.copy(par.current)
    u.uScroll.value = scroll.y * 0.004
  })

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}
