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
  vec3 nt = normalize(pt);
  vec3 nb = normalize(pb);
  vec3 dt = pt + nt * displace(pt);
  vec3 db = pb + nb * displace(pb);
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

vec3 palette(float t) {
  vec3 a = vec3(0.42, 0.38, 0.55);
  vec3 b = vec3(0.45, 0.42, 0.48);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.00, 0.33, 0.67);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);
  float NdV = clamp(dot(N, V), 0.0, 1.0);
  float fresnel = pow(1.0 - NdV, 2.6);

  vec3 L1 = normalize(vec3(2.5, 3.0, 4.0));
  vec3 L2 = normalize(vec3(-3.5, -1.5, 2.0));
  vec3 L3 = normalize(vec3(0.0, -3.0, -2.0));

  float diff = max(dot(N, L1), 0.0);
  vec3 H1 = normalize(L1 + V);
  float spec1 = pow(max(dot(N, H1), 0.0), 90.0);
  vec3 H2 = normalize(L2 + V);
  float spec2 = pow(max(dot(N, H2), 0.0), 28.0);
  float rim3 = pow(max(dot(N, L3), 0.0), 2.0);

  vec3 irid = palette(fresnel * 1.1 + vDisp * 1.6 + vPos.y * 0.12 + uTime * 0.04);

  vec3 col = uBase * (0.18 + diff * 0.55);
  col += irid * fresnel * 1.15;
  col += vec3(1.0, 0.98, 0.95) * spec1 * 1.1;
  col += uAccent * spec2 * 0.45;
  col += uGlow * rim3 * 0.25;
  col += uAccent * pow(fresnel, 4.5) * (0.5 + uAudio * 0.9);

  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * 0.025;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
