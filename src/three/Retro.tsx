import { Suspense, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Html, Lightformer, RoundedBox } from '@react-three/drei'
import { pointer, xpProgress } from '../lib/store'
import { useIsMobile, useReducedMotion } from '../lib/hooks'
import { Desktop } from '../components/Desktop'

/**
 * The retro computer. A chunky early-2000s all-in-one, modelled from primitives
 * (rounded boxes, a bulged CRT glass, vents, a power button) and lit by a
 * studio environment. The screen is a live DOM "Windows XP" desktop, rendered
 * with drei's <Html transform>, so it is real, clickable UI: windows open and
 * drag inside the monitor while the monitor itself sits in 3D.
 *
 * Scroll drives one cinematic move: the camera starts inside the screen (the
 * desktop fills the viewport), pulls back and tilts down until the whole
 * machine sits on the desk, then eases to a three-quarter hero angle.
 */

const SCREEN_W = 3.2
const SCREEN_H = 2.4
const BLUE = '#8fb7e6'
const BLUE_DARK = '#6f98c9'
const BLUE_LIGHT = '#aacbf0'

const ease = (t: number) => t * t * (3 - 2 * t)

function CameraRig() {
  const { camera } = useThree()
  const reduced = useReducedMotion()
  const isMobile = useIsMobile()
  const pos = useRef(new THREE.Vector3(0, 0.95, 3.0))
  const look = useRef(new THREE.Vector3(0, 0.95, 0))
  const tPos = useRef(new THREE.Vector3())
  const tLook = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const p = xpProgress.current
    const e = state.clock.elapsedTime
    // keyframes: 0 → face-on, screen fills the viewport (desktop at z≈0.33)
    //            0.55 → full monitor, straight on
    //            1 → three-quarter angle, slightly above
    const k1 = ease(Math.min(p / 0.55, 1))
    const k2 = ease(Math.max((p - 0.55) / 0.45, 0))
    // at p=0 the desktop fills the viewport: fit the screen to the shorter axis
    const cam = camera as THREE.PerspectiveCamera
    const t = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)
    const dW = SCREEN_W / (2 * t * cam.aspect)
    const dH = SCREEN_H / (2 * t)
    const z0 = 0.235 + Math.min(dW, dH) * 0.985
    // pull back far enough that the whole machine fits, whatever the aspect ratio
    const z1 = Math.max(7.2, 6.2 / (2 * t * cam.aspect))
    tPos.current.set(0, 0.95, z0 + (z1 - z0) * k1)
    tLook.current.set(0, 0.95, 0)
    // three-quarter, slightly above
    const ang = (isMobile ? -0.3 : -0.42) * k2
    const r = tPos.current.z
    tPos.current.set(Math.sin(ang) * r, 0.95 + (isMobile ? 0.7 : 1.0) * k2, Math.cos(ang) * r)
    tLook.current.set(0, 0.95 - 0.3 * k2, 0)
    // pointer parallax once the machine is visible
    const par = k1 * (reduced ? 0 : 1)
    tPos.current.x += pointer.x * 0.35 * par
    tPos.current.y += pointer.y * 0.18 * par
    // idle breathing
    tPos.current.y += Math.sin(e * 0.5) * 0.02 * par
    const k = 1 - Math.pow(0.002, dt)
    pos.current.lerp(tPos.current, k)
    look.current.lerp(tLook.current, k)
    camera.position.copy(pos.current)
    camera.lookAt(look.current)
  })
  return null
}

/**
 * Keeps the DOM layer that holds the desktop glued to the section.
 *
 * Chromium hit-tests CSS3D (perspective + preserve-3d) content incorrectly as soon
 * as the layer's layout position in the viewport is fractional, and that is
 * exactly what a GSAP pin (`top: -0.48px`) or a smooth-scrolled section produces:
 * clicks land hundreds of pixels away from the painted desktop. Transform offsets
 * do not trigger the bug, so the layer is portalled to <body>, `position: fixed`
 * at 0,0 (an integer layout position) and follows the section with a translate.
 */
function LayerSync({ portal }: { portal: RefObject<HTMLDivElement | null> }) {
  const gl = useThree((s) => s.gl)
  const section = useRef<HTMLElement | null>(null)
  const last = useRef('')
  useFrame(() => {
    const el = portal.current
    if (!el) return
    if (!section.current) section.current = (gl.domElement.closest('.xp') as HTMLElement | null) ?? gl.domElement.parentElement
    const r = (section.current ?? gl.domElement).getBoundingClientRect()
    const off = r.bottom <= 0 || r.top >= window.innerHeight
    const t = off ? 'hidden' : `translate3d(${Math.round(r.left)}px, ${Math.round(r.top)}px, 0)`
    if (t === last.current) return
    last.current = t
    el.style.visibility = off ? 'hidden' : ''
    if (!off) el.style.transform = t
  })
  return null
}

