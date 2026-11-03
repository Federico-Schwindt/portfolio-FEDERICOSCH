import { useMemo } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { SPOTS, type WallSpot } from './journey'
import { RED } from './config'
import { about, process, site } from '../content'

const base = import.meta.env.BASE_URL

function textTexture(lines: { text: string; size: number; color: string; font?: string; gap?: number }[], w = 640, h = 400) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#0b0a09'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(244,241,234,0.18)'
  ctx.lineWidth = 2
  ctx.strokeRect(14, 14, w - 28, h - 28)
  let y = 64
  for (const l of lines) {
    ctx.fillStyle = l.color
    ctx.font = `${l.font ?? '500'} ${l.size}px 'Archivo Variable', 'Space Mono', monospace`
    const words = l.text.split(' ')
    let line = ''
    for (const word of words) {
      const test = line ? line + ' ' + word : word
      if (ctx.measureText(test).width > w - 96 && line) {
        ctx.fillText(line, 40, y)
        y += l.size * 1.25
        line = word
      } else line = test
    }
    ctx.fillText(line, 40, y)
    y += l.size * 1.25 + (l.gap ?? 14)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function Tablet({ spot, tex, w = 2.0, h = 1.25 }: { spot: WallSpot; tex: THREE.Texture; w?: number; h?: number }) {
  const frame = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(w + 0.1, h + 0.1)), [w, h])
  return (
    <group position={spot.position} rotation={[0, spot.rotationY, 0]}>
      <mesh position={[0, 0, -0.16]}>
        <boxGeometry args={[w + 0.4, h + 0.4, 0.3]} />
        <meshStandardMaterial color="#070605" roughness={0.9} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <lineSegments geometry={frame} position={[0, 0, 0.004]}>
        <lineBasicMaterial color="#8d8370" toneMapped={false} />
      </lineSegments>
      <pointLight position={[0, 0, 1.2]} color="#fff1dc" intensity={3} distance={5} decay={2} />
    </group>
  )
}

/** Four process steps, as plaques in the walls. */
function ProcessTablets() {
  const texs = useMemo(
    () =>
      process.map((p) =>
        textTexture([
          { text: p.index, size: 30, color: RED, font: '700' },
          { text: p.title.toUpperCase(), size: 56, color: '#f4f1ea', font: '700', gap: 22 },
          { text: p.text, size: 26, color: 'rgba(244,241,234,0.62)' },
        ]),
      ),
    [],
  )
  return (
    <>
      {SPOTS.process.map((spot, i) => (
        <Tablet key={i} spot={spot} tex={texs[i]} />
      ))}
    </>
  )
}

/** Three verified numbers from Freelancer.com, as plaques. */
function TrustTablets() {
  const facts = [about.facts[1], about.facts[0], about.facts[2]]
  const texs = useMemo(
    () =>
      facts.map((f) =>
        textTexture([
          { text: f.value, size: 150, color: '#f4f1ea', font: '700', gap: 6 },
          { text: f.label.toUpperCase(), size: 26, color: RED, font: '600' },
        ]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  return (
    <>
      {SPOTS.trust.map((spot, i) => (
        <Tablet key={i} spot={spot} tex={texs[i]} />
      ))}
    </>
  )
}

/** Federico's portrait set into the wall, like a photo on the shelf. */
function Portrait() {
  const spot = SPOTS.about
  const tex = useTexture(base + 'char/portrait.jpg')
  tex.colorSpace = THREE.SRGBColorSpace
  const w = 2.4
  const h = 3.2
  const frame = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(w + 0.12, h + 0.12)), [])
  const caption = useMemo(() => textTexture([{ text: site.name.toUpperCase(), size: 40, color: '#f4f1ea', font: '700', gap: 4 }, { text: site.city.toUpperCase(), size: 24, color: 'rgba(244,241,234,0.6)' }], 640, 160), [])
  return (
    <group position={spot.position} rotation={[0, spot.rotationY, 0]}>
      <mesh position={[0, 0, -0.22]}>
        <boxGeometry args={[w + 0.7, h + 0.7, 0.4]} />
        <meshStandardMaterial color="#070605" roughness={0.9} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <lineSegments geometry={frame} position={[0, 0, 0.004]}>
        <lineBasicMaterial color="#c9bda6" toneMapped={false} />
      </lineSegments>
      <mesh position={[0, -h / 2 - 0.5, 0]}>
        <planeGeometry args={[2.4, 0.6]} />
        <meshBasicMaterial map={caption} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.5, 1.8]} color="#fff1dc" intensity={10} distance={7} decay={2} />
    </group>
  )
}

export function WallPanels({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      <ProcessTablets />
      <TrustTablets />
      <Portrait />
    </group>
  )
}

useTexture.preload(base + 'char/portrait.jpg')
