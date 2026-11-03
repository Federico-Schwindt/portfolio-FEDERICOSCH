import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { useLocation } from 'react-router'
import { CameraRig } from './CameraRig'
import { BlackHole } from './BlackHole'
import { Particles } from './Particles'
import { Ship } from './Ship'
import { Tesseract } from './Tesseract'
import { RedLine } from './RedLine'
import { Astronaut } from './Astronaut'
import { Screens } from './Screens'
import { WallPanels } from './WallPanels'
import { Effects } from './Effects'
import { LabScene } from './LabScene'
import { ACT_SPLIT, pToA, TESSERACT_ORIGIN } from './journey'
import { BG } from './config'
import { journeyProgress, useStore } from '../lib/store'
import { useIsMobile, useReducedMotion, isLowPower } from '../lib/hooks'

export type SceneMode = 'home' | 'ambient' | 'lab'

function modeFor(pathname: string): SceneMode {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/lab')) return 'lab'
  return 'ambient'
}

/** Distance fog that is off in space and close in the tesseract. */
function FogRig({ light, home }: { light: boolean; home: boolean }) {
  const { scene } = useThree()
  const fog = useMemo(() => new THREE.Fog(BG, 600, 1400), [])
  useEffect(() => {
    scene.fog = fog
    return () => {
      scene.fog = null
    }
  }, [scene, fog])
  useFrame((_, delta) => {
    const act2 = home && journeyProgress() >= ACT_SPLIT
    const near = act2 ? 10 : 600
    const far = act2 ? (light ? 70 : 100) : 1400
    const k = Math.min(delta * 6, 1)
    fog.near += (near - fog.near) * k
    fog.far += (far - fog.far) * k
  })
  return null
}

function Driver() {
  const setSceneReady = useStore((s) => s.setSceneReady)
  const frames = useRef(0)
  useFrame(() => {
    if (frames.current < 3) {
      frames.current++
      if (frames.current === 3) setSceneReady(true)
    }
  })
  return null
}

/** Toggles the two acts by scroll progress so only one is ever rendered. */
function Acts({ light }: { light: boolean }) {
  const [act, setAct] = useState(1)
  useFrame(() => {
    const a = journeyProgress() < ACT_SPLIT ? 1 : 2
    if (a !== act) setAct(a)
  })
  return (
    <>
      <group visible={act === 1}>
        {act === 1 && <BlackHole scale={8} light={light} />}
        <ambientLight intensity={0.06} />
        <directionalLight position={[-30, 14, 60]} intensity={0.3} color="#dfe8ff" />
        <pointLight position={[0, 0, 0]} intensity={4200} distance={220} decay={2} color="#ff9558" />
        <Ship visible={act === 1} />
      </group>
      <group position={TESSERACT_ORIGIN} visible={act === 2}>
        <hemisphereLight args={['#ffe9d2', '#1a1410', 1.5]} />
        <Environment resolution={64} frames={1}>
          <Lightformer intensity={1.6} color="#fff1dc" position={[0, 6, -4]} rotation={[Math.PI / 2, 0, 0]} scale={[14, 10, 1]} />
          <Lightformer intensity={0.8} color="#ffffff" position={[-6, 1, 2]} rotation={[0, Math.PI / 2, 0]} scale={[6, 4, 1]} />
          <Lightformer intensity={0.5} color="#ff6a4a" position={[6, -2, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 3, 1]} />
        </Environment>
        <Tesseract visible={act === 2} light={light} />
        <RedLine visible={act === 2} light={light} />
        <Astronaut visible={act === 2} />
        <Screens visible={act === 2} />
        <WallPanels visible={act === 2} />
        {/* dust drifting through the rooms */}
        <Particles count={light ? 300 : 900} box={[30, 22, 150]} center={[0, 2, -85]} size={3.5} />
        <ExitLight />
      </group>
    </>
  )
}

const glowMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { uStrength: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform float uStrength; varying vec2 vUv; void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(max(1.0 - d, 0.0), 2.6) * uStrength; gl_FragColor = vec4(vec3(1.0, 0.97, 0.9) * a, 1.0); }`,
})

/** A soft white glow at the end of the line: the way out. It grows as the astronaut approaches. */
function ExitLight() {
  useFrame(() => {
    const a = pToA(journeyProgress())
    glowMaterial.uniforms.uStrength.value = 0.7 + Math.max(0, (a - 0.8) / 0.2) * 1.6
  })
  return (
    <group position={[0, 2.2, -196]}>
      <Billboard>
        <mesh material={glowMaterial}>
          <planeGeometry args={[36, 36]} />
        </mesh>
      </Billboard>
      <pointLight position={[0, 0, 12]} intensity={50} distance={60} decay={2} color="#ffffff" />
    </group>
  )
}

function AmbientScene({ light }: { light: boolean }) {
  return (
    <>
      <BlackHole scale={2.2} light={light} exposure={0.8} />
      <ambientLight intensity={0.15} />
    </>
  )
}

export function World() {
  const { pathname } = useLocation()
  const mode = modeFor(pathname)
  const isMobile = useIsMobile()
  const reduced = useReducedMotion()
  const low = useMemo(() => isLowPower() || new URLSearchParams(window.location.search).has('light'), [])
  const light = isMobile || low
  const [dpr, setDpr] = useState(light ? 1 : 1.5)
  const setZoom = useStore((s) => s.setZoom)

  useEffect(() => setZoom(null), [mode, setZoom])

  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        dpr={dpr}
        camera={{ fov: 42, position: [16, 14, 165], near: 0.1, far: 900 }}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false }}
        frameloop={reduced ? 'demand' : 'always'}
        eventPrefix="client"
      >
        <color attach="background" args={[BG]} />
        <FogRig light={light} home={mode === 'home'} />
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))}
          onIncline={() => setDpr((d) => Math.min(light ? 1.25 : 1.75, d + 0.25))}
        />
        <Suspense fallback={null}>
          {mode === 'home' && <Acts light={light} />}
          {mode === 'ambient' && <AmbientScene light={light} />}
          {mode === 'lab' && <LabScene light={light} />}
          {!light && <Effects />}
        </Suspense>
        <CameraRig mode={mode} />
        <Driver />
      </Canvas>
    </div>
  )
}
