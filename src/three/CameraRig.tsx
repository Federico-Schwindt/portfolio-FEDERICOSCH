import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { ACT_SPLIT, ALL_SPOTS, ASTRONAUT_END, cameraAt, LEAD, lineAt, pToA, shipAt, STATIONS, TESSERACT_ORIGIN } from './journey'
import { journeyProgress, pointer, useStore } from '../lib/store'
import type { SceneMode } from './World'

const STATIC: Record<Exclude<SceneMode, 'home'>, { pos: [number, number, number]; look: [number, number, number] }> = {
  ambient: { pos: [0, 2, 26], look: [4, 1.5, 0] },
  lab: { pos: [0, 1.0, 7], look: [0, 1.0, 0] },
}

const smooth = (t: number) => t * t * (3 - 2 * t)

export function CameraRig({ mode }: { mode: SceneMode }) {
  const { camera } = useThree()
  const pos = useRef(new THREE.Vector3(16, 14, 165))
  const look = useRef(new THREE.Vector3(0, 0, 0))
  const tPos = useRef(new THREE.Vector3())
  const tLook = useRef(new THREE.Vector3())
  const p0 = useRef(new THREE.Vector3())
  const d0 = useRef(new THREE.Vector3())
  const side = useRef(new THREE.Vector3())
  const upV = useRef(new THREE.Vector3(0, 1, 0))
  const zPos = useRef(new THREE.Vector3())
  const zLook = useRef(new THREE.Vector3())
  const spotW = useRef(new THREE.Vector3())
  const lastAct = useRef(0)
  const intro = useRef(0)
  const entered = useStore((s) => s.entered)
  const roll = useRef(0)

  useEffect(() => {
    lastAct.current = 0
    if (mode !== 'home') {
      const s = STATIC[mode]
      pos.current.set(...s.pos)
      look.current.set(...s.look)
    }
  }, [mode])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const e = state.clock.elapsedTime
    let snap = false
    let targetRoll = 0
    let act2 = false

    if (mode === 'home') {
      const p = journeyProgress()
      const act = p < ACT_SPLIT ? 1 : 2
      act2 = act === 2
      if (act !== lastAct.current) {
        snap = true
        lastAct.current = act
      }
      if (entered && intro.current < 1) intro.current = Math.min(intro.current + dt / 3, 1)
      const introEase = 1 - Math.pow(1 - intro.current, 3)

      if (act === 1) {
        // chase the ship from behind and above; pull back for the title shot
        shipAt(p, p0.current, d0.current)
        side.current.crossVectors(d0.current, upV.current).normalize()
        const back = 11 + (1 - introEase) * 10 + (1 - Math.min(p / 0.12, 1)) * 6
        const up = 2.2 + (1 - introEase) * 2.4
        const sway = Math.sin(e * 0.35) * 0.5
        tPos.current.copy(p0.current).addScaledVector(d0.current, -back).addScaledVector(upV.current, up).addScaledVector(side.current, sway - 3.2)
        tLook.current.copy(p0.current).addScaledVector(d0.current, 5).addScaledVector(side.current, 0.6).addScaledVector(upV.current, 0.4)
        targetRoll = -d0.current.x * 0.3 + Math.sin(e * 0.4) * 0.012
      } else {
        // follow the astronaut along the red line
        const a = pToA(p)
        const astroA = Math.min(a + LEAD, ASTRONAUT_END)
        lineAt(astroA, p0.current, d0.current)
        side.current.crossVectors(d0.current, upV.current).normalize()
        cameraAt(a, tPos.current).add(TESSERACT_ORIGIN).addScaledVector(side.current, Math.sin(e * 0.3) * 0.25)
        tLook.current.copy(p0.current).add(TESSERACT_ORIGIN).addScaledVector(d0.current, 4).addScaledVector(upV.current, 0.8)

        // turn to look at whatever is mounted in the wall at this station
        let best = 0
        let spot = ALL_SPOTS[0]
        for (const s of ALL_SPOTS) {
          // the window is centred a little before the panel so the camera is still behind it when it turns
          const w = 1 - Math.min(Math.abs(a - (s.a - 0.02)) / 0.032, 1)
          if (w > best) {
            best = w
            spot = s
          }
        }
        if (best > 0) {
          const k = smooth(best)
          spotW.current.copy(spot.position).add(TESSERACT_ORIGIN)
          tLook.current.lerp(spotW.current, k * 0.9)
          // back away from the wall so the panel is framed; small plaques need more room
          tPos.current.addScaledVector(spot.normal, k * (spot.radius < 2 ? 2.2 : 1.3))
          tPos.current.y += k * (spot.position.y + TESSERACT_ORIGIN.y - tPos.current.y) * 0.5
        }

        // the impact chapter: a slow, unsettling roll as the shelves burn
        const wImpact = 1 - Math.min(Math.abs(a - STATIONS.impact) / 0.05, 1)
        targetRoll = Math.sin(e * 0.25) * 0.01 + smooth(wImpact) * Math.sin(e * 0.55) * 0.09
      }

      const zoom = useStore.getState().zoom
      if (zoom) {
        zPos.current.copy(zoom.pos)
        zLook.current.copy(zoom.look)
        const kl = Math.min(zoom.t * 1.6, 1)
        const kLook = kl * kl * (3 - 2 * kl)
        const kp = zoom.t * zoom.t * (3 - 2 * zoom.t)
        tPos.current.lerp(zPos.current, kp)
        tLook.current.lerp(zLook.current, kLook)
      }
    } else {
      const s = STATIC[mode]
      tPos.current.set(s.pos[0] + Math.sin(e * 0.15) * 0.6, s.pos[1] + Math.sin(e * 0.2) * 0.2, s.pos[2])
      tLook.current.set(...s.look)
    }

    tPos.current.x += pointer.x * (act2 ? 0.2 : 0.35)
    tPos.current.y += pointer.y * 0.15
    tLook.current.x += pointer.x * 0.15

    if (snap) {
      pos.current.copy(tPos.current)
      look.current.copy(tLook.current)
    } else {
      const k = 1 - Math.pow(0.004, dt)
      pos.current.lerp(tPos.current, k)
      look.current.lerp(tLook.current, k)
    }
    roll.current += (targetRoll - roll.current) * Math.min(dt * 2, 1)
    camera.position.copy(pos.current)
    camera.up.set(Math.sin(roll.current), Math.cos(roll.current), 0)
    camera.lookAt(look.current)
  })

  return null
}
