import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { useLocation } from 'react-router'
import { CameraRig } from './CameraRig'
import { Character } from './Character'
import { Dragon } from './Dragon'
import { Floor } from './Floor'
import { ServiceObjects } from './ServiceObjects'
import { Gallery } from './Gallery'
import { Core } from './Core'
import { Particles } from './Particles'
import { Effects } from './Effects'
import { Blob } from './Blob'
import { LabScene } from './LabScene'
import { BG, DRAGON_MODEL, RED } from './config'
import { useStore } from '../lib/store'
import { useIsMobile, useReducedMotion, isLowPower } from '../lib/hooks'

export type SceneMode = 'home' | 'about' | 'contact' | 'lab' | 'ambient'

function modeFor(pathname: string): SceneMode {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/about')) return 'about'
  if (pathname.startsWith('/contact')) return 'contact'
  if (pathname.startsWith('/lab')) return 'lab'
  return 'ambient'
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

function Studio() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer intensity={2.2} color="#ffffff" position={[0, 5, -3]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 6, 1]} />
      <Lightformer intensity={1.2} color="#ffffff" position={[-5, 2, 2]} rotation={[0, Math.PI / 2, 0]} scale={[6, 3, 1]} />
      <Lightformer intensity={2.5} color={RED} position={[5, 1, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 2, 1]} />
      <Lightformer intensity={0.6} color="#ff8080" position={[0, -2, 4]} rotation={[-Math.PI / 2, 0, 0]} scale={[8, 4, 1]} />
    </Environment>
  )
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <spotLight position={[2.5, 5, 3.5]} angle={0.6} penumbra={0.9} intensity={70} color="#fff4ec" distance={24} decay={2} />
      <pointLight position={[-3.5, 2.2, -2.5]} intensity={40} color={RED} distance={14} decay={2} />
      <pointLight position={[3.5, 1.2, -1]} intensity={14} color="#ffffff" distance={12} decay={2} />
    </>
  )
}

function HomeScene({ light }: { light: boolean }) {
  return (
    <>
      <Lights />
      {DRAGON_MODEL && <Dragon light={light} />}
      <Character position={[-2.1, 0, 0.3]} rotation={0.25} />
      <Floor reflective={!light} />
      <ServiceObjects />
      <Gallery />
      <Core light={light} />
      <Particles count={light ? 500 : 1400} box={[40, 20, 90]} center={[0, 6, -35]} />
    </>
  )
}

function AboutScene({ light, mobile }: { light: boolean; mobile: boolean }) {
  return (
    <>
      <Lights />
      <Character position={mobile ? [0.9, 0, -3.2] : [3.3, 0, -0.4]} rotation={mobile ? -0.2 : -0.4} />
      <Floor reflective={!light} />
      <Particles count={light ? 300 : 700} box={[24, 14, 16]} center={[0, 3, -4]} />
    </>
  )
}

function ContactScene({ light, mobile }: { light: boolean; mobile: boolean }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[3, 3, 3]} intensity={30} color="#ffffff" />
      <Blob position={mobile ? [0, 1.3, -2] : [4.4, 2.4, -3.5]} scale={mobile ? 1.1 : 1.4} amp={0.42} freq={1.2} detail={light ? 40 : 72} mouse />
      <Particles count={light ? 300 : 800} box={[24, 14, 16]} center={[0, 2, -4]} />
    </>
  )
}

function AmbientScene({ light }: { light: boolean }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[4, 3, -4]} intensity={20} color={RED} />
      <Blob position={[6.5, 3.2, -9]} scale={1.0} amp={0.35} freq={1.3} detail={light ? 32 : 48} />
      <Particles count={light ? 250 : 600} box={[26, 14, 16]} center={[0, 2, -5]} />
    </>
  )
}

export function World() {
  const { pathname } = useLocation()
  const mode = modeFor(pathname)
  const isMobile = useIsMobile()
  const reduced = useReducedMotion()
  // ?light in the URL forces the lighter scene (handy on weak GPUs and for automated checks)
  const low = useMemo(() => isLowPower() || new URLSearchParams(window.location.search).has('light'), [])
  const light = isMobile || low
  const setZoom = useStore((s) => s.setZoom)

  useEffect(() => setZoom(null), [mode, setZoom])

  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        dpr={light ? [1, 1.25] : [1, 1.75]}
        camera={{ fov: 40, position: [0.2, 4.0, 0.4], near: 0.1, far: 140 }}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false }}
        frameloop={reduced ? 'demand' : 'always'}
        eventPrefix="client"
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, mode === 'home' ? 8 : 6, mode === 'home' ? 26 : 24]} />
        <Suspense fallback={null}>
          <Studio />
          {mode === 'home' && <HomeScene light={light} />}
          {mode === 'about' && <AboutScene light={light} mobile={isMobile} />}
          {mode === 'contact' && <ContactScene light={light} mobile={isMobile} />}
          {mode === 'lab' && <LabScene light={light} />}
          {mode === 'ambient' && <AmbientScene light={light} />}
          {!light && <Effects />}
        </Suspense>
        <CameraRig mode={mode} />
        <Driver />
      </Canvas>
    </div>
  )
}
