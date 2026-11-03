import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Blob } from './Blob'
import { Particles } from './Particles'
import { Rings } from './Rings'
import { measureScene, updateSceneTarget } from './keyframes'
import { useStore } from '../lib/store'
import { useIsMobile, useReducedMotion, isLowPower } from '../lib/hooks'
import { ambient } from '../lib/audio'
import { ScrollTrigger } from '../lib/gsap'

function Driver() {
  const setSceneReady = useStore((s) => s.setSceneReady)
  const frames = useRef(0)
  useFrame(() => {
    updateSceneTarget()
    if (frames.current < 3) {
      frames.current++
      if (frames.current === 3) setSceneReady(true)
    }
  })
  return null
}

function Effects() {
  const bloom = useRef<{ intensity: number } | null>(null)
  useFrame(() => {
    if (bloom.current) bloom.current.intensity = 0.75 + ambient.level() * 0.6
  })
  return (
    <EffectComposer multisampling={0}>
      <Bloom ref={bloom as never} luminanceThreshold={0.7} luminanceSmoothing={0.25} intensity={0.8} mipmapBlur radius={0.65} />
      <Noise opacity={0.045} blendFunction={BlendFunction.SOFT_LIGHT} />
      <Vignette eskil={false} offset={0.15} darkness={0.85} />
    </EffectComposer>
  )
}

export function Scene() {
  const isMobile = useIsMobile()
  const reduced = useReducedMotion()
  const low = useMemo(() => isLowPower(), [])
  const light = isMobile || low

  useEffect(() => {
    const m = () => measureScene()
    m()
    const t = window.setTimeout(m, 300)
    window.addEventListener('resize', m)
    ScrollTrigger.addEventListener('refresh', m)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('resize', m)
      ScrollTrigger.removeEventListener('refresh', m)
    }
  }, [])

  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        dpr={light ? [1, 1.25] : [1, 1.75]}
        camera={{ fov: 32, position: [0, 0, 9], near: 0.1, far: 60 }}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false, depth: true }}
        frameloop={reduced ? 'demand' : 'always'}
      >
        <color attach="background" args={['#09090b']} />
        <Suspense fallback={null}>
          <Blob detail={light ? 40 : 72} />
          <Rings />
          <Particles count={light ? 500 : 1400} />
          {!light && <Effects />}
        </Suspense>
        <Driver />
      </Canvas>
    </div>
  )
}
