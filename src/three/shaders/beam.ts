export const beamVertex = /* glsl */ `
attribute float aSeed;
attribute float aAxis;
varying vec3 vLocal;
varying vec3 vNormalW;
varying vec3 vWorld;
varying vec3 vScale;
varying float vSeed;
varying float vAxis;

void main() {
  vLocal = position;
  vSeed = aSeed;
  vAxis = aAxis;
  vScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

/**
 * A beam of the tesseract: a dark structural member whose faces are covered in
 * fine parallel stripes (the film's extruded bookshelves) with two warm,
 * dotted light rails running along its length.
 */
export const beamFragment = /* glsl */ `
uniform vec3 uCam;
uniform float uFogNear;
uniform float uFogFar;
uniform float uTime;
uniform float uPulse;
uniform float uRedZ;
uniform float uRedMix;
uniform float uGlow;

varying vec3 vLocal;
varying vec3 vNormalW;
varying vec3 vWorld;
varying vec3 vScale;
varying float vSeed;
varying float vAxis;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
  vec3 N = normalize(vNormalW);
  vec3 n = abs(N);
  vec3 lw = vLocal * vScale;
  int axis = int(vAxis + 0.5);

  float u;      // coordinate across the face
  float width;  // face width in world units
  float along;  // coordinate along the beam
  bool cap;
  if (axis == 2) {
    along = lw.z;
    cap = n.z > 0.5;
    if (n.x > 0.5) { u = lw.y; width = vScale.y; } else { u = lw.x; width = vScale.x; }
  } else if (axis == 0) {
    along = lw.x;
    cap = n.x > 0.5;
    if (n.y > 0.5) { u = lw.z; width = vScale.z; } else { u = lw.y; width = vScale.y; }
  } else {
    along = lw.y;
    cap = n.y > 0.5;
    if (n.x > 0.5) { u = lw.z; width = vScale.z; } else { u = lw.x; width = vScale.x; }
  }
  float uc = u / max(width, 0.001); // -0.5 .. 0.5

  // ── fine stripes: the spines of the books (fewer on thin strands) ──
  float stripes = mix(7.0, 24.0, smoothstep(0.18, 0.6, width));
  float sid = floor(uc * stripes);
  float f = fract(uc * stripes);
  // how many screen pixels one stripe covers; below ~1.5 px the stripes dissolve into their average
  float px = 1.0 / max(fwidth(uc * stripes), 1e-4);
  float detail = smoothstep(1.2, 3.5, px);
  float h = hash(sid * 7.13 + vSeed * 91.7);
  float h3 = fract(h * 13.7 + floor(along * 1.3) * 0.37);
  vec3 cream = vec3(0.74, 0.64, 0.48);
  vec3 tan_  = vec3(0.46, 0.34, 0.22);
  vec3 brown = vec3(0.15, 0.10, 0.065);
  vec3 teal  = vec3(0.13, 0.28, 0.26);
  vec3 grey  = vec3(0.33, 0.31, 0.29);
  vec3 col = h < 0.36 ? brown : h < 0.62 ? tan_ : h < 0.78 ? grey : h < 0.9 ? teal : cream;
  float spine = smoothstep(0.0, 0.14, f) * (1.0 - smoothstep(0.86, 1.0, f));
  col *= (0.45 + 0.55 * spine) * (0.75 + 0.5 * h3);
  float dist0 = distance(vWorld, uCam);
  vec3 avg = vec3(0.30, 0.24, 0.17) * (0.75 + 0.25 * fract(vSeed * 7.0));
  col = mix(avg, col, detail);

  // ── light rails: two warm dotted strips along every face ──
  float rail = 1.0 - smoothstep(0.035, 0.06, abs(abs(uc) - 0.27));
  float dots = 0.55 + 0.45 * smoothstep(0.42, 0.3, abs(fract(along * 4.5) - 0.5));
  float flicker = 0.9 + 0.1 * sin(uTime * 3.0 + vSeed * 40.0 + along * 0.7);
  vec3 railCol = vec3(1.0, 0.66, 0.34) * rail * mix(1.0, dots, detail) * flicker * uGlow * (1.0 + uPulse * 0.5);

  // ── shading ──
  vec3 V = normalize(uCam - vWorld);
  float facing = max(dot(N, V), 0.0);
  float key = max(dot(N, normalize(vec3(0.3, 1.0, 0.25))), 0.0);
  float shade = 0.14 + 0.42 * facing + 0.3 * key;
  vec3 c = col * shade;
  if (cap) c = avg * shade * 0.8;
  c += railCol * (cap ? 0.0 : 1.0);

  // ── the shelves burn red near the impact chapter ──
  float nearRed = 1.0 - smoothstep(0.0, 26.0, abs(vWorld.z - uRedZ));
  c = mix(c, vec3(1.0, 0.1, 0.08) * (0.35 + rail * 1.4), nearRed * uRedMix * 0.85);

  // ── fog ──
  float fog = 1.0 - smoothstep(uFogNear, uFogFar, dist0);
  c *= fog;

  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
