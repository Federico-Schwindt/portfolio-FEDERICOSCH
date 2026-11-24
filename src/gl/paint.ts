/**
 * Paint cursor. A small GPU field under the page content: the pointer deposits flat-topped
 * strokes (max, never a sum, so joints do not bead), a slow curl flow swirls them, and a light
 * blur plus constant decay makes thin tails retreat first. The field scrolls with the page.
 * The colour of the paint depends on the section it sits on (bands read from the DOM).
 */
const VERT = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`

const UPDATE = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D prev; uniform vec2 res, a, b; uniform float radius, shift, t, on, dt;
float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.); return length(pa - ba * h); }
vec2 flow(vec2 p){ // cheap divergence-free swirl
  float n1 = sin(p.y * 7. + t * .7) + sin((p.x + p.y) * 5. - t * .5);
  float n2 = cos(p.x * 6. - t * .6) + cos((p.x - p.y) * 4. + t * .4);
  return vec2(n1, n2);
}
void main(){
  vec2 px = 1. / res;
  vec2 q = uv + vec2(0., shift) + flow(uv * vec2(res.x / res.y, 1.)) * px * 0.55;
  float c = texture(prev, q).r;
  float blur = (texture(prev, q + vec2(px.x, 0.)).r + texture(prev, q - vec2(px.x, 0.)).r + texture(prev, q + vec2(0., px.y)).r + texture(prev, q - vec2(0., px.y)).r) * .25;
  float v = mix(c, blur, .42) - dt * .26;
  if (q.y < 0. || q.y > 1.) v = 0.;
  float d = seg(uv * res, a, b);
  float brush = on * smoothstep(radius, radius * .55, d);
  o = vec4(max(v, brush), 0., 0., 1.);
}`

const DRAW = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D field; uniform vec2 res; uniform float bandY[12]; uniform vec3 bandC[12]; uniform int bands; uniform float vh;
void main(){
  vec2 px = 1. / res;
  // 9-tap tent filter: round, crisp contours from a low-res field
  float f = 0.;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) { float w = (i == 0 ? 2. : 1.) * (j == 0 ? 2. : 1.); f += texture(field, uv + vec2(float(i), float(j)) * px).r * w; }
  f /= 16.;
  float aa = fwidth(f) * 1.2 + 1e-4;
  float m = smoothstep(.5 - aa, .5 + aa, f);
  float y = (1. - uv.y) * vh;
  vec3 col = bandC[0];
  for (int i = 0; i < 12; i++) { if (i < bands && y >= bandY[i]) col = bandC[i]; }
  if (col.r < 0.) m = 0.;
  o = vec4(col * m, m);
}`

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]
const PAINT: Record<string, [number, number, number]> = { cream: hex('#fff1e0'), red: hex('#f01111'), ink: hex('#0b0b0b'), none: [-1, 0, 0] } // none: no paint on that stretch

export function initPaint(getScrollY: () => number = () => window.scrollY) {
  const canvas = document.createElement('canvas')
  canvas.className = 'gl-paint'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.prepend(canvas)
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false })
  if (!gl) { canvas.remove(); return }

  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s }
  const prog = (fs: string) => { const p = gl.createProgram()!; gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); return p }
  const update = prog(UPDATE), draw = prog(DRAW)
  const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  const SCALE = 0.3
  let W = 2, H = 2
  let tex: WebGLTexture[] = [], fbo: WebGLFramebuffer[] = [], cur = 0
  const makeTargets = () => {
    tex.forEach((t) => gl.deleteTexture(t)); fbo.forEach((f) => gl.deleteFramebuffer(f))
    tex = []; fbo = []
    for (let i = 0; i < 2; i++) {
      const t = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, W, H, 0, gl.RED, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      const f = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, f)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT)
      tex.push(t); fbo.push(f)
    }
  }
  const resize = () => {
    const dpr = Math.min(devicePixelRatio, 1.5)
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr)
    W = Math.max(2, Math.round(innerWidth * SCALE)); H = Math.max(2, Math.round(innerHeight * SCALE))
    makeTargets()
  }
  resize()
  addEventListener('resize', resize)

  // pointer in viewport px; a = previous, b = current
  let px = -1, py = -1, lx = -1, ly = -1, moved = 0
  addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; px = e.clientX; py = e.clientY; if (lx < 0) { lx = px; ly = py } moved = performance.now(); kick() }, { passive: true })
  document.addEventListener('pointerleave', () => { lx = -1 })

  // section bands: which paint colour each stretch of the viewport gets
  // measured when the layout changes, not every frame: document positions, compared with the scroll
  let bandsDoc: { top: number; bottom: number; col: [number, number, number] }[] = []
  const collect = () => {
    const sy = getScrollY()
    bandsDoc = [...document.querySelectorAll<HTMLElement>('[data-paint]')].map((el) => { const r = el.getBoundingClientRect(); return { top: r.top + sy, bottom: r.bottom + sy, col: PAINT[el.dataset.paint!] ?? PAINT.none } })
  }
  collect()
  addEventListener('resize', collect)
  new ResizeObserver(collect).observe(document.body)
  const bandY = new Float32Array(12), bandC = new Float32Array(36)

  let lastScroll = getScrollY(), lastT = performance.now(), energy = 0
  let running = false
  const kick = () => { if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(frame) } }
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now
    const sy = getScrollY(), dy = sy - lastScroll; lastScroll = sy
    const painting = now - moved < 80 && lx >= 0
    if (painting) energy = 1.6
    energy -= dt
    if (energy < -3) { running = false; return } // the stroke has gone: stop asking for frames until the pointer moves again
    requestAnimationFrame(frame)

    const speed = Math.hypot(px - lx, py - ly)
    const radius = (26 + Math.min(speed, 90) * 0.5) * SCALE * (innerWidth < 900 ? 0.7 : 1)
    // 1) update field
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[1 - cur])
    gl.viewport(0, 0, W, H)
    gl.useProgram(update)
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[cur])
    gl.uniform1i(U(update, 'prev'), 0)
    gl.uniform2f(U(update, 'res'), W, H)
    gl.uniform2f(U(update, 'a'), lx * SCALE, (innerHeight - ly) * SCALE)
    gl.uniform2f(U(update, 'b'), px * SCALE, (innerHeight - py) * SCALE)
    gl.uniform1f(U(update, 'radius'), radius)
    gl.uniform1f(U(update, 'shift'), -dy / innerHeight)
    gl.uniform1f(U(update, 't'), now / 1000)
    gl.uniform1f(U(update, 'dt'), dt)
    gl.uniform1f(U(update, 'on'), painting ? 1 : 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    cur = 1 - cur
    lx = px; ly = py

    // 2) bands
    let n = 0
    for (const s of bandsDoc) {
      const top = s.top - sy, bottom = s.bottom - sy
      if (bottom < 0 || top > innerHeight || n >= 12) continue
      bandY[n] = top
      bandC.set(s.col, n * 3)
      n++
    }
    if (n > 0) bandY[0] = -1e5

    // 3) draw
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(draw)
    gl.bindTexture(gl.TEXTURE_2D, tex[cur])
    gl.uniform1i(U(draw, 'field'), 0)
    gl.uniform2f(U(draw, 'res'), W, H)
    gl.uniform1f(U(draw, 'vh'), innerHeight)
    gl.uniform1i(U(draw, 'bands'), n)
    gl.uniform1fv(U(draw, 'bandY'), bandY)
    gl.uniform3fv(U(draw, 'bandC'), bandC)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
  kick()
  return { refresh: collect }
}
