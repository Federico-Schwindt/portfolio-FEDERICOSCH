import { snoise3 } from './noise'

export const diskVertex = /* glsl */ `
varying vec2 vPos;
void main() {
  vPos = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const diskFragment = /* glsl */ `
uniform float uTime;
uniform float uInner;
uniform float uOuter;
uniform float uIntensity;
uniform float uDoppler;
uniform float uFlat;
uniform float uArc;
uniform vec3 uHot;
uniform vec3 uMid;
uniform vec3 uCold;
varying vec2 vPos;

${snoise3}

void main() {
  float r = length(vPos);
  float a = atan(vPos.y, vPos.x);
  float rn = (r - uInner) / (uOuter - uInner);
  if (rn < 0.0 || rn > 1.0) discard;

  // Keplerian shear: the inner disk spins faster.
  float speed = 0.22 / (0.18 + rn);
  float ang = a + uTime * speed;
  // long streaks along the orbit: low angular frequency, higher radial frequency
  float n = snoise(vec3(cos(ang) * 1.4, sin(ang) * 1.4, rn * 6.0 - uTime * 0.03));
  float n2 = snoise(vec3(cos(ang) * 3.0 + 7.0, sin(ang) * 3.0, rn * 15.0 + uTime * 0.05));
  float n3 = snoise(vec3(cos(ang * 2.0) * 5.0, sin(ang * 2.0) * 5.0, rn * 34.0));
  float streaks = 0.55 + 0.35 * n + 0.2 * n2 + 0.08 * n3;
  streaks = max(streaks, 0.05);

  float radial = pow(1.0 - rn, 1.4);
  float edgeIn = smoothstep(0.0, 0.05, rn);
  float edgeOut = 1.0 - smoothstep(0.55, 1.0, rn);
  float doppler = 1.0 + uDoppler * cos(a + 0.9);
  float arc = mix(1.0, 0.25 + 0.75 * abs(sin(a)), uArc);
  float b = radial * streaks * edgeIn * edgeOut * doppler * arc * uIntensity;

  vec3 col = mix(uCold, uMid, smoothstep(0.0, 0.55, b));
  col = mix(col, uHot, smoothstep(0.55, 1.5, b));
  gl_FragColor = vec4(col * b * 1.7, clamp(b, 0.0, 1.0) * uFlat);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
