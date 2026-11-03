export const particlesVertex = /* glsl */ `
attribute float aScale;
attribute float aSpeed;
attribute float aOffset;
uniform float uTime;
uniform float uPixelRatio;
uniform vec2 uParallax;
uniform float uScroll;
uniform float uSize;
varying float vAlpha;

void main() {
  vec3 p = position;
  float range = 22.0;
  p.y = mod(p.y + uTime * aSpeed * 0.12 + uScroll * (0.6 + aSpeed * 0.8) + range * 0.5, range) - range * 0.5;
  p.x += sin(uTime * 0.25 + aOffset) * 0.25;
  p.xy += uParallax * (0.25 + aScale * 0.6);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float depth = -mv.z;
  gl_PointSize = aScale * uSize * uPixelRatio * (10.0 / depth);
  gl_Position = projectionMatrix * mv;
  float twinkle = 0.6 + 0.4 * sin(uTime * (0.8 + aSpeed) + aOffset * 7.0);
  vAlpha = smoothstep(26.0, 8.0, depth) * twinkle;
}
`

export const particlesFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uColor2;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float a = smoothstep(0.5, 0.05, d);
  float core = smoothstep(0.18, 0.0, d);
  vec3 col = mix(uColor, uColor2, core);
  gl_FragColor = vec4(col, a * vAlpha * 0.9);
  #include <colorspace_fragment>
}
`
