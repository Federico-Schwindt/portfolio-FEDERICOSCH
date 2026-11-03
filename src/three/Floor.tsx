import { Grid, MeshReflectorMaterial } from '@react-three/drei'
import { BG } from './config'

export function Floor({ reflective = true }: { reflective?: boolean }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, -20]}>
        <planeGeometry args={[160, 160]} />
        {reflective ? (
          <MeshReflectorMaterial
            blur={[360, 120]}
            resolution={1024}
            mixBlur={1}
            mixStrength={4}
            roughness={0.92}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#070707"
            metalness={0.55}
            mirror={0.55}
          />
        ) : (
          <meshStandardMaterial color={BG} roughness={1} metalness={0} />
        )}
      </mesh>
      <Grid
        position={[0, 0.001, -20]}
        args={[160, 160]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#161313"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3a1212"
        fadeDistance={34}
        fadeStrength={2.2}
        infiniteGrid
      />
    </group>
  )
}
