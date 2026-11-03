import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/**
 * Gargantua, ray-traced: a full-screen background pass that bends every ray
 * through Schwarzschild spacetime. The accretion disk is sampled where a ray
 * crosses the equatorial plane (so its far side appears above and below the
 * hole), the photon ring lights up where rays skim r = 1.5, and captured rays
 * are black. Scene objects (the ship) render on top with normal depth.
 */

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.99999, 1.0);
}
`

const fragment = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform mat3 uBasis;
uniform float uTan;
uniform float uSteps;
uniform float uExposure;
varying vec2 vUv;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
vec3 stars(vec3 d) {
  vec3 col = vec3(0.0);
  for (int i = 0; i < 2; i++) {
    float sc = 70.0 + float(i) * 55.0;
    vec3 g = d * sc; vec3 id = floor(g);
    float h = hash(id + float(i) * 7.1);
    vec3 jitter = vec3(hash(id + 1.3), hash(id + 2.7), hash(id + 4.1)) - 0.5;
    float r = length(fract(g) - 0.5 - jitter * 0.6);
    float star = smoothstep(0.09, 0.0, r) * step(0.982 - float(i) * 0.01, h);
    vec3 tint = mix(vec3(1.0, 0.9, 0.8), vec3(0.8, 0.9, 1.0), hash(id * 3.1));
    col += tint * star * (0.5 + 1.5 * hash(id * 1.7));
  }
  float band = pow(max(0.0, 1.0 - abs(d.y * 1.6 + d.x * 0.25)), 5.0) * 0.07 * (0.6 + noise(d * 5.0));
  return col + band * vec3(0.55, 0.62, 0.9);
}
vec3 disk(vec3 p, vec3 v) {
  float r = length(p.xz);
  float inner = 2.4, outer = 11.5;
  if (r < inner || r > outer) return vec3(0.0);
  float a = atan(p.z, p.x);
  float rn = (r - inner) / (outer - inner);
  float omega = 1.0 / pow(r * 0.32, 1.5);
  float sw = a - uTime * 0.55 * omega;
  float n = noise(vec3(cos(sw) * 2.6, sin(sw) * 2.6, rn * 9.0)) * 0.6
          + noise(vec3(cos(sw) * 6.0 + 3.0, sin(sw) * 6.0, rn * 22.0 + uTime * 0.05)) * 0.3
          + noise(vec3(cos(sw * 2.0) * 9.0, sin(sw * 2.0) * 9.0, rn * 40.0)) * 0.1
          + noise(vec3(cos(sw) * 1.5, sin(sw) * 1.5, rn * 140.0)) * 0.22;
  float b = pow(1.0 - rn, 1.6) * (0.3 + n * 1.3);
  b *= smoothstep(0.0, 0.06, rn) * (1.0 - smoothstep(0.62, 1.0, rn));
  vec3 tang = normalize(vec3(-p.z, 0.0, p.x));
  float dop = dot(tang, -v);
  b *= 1.0 + 1.1 * dop;
  vec3 c = mix(vec3(1.0, 0.32, 0.07), vec3(1.0, 0.82, 0.55), smoothstep(0.0, 0.9, b));
  c = mix(c, vec3(1.0, 0.97, 0.92), smoothstep(0.9, 2.2, b));
  c = mix(c, vec3(0.7, 0.82, 1.0), max(dop, 0.0) * 0.3);
  return c * max(b, 0.0) * 2.4;
}
void main() {
  vec2 uv = (vUv * 2.0 - 1.0) * vec2(uRes.x / uRes.y, 1.0);
  vec3 rd = normalize(uBasis * vec3(uv.x * uTan, uv.y * uTan, -1.0));
  vec3 p = uCamPos;
  vec3 v = rd;
  vec3 L = cross(p, v);
  float h2 = dot(L, L);
  vec3 col = vec3(0.0);
  float trans = 1.0;
  bool captured = false;
  float minR = 1e9;
  for (int i = 0; i < 220; i++) {
    if (float(i) >= uSteps) break;
    float r = length(p);
    minR = min(minR, r);
    if (r < 1.0) { captured = true; break; }
    if (r > 48.0 && dot(p, v) > 0.0) break;
    float dt = clamp(r * 0.075, 0.018, 0.6);
    vec3 a = -1.5 * h2 * p / pow(r, 5.0);
    vec3 pn = p + v * dt;
    v = normalize(v + a * dt);
    if (sign(p.y) != sign(pn.y)) {
      vec3 x = mix(p, pn, p.y / (p.y - pn.y));
      if (length(x) > 1.0) {
        col += disk(x, v) * trans;
        trans *= 0.78;
      }
    }
    p = pn;
  }
  if (!captured) col += stars(normalize(v)) * trans;
  float ring = exp(-pow((minR - 1.52) * 3.2, 2.0)) * 0.55;
  col += vec3(1.0, 0.85, 0.6) * ring * (captured ? 0.0 : 1.0);
  gl_FragColor = vec4(col * uExposure, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

type Props = {
  /** World units per Schwarzschild radius. */
  scale?: number
  light?: boolean
  exposure?: number
}

export function BlackHole({ scale = 8, light = false, exposure = 1 }: Props) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uRes: { value: new THREE.Vector2(1, 1) },
          uTime: { value: 0 },
          uCamPos: { value: new THREE.Vector3() },
          uBasis: { value: new THREE.Matrix3() },
          uTan: { value: 1 },
          uSteps: { value: light ? 96 : 180 },
          uExposure: { value: exposure },
        },
        depthTest: false,
        depthWrite: false,
      }),
    [light, exposure],
  )
  const basis = useMemo(() => new THREE.Matrix3(), [])

  useFrame((state) => {
    const cam = state.camera as THREE.PerspectiveCamera
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uCamPos.value.copy(cam.position).divideScalar(scale)
    basis.setFromMatrix4(cam.matrixWorld)
    u.uBasis.value.copy(basis)
    u.uTan.value = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)
    u.uRes.value.set(state.size.width, state.size.height)
  })

  return (
    <mesh material={material} renderOrder={-10} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}
