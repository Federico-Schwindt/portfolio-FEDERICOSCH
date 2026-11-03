import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { diskFragment, diskVertex } from './shaders/disk'

const HOT = new THREE.Color('#fff6ec')
const MID = new THREE.Color('#ff7a3a')
const COLD = new THREE.Color('#7a0d0d')

function makeDisk(inner: number, outer: number, intensity: number, doppler: number, arc = 0) {
  return new THREE.ShaderMaterial({
    vertexShader: diskVertex,
    fragmentShader: diskFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uInner: { value: inner },
      uOuter: { value: outer },
      uIntensity: { value: intensity },
      uDoppler: { value: doppler },
      uFlat: { value: 1 },
      uArc: { value: arc },
      uHot: { value: HOT },
      uMid: { value: MID },
      uCold: { value: COLD },
    },
  })
}

type Props = { radius?: number; detail?: 'full' | 'light' }

/**
 * Gargantua: an event horizon, a thin accretion disk with Keplerian shear and
 * Doppler beaming, and the lensed far side of the disk as a halo that always
 * faces the camera. Bloom does the rest.
 */
export function Gargantua({ radius = 4.2, detail = 'full' }: Props) {
  const diskMat = useMemo(() => makeDisk(radius * 1.3, radius * 4.2, 1.35, 0.7), [radius])
  const haloMat = useMemo(() => makeDisk(radius * 1.02, radius * 1.75, 1.1, 0.3, 1), [radius])
  const halo = useRef<THREE.Mesh>(null)
  const group = useRef<THREE.Group>(null)
  const seg = detail === 'full' ? 180 : 96

  useFrame((state) => {
    const t = state.clock.elapsedTime
    diskMat.uniforms.uTime.value = t
    haloMat.uniforms.uTime.value = t * 0.7
    // the halo is the lensed back of the disk: keep it facing the viewer
    if (halo.current && group.current) {
      const cam = state.camera.position
      halo.current.lookAt(cam)
    }
  })

  return (
    <group ref={group}>
      {/* event horizon */}
      <mesh>
        <sphereGeometry args={[radius, 64, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* photon ring */}
      <mesh ref={halo}>
        <ringGeometry args={[radius * 1.0, radius * 1.8, seg, 1]} />
        <primitive object={haloMat} attach="material" />
      </mesh>
      {/* accretion disk, slightly tilted toward the approach */}
      <mesh rotation={[-Math.PI / 2 + 0.42, 0, 0.15]}>
        <ringGeometry args={[radius * 1.25, radius * 4.3, seg, 1]} />
        <primitive object={diskMat} attach="material" />
      </mesh>
      {/* a thin bright inner ring that bloom turns into the photon sphere */}
      <mesh rotation={[-Math.PI / 2 + 0.42, 0, 0.15]}>
        <torusGeometry args={[radius * 1.27, radius * 0.012, 8, 160]} />
        <meshBasicMaterial color="#fff2e0" toneMapped={false} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}
