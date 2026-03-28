import { RigidBody } from '@react-three/rapier'

interface GroundProps {
  color?: string
  size?: [number, number]
}

export function Ground({ color = '#4CAF50', size = [50, 50] }: GroundProps) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[size[0], size[1], 0.1]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </RigidBody>
  )
}
