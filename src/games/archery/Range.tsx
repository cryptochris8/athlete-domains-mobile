import { ARCHERY_CONFIG } from './config'

export function Range() {
  const { rangeWidth, rangeDepth } = ARCHERY_CONFIG

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -rangeDepth / 2 + 5]} receiveShadow>
        <planeGeometry args={[rangeWidth, rangeDepth]} />
        <meshStandardMaterial color="#4a7c3f" roughness={0.9} />
      </mesh>

      {/* Distance markers on ground */}
      {[5, 10, 15, 20].map((dist) => (
        <mesh key={dist} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -dist + 5]}>
          <planeGeometry args={[rangeWidth - 1, 0.05]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Fence posts */}
      {[-rangeWidth / 2 + 0.5, rangeWidth / 2 - 0.5].map((x) =>
        [0, -5, -10, -15, -20].map((z) => (
          <mesh key={`post-${x}-${z}`} position={[x, 0.75, z + 5]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
            <meshStandardMaterial color="#6B4226" />
          </mesh>
        ))
      )}
    </group>
  )
}
