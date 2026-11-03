export const spriteVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const spriteFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uOffset;
uniform vec2 uScale;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 uv = vUv * uScale + uOffset;
  vec4 c = texture2D(uMap, uv);
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  float alpha = 1.0 - smoothstep(0.84, 0.97, lum) * (1.0 - smoothstep(0.03, 0.12, sat));
  if (alpha < 0.03) discard;
  // subtle scanline / game feel
  float scan = 0.94 + 0.06 * sin(vUv.y * 420.0 + uTime * 2.0);
  gl_FragColor = vec4(c.rgb * scan, alpha);
  #include <colorspace_fragment>
}
`
