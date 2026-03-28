import { forwardRef } from 'react'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'

interface BallProps {
  radius?: number
  mass?: number
  restitution?: number
  linearDamping?: number
  color?: string
  position?: [number, number, number]
  name?: string
}

export const Ball = forwardRef<RapierRigidBody, BallProps>(function Ball(
  {
    radius = 0.12,
    mass = 0.5,
    restitution = 0.7,
    linearDamping = 0.3,
    color = '#FF6B00',
    position = [0, 1, 0],
    name = 'ball',
  },
  ref
) {
  return (
    <RigidBody
      ref={ref}
      colliders="ball"
      mass={mass}
      restitution={restitution}
      linearDamping={linearDamping}
      position={position}
      name={name}
    >
      <mesh castShadow>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </RigidBody>
  )
})
