import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { lineCurve, pToA } from './journey'
import { RED } from './config'
import { journeyProgress } from '../lib/store'

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const frag = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
uniform float uHead;
varying vec2 vUv;
void main() {
  float x = vUv.x;
  // a bright pulse runs ahead of the astronaut, and the line behind is dimmer
  float ahead = smoothstep(uHead - 0.02, uHead + 0.004, x);
  float behind = 1.0 - ahead;
  float travel = fract(x * 14.0 - uTime * 0.9);
  float pulse = exp(-pow((travel - 0.5) * 4.0, 2.0)) * 0.9;
  float head = exp(-pow((x - uHead) * 160.0, 2.0)) * 2.4;
  float b = 0.55 * behind + (0.9 + pulse) * ahead + head;
  gl_FragColor = vec4(uColor * b, 1.0);
  #include <colorspace_fragment>
}
`

/** The red line: the rail the astronaut follows through the tesseract. */
export function RedLine({ visible, light }: { visible: boolean; light: boolean }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(lineCurve, light ? 220 : 420, 0.035, 6, false), [light])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: { uColor: { value: new THREE.Color(RED) }, uTime: { value: 0 }, uHead: { value: 0 } },
        toneMapped: false,
      }),
    [],
  )
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uHead.value = pToA(journeyProgress())
  })
  return <mesh geometry={geometry} material={material} visible={visible} frustumCulled={false} />
}
