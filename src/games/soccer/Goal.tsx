import { useCallback, useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody, CuboidCollider, type IntersectionEnterPayload } from '@react-three/rapier'
import * as THREE from 'three'
import { SOCCER_CONFIG } from './config'

const GOAL_MODEL_PATH = '/models/football_goal_post.glb'
// Model is ~6.4m wide, ~2.44m tall, ~2.6m deep
// Scale X to match FIFA goalWidth (7.32m), Y/Z are already correct
const MODEL_WIDTH = 6.4
const GOAL_SCALE_X = SOCCER_CONFIG.goalWidth / MODEL_WIDTH
// Model posts are at Z≈+1.3 in local space; shift back so posts align with goal line
const GOAL_MODEL_Z_OFFSET = -1.3

interface GoalProps {
  onGoalScored: () => void
}

export function Goal({ onGoalScored }: GoalProps) {
  const { goalWidth, goalHeight, goalDepth, goalPosition } = SOCCER_CONFIG
  const { scene } = useGLTF(GOAL_MODEL_PATH)
  const clonedScene = useMemo(() => scene.clone(), [scene])

  useEffect(() => {
    return () => {
      clonedScene.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh
          mesh.geometry?.dispose()
          if (mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial
            mat.map?.dispose()
            mat.dispose()
          }
        }
      })
    }
  }, [clonedScene])

  const handleIntersection = useCallback((payload: IntersectionEnterPayload) => {
    const otherName = payload.other.rigidBodyObject?.name
    if (otherName === 'soccerball') {
      onGoalScored()
    }
  }, [onGoalScored])

  return (
    <group position={goalPosition}>
      {/* 3D model — shifted so posts align with goal line */}
      <primitive object={clonedScene} scale={[GOAL_SCALE_X, 1, 1]} position={[0, 0, GOAL_MODEL_Z_OFFSET]} castShadow />

      {/* Goal sensor (detect ball entering) */}
      <RigidBody type="fixed" sensor onIntersectionEnter={handleIntersection}>
        <CuboidCollider
          args={[goalWidth / 2 - 0.1, goalHeight / 2 - 0.1, 0.1]}
          position={[0, goalHeight / 2, -0.5]}
        />
      </RigidBody>

      {/* Back wall to stop ball */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, goalHeight / 2, -goalDepth]} visible={false}>
          <boxGeometry args={[goalWidth + 1, goalHeight + 1, 0.2]} />
        </mesh>
      </RigidBody>

      {/* Left post collider */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0.8}>
        <mesh position={[-goalWidth / 2, goalHeight / 2, 0]} visible={false}>
          <boxGeometry args={[0.12, goalHeight, 0.12]} />
        </mesh>
      </RigidBody>

      {/* Right post collider */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0.8}>
        <mesh position={[goalWidth / 2, goalHeight / 2, 0]} visible={false}>
          <boxGeometry args={[0.12, goalHeight, 0.12]} />
        </mesh>
      </RigidBody>

      {/* Crossbar collider */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0.8}>
        <mesh position={[0, goalHeight, 0]} visible={false}>
          <boxGeometry args={[goalWidth, 0.12, 0.12]} />
        </mesh>
      </RigidBody>
    </group>
  )
}

useGLTF.preload(GOAL_MODEL_PATH)
