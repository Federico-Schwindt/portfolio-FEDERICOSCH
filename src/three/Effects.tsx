import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import type { BloomEffect } from 'postprocessing'
import { ambient } from '../lib/audio'

export function Effects() {
  const bloom = useRef<BloomEffect>(null)
  useFrame(() => {
    if (bloom.current) bloom.current.intensity = 0.9 + ambient.level() * 0.4 + ambient.pulse() * 0.2
  })
  return (
    <EffectComposer multisampling={0} resolutionScale={0.75}>
      <Bloom ref={bloom} luminanceThreshold={0.62} luminanceSmoothing={0.3} intensity={1} mipmapBlur radius={0.72} />
      <Vignette eskil={false} offset={0.1} darkness={0.85} />
    </EffectComposer>
  )
}
