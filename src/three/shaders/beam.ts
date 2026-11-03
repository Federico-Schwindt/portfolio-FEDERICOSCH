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
 * A beam of the tesseract: a bookshelf extruded through time. Every face is
 * mapped with the shelf texture along the beam, smeared along its length the
 * way the film stretches the room, with warm light strands running between
 * the shelves.
 */
export const beamFragment = /* glsl */ `
uniform sampler2D uBooks;
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

void main() {
  vec3 N = normalize(vNormalW);
  vec3 n = abs(N);
  vec3 lw = vLocal * vScale;
  int axis = int(vAxis + 0.5);

  float u;      // across the face
  float width;  // face width (world units)
  float along;  // along the beam (world units)
  bool cap;
  if (axis == 2) {
    along = lw.z; cap = n.z > 0.5;
    if (n.x > 0.5) { u = lw.y; width = vScale.y; } else { u = lw.x; width = vScale.x; }
  } else if (axis == 0) {
    along = lw.x; cap = n.x > 0.5;
    if (n.y > 0.5) { u = lw.z; width = vScale.z; } else { u = lw.y; width = vScale.y; }
  } else {
    along = lw.y; cap = n.y > 0.5;
    if (n.x > 0.5) { u = lw.z; width = vScale.z; } else { u = lw.x; width = vScale.x; }
  }
  float uc = u / max(width, 0.001) + 0.5; // 0..1 across

  // ── the shelf texture, one row of books per thin strand, several per thick beam ──
  float rowsAcross = clamp(floor(width / 0.26), 1.0, 4.0);
  float vTex = (uc * rowsAcross + floor(vSeed * 4.0)) * 0.25;
  float xTex = along * 0.42 + vSeed * 7.0;
  // smear along the beam: the room stretched through time
  vec3 books = vec3(0.0);
  for (int i = -2; i <= 2; i++) {
    books += texture2D(uBooks, vec2(xTex + float(i) * 0.012, vTex)).rgb;
  }
  books /= 5.0;
  vec3 crisp = texture2D(uBooks, vec2(xTex, vTex)).rgb;
  float dist0 = distance(vWorld, uCam);
  float near = 1.0 - smoothstep(4.0, 18.0, dist0);
  vec3 col = mix(books, crisp, near * 0.55);

  // ── light strands between the shelves ──
  float rail = 1.0 - smoothstep(0.03, 0.055, abs(fract(uc * rowsAcross) - 0.06));
  float travel = 0.6 + 0.4 * smoothstep(0.45, 0.3, abs(fract(along * 0.35 - uTime * 0.15 + vSeed) - 0.5));
  vec3 railCol = vec3(1.0, 0.78, 0.48) * rail * travel * uGlow * (1.0 + uPulse * 0.5);

  // ── shading ──
  vec3 V = normalize(uCam - vWorld);
  float facing = max(dot(N, V), 0.0);
  float key = max(dot(N, normalize(vec3(0.3, 1.0, 0.25))), 0.0);
  float shade = 0.35 + 0.45 * facing + 0.35 * key;
  vec3 c = col * shade * 1.15;
  if (cap) c = col * 0.35 * shade;
  c += railCol * (cap ? 0.0 : 1.0);

  // ── the shelves burn red near the impact chapter ──
  float nearRed = 1.0 - smoothstep(0.0, 26.0, abs(vWorld.z - uRedZ));
  c = mix(c, vec3(1.0, 0.1, 0.08) * (0.35 + rail * 1.4), nearRed * uRedMix * 0.85);

  float fog = 1.0 - smoothstep(uFogNear, uFogFar, dist0);
  c *= fog;
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
