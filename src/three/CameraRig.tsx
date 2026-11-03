import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { HOME_PATH, samplePath } from './path'
import { journeyProgress, pointer, useStore } from '../lib/store'
import type { SceneMode } from './World'

const STATIC: Record<Exclude<SceneMode, 'home'>, { pos: [number, number, number]; look: [number, number, number] }> = {
  about: { pos: [0.6, 1.35, 5.2], look: [0.9, 1.0, 0] },
  contact: { pos: [0, 1.2, 6], look: [0, 1.0, 0] },
  lab: { pos: [0, 1.0, 7], look: [0, 1.0, 0] },
  ambient: { pos: [0, 1.0, 6], look: [0, 1.0, 0] },
}

export function CameraRig({ mode }: { mode: SceneMode }) {
  const { camera } = useThree()
  const pos = useRef(new THREE.Vector3(0.2, 4.0, 0.4))
  const look = useRef(new THREE.Vector3(-0.7, 3.8, -2.3))
  const tPos = useRef(new THREE.Vector3())
  const tLook = useRef(new THREE.Vector3())
  const zPos = useRef(new THREE.Vector3())
  const zLook = useRef(new THREE.Vector3())
  const intro = useRef(0)
  const entered = useStore((s) => s.entered)

  useEffect(() => {
    // snap on mode change so sub-pages don't fly in from the home path
    if (mode !== 'home') {
      const s = STATIC[mode]
      pos.current.set(...s.pos)
      look.current.set(...s.look)
    } else {
      samplePath(HOME_PATH, journeyProgress(), pos.current, look.current)
    }
  }, [mode])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const e = state.clock.elapsedTime

    if (mode === 'home') {
      samplePath(HOME_PATH, journeyProgress(), tPos.current, tLook.current)
      // cinematic settle after entering
      if (entered && intro.current < 1) intro.current = Math.min(intro.current + dt / 2.2, 1)
      const introEase = 1 - Math.pow(1 - intro.current, 3)
      tPos.current.z += (1 - introEase) * 1.4
      tPos.current.y += (1 - introEase) * 0.25
      const zoom = useStore.getState().zoom
      if (zoom) {
        zPos.current.copy(zoom.pos)
        zLook.current.copy(zoom.look)
        // turn toward the screen first, then dolly in
        const kl = Math.min(zoom.t * 1.6, 1)
        const kLook = kl * kl * (3 - 2 * kl)
        const kp = zoom.t * zoom.t * (3 - 2 * zoom.t)
        tPos.current.lerp(zPos.current, kp)
        tLook.current.lerp(zLook.current, kLook)
      }
    } else {
      const s = STATIC[mode]
      tPos.current.set(s.pos[0] + Math.sin(e * 0.18) * 0.25, s.pos[1] + Math.sin(e * 0.23) * 0.08, s.pos[2])
      tLook.current.set(...s.look)
    }

    // mouse parallax
    tPos.current.x += pointer.x * 0.22
    tPos.current.y += pointer.y * 0.12
    tLook.current.x += pointer.x * 0.08

    const k = 1 - Math.pow(0.0025, dt)
    pos.current.lerp(tPos.current, k)
    look.current.lerp(tLook.current, k)
    camera.position.copy(pos.current)
    camera.lookAt(look.current)
  })

  return null
}
