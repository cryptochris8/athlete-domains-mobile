import { RigidBody } from '@react-three/rapier'
import { SOCCER_CONFIG } from './config'

export function Field() {
  const { fieldWidth, fieldLength } = SOCCER_CONFIG

  return (
    <group>
      {/* Grass field */}
      <RigidBody type="fixed" colliders="cuboid" friction={0.6} restitution={0.3}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[fieldWidth, fieldLength, 0.1]} />
          <meshStandardMaterial color="#4CAF50" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Penalty spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 2]} receiveShadow>
        <circleGeometry args={[0.12, 16]} />
        <meshStandardMaterial color="#fff" />
      </mesh>

      {/* Penalty area lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -4]}>
        <planeGeometry args={[10, 0.05]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {[-5, 5].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.001, -6]}>
          <planeGeometry args={[0.05, 4]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
      ))}

      {/* Goal area lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -6]}>
        <planeGeometry args={[6, 0.05]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
    </group>
  )
}
