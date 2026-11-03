import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useAnimations, useGLTF, useTexture } from '@react-three/drei'
import { spriteFragment, spriteVertex } from './shaders/sprite'
import { CHARACTER_HEIGHT, CHARACTER_MODEL, CHARACTER_ROTATION } from './config'
import { useStore } from '../lib/store'

const base = import.meta.env.BASE_URL

type Props = { position?: [number, number, number]; rotation?: number; scale?: number }

/** Rigged, animated GLB of Federico (generated from photos). */
function CharacterModel({ position = [0, 0, 0], rotation = 0, scale = 1 }: Props) {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(base + CHARACTER_MODEL!, base + 'draco/')
  const { actions, names } = useAnimations(animations, inner)
  const setCharacterReady = useStore((s) => s.setCharacterReady)

  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const s = CHARACTER_HEIGHT / Math.max(size.y, 0.001)
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
        if (mat && 'envMapIntensity' in mat) mat.envMapIntensity = 1.2
      }
    })
    const first = names[0]
    if (first && actions[first]) actions[first]!.reset().fadeIn(0.6).play()
    setCharacterReady(true)
  }, [scene, actions, names, setCharacterReady])

  return (
    <group ref={group} position={position} rotation={[0, rotation, 0]} scale={scale}>
      <group ref={inner} rotation={[0, CHARACTER_ROTATION, 0]}>
        <primitive object={scene} position={fit.offset} scale={fit.s} />
      </group>
      <FloorShadow />
    </group>
  )
}

/** Game-style 8-direction sprite built from the photo turnaround (fallback). */
function CharacterSprite({ position = [0, 0, 0], rotation = 0, scale = 1 }: Props) {
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const tex = useTexture(base + 'char/turnaround.jpg')
  const { camera } = useThree()
  const setCharacterReady = useStore((s) => s.setCharacterReady)

  const material = useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.anisotropy = 8
    return new THREE.ShaderMaterial({
      vertexShader: spriteVertex,
      fragmentShader: spriteFragment,
      transparent: true,
      depthWrite: true,
      uniforms: {
        uMap: { value: tex },
        uOffset: { value: new THREE.Vector2(0, 2 / 3) },
        uScale: { value: new THREE.Vector2(1 / 3, 1 / 3) },
        uTime: { value: 0 },
      },
    })
  }, [tex])

  useEffect(() => setCharacterReady(true), [setCharacterReady])

  // frame order around the character (row, col) in the 3x3 sheet
  const frames = useMemo(
    () => [
      [0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1],
    ],
    [],
  )
  const world = useRef(new THREE.Vector3())

  useFrame((state) => {
    const g = group.current!
    g.getWorldPosition(world.current)
    const dx = camera.position.x - world.current.x
    const dz = camera.position.z - world.current.z
    const camAngle = Math.atan2(dx, dz)
    // billboard
    mesh.current!.rotation.y = camAngle
    // which view of the character does the camera see?
    let rel = camAngle - rotation
    rel = ((rel % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const idx = Math.round(rel / (Math.PI / 4)) % 8
    const [r, c] = frames[idx]
    material.uniforms.uOffset.value.set(c / 3, (2 - r) / 3)
    material.uniforms.uTime.value = state.clock.elapsedTime
    // idle breathing
    mesh.current!.position.y = CHARACTER_HEIGHT / 2 + Math.sin(state.clock.elapsedTime * 1.4) * 0.008
  })

  const aspect = 405 / 431 // one frame of the sheet
  return (
    <group ref={group} position={position} scale={scale}>
      <mesh ref={mesh} material={material} position={[0, CHARACTER_HEIGHT / 2, 0]}>
        <planeGeometry args={[CHARACTER_HEIGHT * aspect, CHARACTER_HEIGHT]} />
      </mesh>
      <FloorShadow />
    </group>
  )
}

function FloorShadow() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    const grd = ctx.createRadialGradient(64, 64, 4, 64, 64, 64)
    grd.addColorStop(0, 'rgba(0,0,0,0.85)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(c)
    return t
  }, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
      <planeGeometry args={[1.6, 1.0]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  )
}

export function Character(props: Props) {
  return CHARACTER_MODEL ? <CharacterModel {...props} /> : <CharacterSprite {...props} />
}

if (CHARACTER_MODEL) useGLTF.preload(base + CHARACTER_MODEL, base + 'draco/')
