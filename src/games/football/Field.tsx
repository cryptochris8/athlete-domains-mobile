import { useTexture } from '@react-three/drei'
import { FOOTBALL_CONFIG } from './config'

export function Field() {
  const { fieldWidth, fieldDepth } = FOOTBALL_CONFIG

  return (
    <group>
      {/* Green field ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -fieldDepth / 2 + 5]} receiveShadow>
        <planeGeometry args={[fieldWidth, fieldDepth]} />
        <meshStandardMaterial color="#3d8b37" roughness={0.9} />
      </mesh>

      {/* Yard lines every 5 units */}
      {[5, 10, 15, 20, 25, 30].map((dist) => (
        <mesh key={dist} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -dist + 5]}>
          <planeGeometry args={[fieldWidth - 2, 0.06]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.35} />
        </mesh>
      ))}

      {/* Sideline markers */}
      {[-fieldWidth / 2 + 0.3, fieldWidth / 2 - 0.3].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, -fieldDepth / 2 + 5]}>
          <planeGeometry args={[0.08, fieldDepth]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Midfield logo */}
      <MidfieldLogo position={[0, 0.02, -3]} />

      {/* End zone area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -fieldDepth + 10]}>
        <planeGeometry args={[fieldWidth - 2, 8]} />
        <meshStandardMaterial color="#2d6b2f" roughness={0.9} />
      </mesh>

      {/* NFL-style goal posts at far end */}
      <GoalPosts position={[0, 0, -fieldDepth + 8]} />
    </group>
  )
}

function MidfieldLogo({ position }: { position: [number, number, number] }) {
  const texture = useTexture('/logos/Logo.jpg')
  texture.anisotropy = 16
  texture.needsUpdate = true

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <planeGeometry args={[6, 6]} />
      <meshStandardMaterial map={texture} transparent roughness={0.8} />
    </mesh>
  )
}

function GoalPosts({ position }: { position: [number, number, number] }) {
  const postColor = '#FFD700'
  const postRadius = 0.06
  const crossbarHeight = 3
  const uprightHeight = 5
  const crossbarWidth = 5

  return (
    <group position={position}>
      {/* Single center support pole from ground to crossbar */}
      <mesh position={[0, crossbarHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[postRadius * 1.5, postRadius * 1.5, crossbarHeight, 8]} />
        <meshStandardMaterial color={postColor} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Crossbar */}
      <mesh position={[0, crossbarHeight, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[postRadius, postRadius, crossbarWidth, 8]} />
        <meshStandardMaterial color={postColor} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Left upright above crossbar */}
      <mesh position={[-crossbarWidth / 2, crossbarHeight + uprightHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[postRadius, postRadius, uprightHeight, 8]} />
        <meshStandardMaterial color={postColor} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Right upright above crossbar */}
      <mesh position={[crossbarWidth / 2, crossbarHeight + uprightHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[postRadius, postRadius, uprightHeight, 8]} />
        <meshStandardMaterial color={postColor} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}
