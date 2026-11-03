import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import type { BloomEffect } from 'postprocessing'
import { ambient } from '../lib/audio'

export function Effects() {
  const bloom = useRef<BloomEffect>(null)
  useFrame(() => {
    if (bloom.current) bloom.current.intensity = 0.7 + ambient.level() * 0.5 + ambient.pulse() * 0.25
  })
  return (
    <EffectComposer multisampling={0}>
      <Bloom ref={bloom} luminanceThreshold={0.78} luminanceSmoothing={0.2} intensity={0.8} mipmapBlur radius={0.7} />
      <Noise opacity={0.04} blendFunction={BlendFunction.SOFT_LIGHT} />
      <Vignette eskil={false} offset={0.12} darkness={0.9} />
    </EffectComposer>
  )
}
