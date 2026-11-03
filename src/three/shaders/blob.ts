import { snoise3 } from './noise'

export const blobVertex = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
uniform float uSpeed;
uniform float uAudio;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vDisp;
varying vec3 vPos;

${snoise3}

float fbm(vec3 p) {
  float s = 0.0;
  float a = 0.55;
  for (int i = 0; i < 3; i++) {
    s += a * snoise(p);
    p = p * 2.05 + 11.3;
    a *= 0.5;
  }
  return s;
}

float displace(vec3 p) {
  float t = uTime * uSpeed;
  float n = fbm(p * uFreq + vec3(t * 0.6, t * 0.45, -t * 0.5));
  float n2 = snoise(p * uFreq * 3.2 + vec3(0.0, t * 1.3, t * 0.4)) * 0.12 * (0.35 + uAudio);
  return (n + n2) * uAmp;
}

void main() {
  vec3 n = normalize(normal);
  float d = displace(position);
  vec3 displaced = position + n * d;

  vec3 t = normalize(cross(n, abs(n.y) > 0.98 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0)));
  vec3 b = normalize(cross(n, t));
  float eps = 0.035;
  vec3 pt = position + t * eps;
  vec3 pb = position + b * eps;
  vec3 dt = pt + normalize(pt) * displace(pt);
  vec3 db = pb + normalize(pb) * displace(pb);
  vec3 newN = normalize(cross(dt - displaced, db - displaced));
  if (dot(newN, n) < 0.0) newN = -newN;

  vec4 wp = modelMatrix * vec4(displaced, 1.0);
  vNormal = normalize(mat3(modelMatrix) * newN);
  vViewDir = normalize(cameraPosition - wp.xyz);
  vDisp = d;
  vPos = displaced;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const blobFragment = /* glsl */ `
uniform float uTime;
uniform float uAudio;
uniform vec3 uBase;
uniform vec3 uAccent;
uniform vec3 uGlow;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vDisp;
varying vec3 vPos;

// black → deep red → red → hot white
vec3 palette(float t) {
  t = fract(t);
  vec3 c1 = vec3(0.04, 0.01, 0.01);
  vec3 c2 = vec3(0.55, 0.03, 0.04);
  vec3 c3 = vec3(1.0, 0.17, 0.17);
  vec3 c4 = vec3(1.0, 0.86, 0.86);
  vec3 c = mix(c1, c2, smoothstep(0.0, 0.3, t));
  c = mix(c, c3, smoothstep(0.3, 0.65, t));
  c = mix(c, c4, smoothstep(0.75, 0.95, t));
  c = mix(c, c1, smoothstep(0.95, 1.0, t));
  return c;
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);
  float NdV = clamp(dot(N, V), 0.0, 1.0);
  float fresnel = pow(1.0 - NdV, 2.4);

  vec3 L1 = normalize(vec3(2.5, 3.0, 4.0));
  vec3 L2 = normalize(vec3(-3.5, -1.5, 2.0));
  vec3 L3 = normalize(vec3(0.0, -3.0, -2.0));

  float diff = max(dot(N, L1), 0.0);
  vec3 H1 = normalize(L1 + V);
  float spec1 = pow(max(dot(N, H1), 0.0), 90.0);
  vec3 H2 = normalize(L2 + V);
  float spec2 = pow(max(dot(N, H2), 0.0), 26.0);
  float rim3 = pow(max(dot(N, L3), 0.0), 2.0);

  vec3 band = palette(fresnel * 0.9 + vDisp * 1.4 + vPos.y * 0.1 + uTime * 0.03);

  vec3 col = uBase * (0.2 + diff * 0.6);
  col += band * fresnel * 1.2;
  col += vec3(1.0, 0.97, 0.95) * spec1 * 1.2;
  col += uAccent * spec2 * 0.5;
  col += uGlow * rim3 * 0.2;
  col += uAccent * pow(fresnel, 4.0) * (0.55 + uAudio * 1.1);

  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * 0.025;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