function Machine({ portal }: { portal: RefObject<HTMLDivElement | null> }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    const e = state.clock.elapsedTime
    if (group.current) group.current.rotation.y = Math.sin(e * 0.25) * 0.01
  })
  const plastic = <meshStandardMaterial color={BLUE} roughness={0.45} metalness={0.05} envMapIntensity={0.9} />
  return (
    <group ref={group}>
      {/* monitor shell */}
      <group position={[0, 0.95, 0]}>
        <RoundedBox args={[4.4, 3.5, 2.6]} radius={0.16} smoothness={6} position={[0, 0, -1.3]}>
          {plastic}
        </RoundedBox>
        {/* bezel: a frame around the screen, slightly proud of the shell */}
        <RoundedBox args={[4.1, 3.2, 0.26]} radius={0.1} smoothness={5} position={[0, 0, 0.1]}>
          <meshStandardMaterial color={BLUE_LIGHT} roughness={0.5} metalness={0.03} envMapIntensity={0.8} />
        </RoundedBox>
        {/* the dark recess the screen sits in */}
        <mesh position={[0, 0, 0.225]}>
          <planeGeometry args={[SCREEN_W + 0.28, SCREEN_H + 0.28]} />
          <meshStandardMaterial color="#060810" roughness={0.9} />
        </mesh>
        {/* the live desktop: real DOM, CSS3D-transformed to sit on the screen plane */}
        <Html transform portal={portal as RefObject<HTMLElement>} position={[0, 0, 0.235]} distanceFactor={1} style={{ width: SCREEN_W * 400 + 'px', height: SCREEN_H * 400 + 'px' }}>
          <Desktop />
        </Html>
        {/* vent */}
        <group position={[-1.55, -1.52, 0.1]}>
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={i} position={[i * 0.085, 0, 0]}>
              <boxGeometry args={[0.035, 0.22, 0.06]} />
              <meshStandardMaterial color={BLUE_DARK} roughness={0.6} />
            </mesh>
          ))}
        </group>
        {/* power button + LED */}
        <RoundedBox args={[0.34, 0.28, 0.08]} radius={0.04} position={[1.55, -1.52, 0.14]}>
          <meshStandardMaterial color={BLUE_LIGHT} roughness={0.4} />
        </RoundedBox>
        <mesh position={[1.72, -1.4, 0.19]}>
          <circleGeometry args={[0.025, 12]} />
          <meshBasicMaterial color="#8cff5a" toneMapped={false} />
        </mesh>
        {/* badge */}
        <mesh position={[-1.75, -1.42, 0.24]}>
          <planeGeometry args={[0.42, 0.1]} />
          <meshStandardMaterial color="#e8eef6" roughness={0.5} />
        </mesh>
      </group>
      {/* foot */}
      <RoundedBox args={[3.4, 0.22, 1.9]} radius={0.08} position={[0, -0.95, -0.9]}>
        {plastic}
      </RoundedBox>
      <RoundedBox args={[1.4, 0.35, 1.0]} radius={0.08} position={[0, -0.75, -0.9]}>
        <meshStandardMaterial color={BLUE_DARK} roughness={0.5} />
      </RoundedBox>
      {/* keyboard */}
      <group position={[0, -1.06, 1.75]} rotation={[0.06, 0, 0]}>
        <RoundedBox args={[3.6, 0.14, 1.25]} radius={0.05}>
          <meshStandardMaterial color={BLUE_LIGHT} roughness={0.55} />
        </RoundedBox>
        <Keys />
      </group>
      {/* mouse */}
      <group position={[2.5, -1.08, 1.6]} rotation={[0, -0.3, 0]}>
        <RoundedBox args={[0.42, 0.18, 0.7]} radius={0.09}>
          <meshStandardMaterial color={BLUE_LIGHT} roughness={0.45} />
        </RoundedBox>
        <mesh position={[0, 0.1, -0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.03, 0.14]} />
          <meshStandardMaterial color={BLUE_DARK} />
        </mesh>
      </group>
      {/* desk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.14, 0.4]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#f3f0ea" roughness={0.95} />
      </mesh>
    </group>
  )
}

function Keys() {
  const rows = [14, 14, 13, 12]
  return (
    <group position={[0, 0.09, 0]}>
      {rows.map((n, r) => (
        <group key={r} position={[0, 0, -0.42 + r * 0.26]}>
          {Array.from({ length: n }).map((_, i) => (
            <RoundedBox key={i} args={[0.19, 0.06, 0.19]} radius={0.02} position={[(i - (n - 1) / 2) * 0.235, 0, 0]}>
              <meshStandardMaterial color="#e9eef5" roughness={0.6} />
            </RoundedBox>
          ))}
        </group>
      ))}
      <RoundedBox args={[1.3, 0.06, 0.19]} radius={0.02} position={[0, 0, 0.62]}>
        <meshStandardMaterial color="#e9eef5" roughness={0.6} />
      </RoundedBox>
    </group>
  )
}

export function Retro() {
  const isMobile = useIsMobile()
  const [dpr] = useState(() => Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2))
  const portal = useRef<HTMLDivElement>(null)
  return (
    <>
    {createPortal(<div ref={portal} className="xp__html" aria-label="Desktop" />, document.body)}
    <Canvas
      dpr={dpr}
      camera={{ fov: 32, position: [0, 0.95, 3], near: 0.1, far: 60 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      style={{ background: 'transparent' }}
      eventPrefix="client"
    >
      <Suspense fallback={null}>
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={2.6} color="#ffffff" position={[0, 6, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 6, 1]} />
          <Lightformer intensity={1.2} color="#ffffff" position={[-6, 2, 3]} rotation={[0, Math.PI / 2, 0]} scale={[5, 4, 1]} />
          <Lightformer intensity={1.6} color="#ffe9d8" position={[6, 1, 3]} rotation={[0, -Math.PI / 2, 0]} scale={[5, 4, 1]} />
          <Lightformer intensity={0.5} color="#dfe8ff" position={[0, 2, -8]} scale={[12, 6, 1]} />
        </Environment>
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 7, 5]} intensity={1.6} color="#fff6ea" />
        <Machine portal={portal} />
        <LayerSync portal={portal} />
        <ContactShadows position={[0, -1.13, 0.4]} opacity={0.45} scale={14} blur={2.4} far={3} color="#1a2230" />
      </Suspense>
      <CameraRig />
    </Canvas>
    </>
  )
}
