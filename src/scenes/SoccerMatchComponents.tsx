import { useCallback, useMemo, Suspense, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { RigidBody, CuboidCollider, CapsuleCollider, type RapierRigidBody, type IntersectionEnterPayload } from '@react-three/rapier'
import { HytopiaAvatar, type AnimationState } from '@/components/HytopiaAvatar'
import { SOCCER_CONFIG } from '@/games/soccer/config'

// ─── Field Constants ─────────────────────────────────────────────
export const MATCH_FIELD = {
  width: 60,   // X axis (sideline to sideline)
  length: 90,  // Z axis (goal to goal)
  halfWidth: 30,
  halfLength: 45,
  goalWidth: SOCCER_CONFIG.goalWidth,
  goalHeight: SOCCER_CONFIG.goalHeight,
  goalDepth: SOCCER_CONFIG.goalDepth,
} as const

export const PLAYER_SPEED = 8
export const BALL_RADIUS = 0.22
export const AI_SPEED = 6

// ─── Field line material (shared) ────────────────────────────────
const LINE_W = 0.15
const LINE_Y = 0.01

function FieldLine({ args, position }: { args: [number, number]; position: [number, number, number] }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <planeGeometry args={args} />
      <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.15} />
    </mesh>
  )
}

// ─── Match Field ─────────────────────────────────────────────────
export function MatchField() {
  const { width, length, halfWidth, halfLength } = MATCH_FIELD
  const penW = 16.5 * 2     // Penalty area width
  const penD = 16.5          // Penalty area depth
  const goalAreaW = 18.32    // 6-yard box width
  const goalAreaD = 5.5      // 6-yard box depth
  const penSpotDist = 11     // Penalty spot distance from goal line
  const penArcR = 9.15       // Penalty arc radius from penalty spot
  const cornerR = 1          // Corner arc radius

  return (
    <group>
      {/* Grass — playing area */}
      <RigidBody type="fixed" colliders="cuboid" friction={0.6} restitution={0.3}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[width + 10, length + 10, 0.1]} />
          <meshStandardMaterial color="#4CAF50" roughness={0.9} />
        </mesh>
      </RigidBody>
      {/* Darker border strip outside playing area */}
      {[
        [-halfWidth - 3.5, 0, width + 10, 3] as const,   // left
        [halfWidth + 3.5, 0, width + 10, 3] as const,    // right (mirror)
      ].map(([x, z, , w], i) => (
        <mesh key={`side-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.04, z]}>
          <planeGeometry args={[w, length + 10]} />
          <meshStandardMaterial color="#3B8C40" roughness={1} />
        </mesh>
      ))}
      {[
        [0, -halfLength - 3.5, width + 10, 3] as const,
        [0, halfLength + 3.5, width + 10, 3] as const,
      ].map(([x, z, w, h], i) => (
        <mesh key={`end-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.04, z]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#3B8C40" roughness={1} />
        </mesh>
      ))}

      {/* ── Center markings ── */}
      <FieldLine args={[width, LINE_W]} position={[0, LINE_Y, 0]} />
      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LINE_Y, 0]}>
        <ringGeometry args={[9, 9 + LINE_W, 48]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.15} />
      </mesh>
      {/* Center spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LINE_Y, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.15} />
      </mesh>

      {/* ── Sidelines ── */}
      {[-halfWidth, halfWidth].map((x) => (
        <FieldLine key={`side-${x}`} args={[LINE_W, length]} position={[x, LINE_Y, 0]} />
      ))}

      {/* ── Goal lines ── */}
      {[-halfLength, halfLength].map((z) => (
        <FieldLine key={`goal-${z}`} args={[width, LINE_W]} position={[0, LINE_Y, z]} />
      ))}

      {/* ── Penalty areas + Goal areas + Spots + Arcs per end ── */}
      {([-1, 1] as const).map((sign) => {
        const goalLineZ = sign * halfLength
        return (
          <group key={`pen-${sign}`}>
            {/* Penalty area (18-yard box) */}
            <FieldLine args={[penW, LINE_W]} position={[0, LINE_Y, goalLineZ - sign * penD]} />
            {[-penW / 2, penW / 2].map((x) => (
              <FieldLine key={`penside-${x}`} args={[LINE_W, penD]} position={[x, LINE_Y, goalLineZ - sign * (penD / 2)]} />
            ))}

            {/* Goal area (6-yard box) */}
            <FieldLine args={[goalAreaW, LINE_W]} position={[0, LINE_Y, goalLineZ - sign * goalAreaD]} />
            {[-goalAreaW / 2, goalAreaW / 2].map((x) => (
              <FieldLine key={`ga-${x}`} args={[LINE_W, goalAreaD]} position={[x, LINE_Y, goalLineZ - sign * (goalAreaD / 2)]} />
            ))}

            {/* Penalty spot */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LINE_Y, goalLineZ - sign * penSpotDist]}>
              <circleGeometry args={[0.2, 16]} />
              <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.15} />
            </mesh>

            {/* Penalty arc — arc of radius 9.15m from penalty spot, outside penalty area */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LINE_Y, goalLineZ - sign * penSpotDist]}>
              <ringGeometry args={[
                penArcR,
                penArcR + LINE_W,
                24,
                1,
                // Arc outside the penalty box: centered on penalty spot
                sign === -1 ? Math.PI * 0.69 : -Math.PI * 0.19,
                Math.PI * 0.5,
              ]} />
              <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.15} />
            </mesh>

            {/* Corner arcs */}
            {[-halfWidth, halfWidth].map((cx) => {
              // Quarter-circle at each corner, arcing into the field
              const thetaStart =
                cx < 0 && sign < 0 ? 0 :                     // bottom-left
                cx > 0 && sign < 0 ? Math.PI * 1.5 :         // bottom-right
                cx < 0 && sign > 0 ? Math.PI * 0.5 :         // top-left
                Math.PI                                       // top-right
              return (
                <mesh
                  key={`corner-${cx}-${sign}`}
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[cx, LINE_Y, goalLineZ]}
                >
                  <ringGeometry args={[cornerR, cornerR + LINE_W, 16, 1, thetaStart, Math.PI / 2]} />
                  <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.15} />
                </mesh>
              )
            })}
          </group>
        )
      })}

      {/* ── Invisible walls at field boundaries ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-halfWidth - 5, 1, 0]} visible={false}>
          <boxGeometry args={[0.5, 3, length + 10]} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[halfWidth + 5, 1, 0]} visible={false}>
          <boxGeometry args={[0.5, 3, length + 10]} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 1, -halfLength - 5]} visible={false}>
          <boxGeometry args={[width + 10, 3, 0.5]} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 1, halfLength + 5]} visible={false}>
          <boxGeometry args={[width + 10, 3, 0.5]} />
        </mesh>
      </RigidBody>
    </group>
  )
}

// ─── Goal Posts ──────────────────────────────────────────────────
const GOAL_MODEL_PATH = '/models/football_goal_post.glb'
const MODEL_WIDTH = 6.4
const GOAL_SCALE_X = MATCH_FIELD.goalWidth / MODEL_WIDTH
// Model posts are at Z≈+1.3 in local space; shift back so posts align with goal line
const GOAL_MODEL_Z_OFFSET = -1.3

export function MatchGoal({ position, onGoalScored, direction = -1 }: {
  position: [number, number, number]
  onGoalScored: () => void
  /** -1 = net extends into -Z (default, neg-Z goal), +1 = net extends into +Z (pos-Z goal) */
  direction?: -1 | 1
}) {
  const { goalWidth, goalHeight, goalDepth } = MATCH_FIELD
  const { scene } = useGLTF(GOAL_MODEL_PATH)
  const clonedScene = useMemo(() => scene.clone(), [scene])

  // d flips all Z positions so colliders always face away from the field
  const d = direction
  const modelRotY = d === 1 ? Math.PI : 0

  const handleIntersection = useCallback((payload: IntersectionEnterPayload) => {
    const otherName = payload.other.rigidBodyObject?.name
    if (otherName === 'match-ball') {
      onGoalScored()
    }
  }, [onGoalScored])

  return (
    <group position={position}>
      {/* 3D model — rotated for pos-Z goal so it visually faces the field */}
      <group rotation={[0, modelRotY, 0]}>
        <primitive object={clonedScene} scale={[GOAL_SCALE_X, 1, 1]} position={[0, 0, GOAL_MODEL_Z_OFFSET]} castShadow />
      </group>

      {/* Goal sensor — fills the full goal volume for reliable detection */}
      <RigidBody type="fixed" sensor onIntersectionEnter={handleIntersection}>
        <CuboidCollider
          args={[goalWidth / 2 - 0.1, goalHeight / 2 - 0.1, goalDepth / 2]}
          position={[0, goalHeight / 2, d * goalDepth / 2]}
        />
      </RigidBody>
      {/* Back wall — low restitution so ball doesn't bounce out */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0.2} friction={0.8}>
        <mesh position={[0, goalHeight / 2, d * goalDepth]} visible={false}>
          <boxGeometry args={[goalWidth + 0.5, goalHeight + 0.5, 0.4]} />
        </mesh>
      </RigidBody>

      {/* Side net walls — connect posts to back wall */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0.2} friction={0.8}>
        <mesh position={[-goalWidth / 2, goalHeight / 2, d * goalDepth / 2]} visible={false}>
          <boxGeometry args={[0.15, goalHeight, goalDepth]} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" restitution={0.2} friction={0.8}>
        <mesh position={[goalWidth / 2, goalHeight / 2, d * goalDepth / 2]} visible={false}>
          <boxGeometry args={[0.15, goalHeight, goalDepth]} />
        </mesh>
      </RigidBody>

      {/* Roof net — connects crossbar to back wall */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0.2} friction={0.8}>
        <mesh position={[0, goalHeight, d * goalDepth / 2]} visible={false}>
          <boxGeometry args={[goalWidth, 0.15, goalDepth]} />
        </mesh>
      </RigidBody>

      {/* Post colliders — always on the goal line (Z=0 relative to group) */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0.8}>
        <mesh position={[-goalWidth / 2, goalHeight / 2, 0]} visible={false}>
          <boxGeometry args={[0.12, goalHeight, 0.12]} />
        </mesh>
      </RigidBody>
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

// ─── AI Player Visual ────────────────────────────────────────────
export const JERSEY_BLUE = '/skins/jersey-blue.png'
export const JERSEY_RED = '/skins/jersey-red.png'

export interface AIPlayerData {
  position: [number, number, number]
  rotation: number
  animation: AnimationState
}

export interface AIPlayerHandle {
  updateTransform(x: number, z: number, rotY: number): void
  setAnimation(anim: AnimationState): void
}

export const AIPlayer = forwardRef<AIPlayerHandle, { initialData: AIPlayerData; skinUrl: string; hasPhysics?: boolean }>(
  function AIPlayer({ initialData, skinUrl, hasPhysics }, ref) {
    const groupRef = useRef<THREE.Group>(null)
    const rigidBodyRef = useRef<RapierRigidBody>(null)
    const [animation, setAnimState] = useState<AnimationState>(initialData.animation)
    const lastAnimation = useRef<AnimationState>(initialData.animation)

    useImperativeHandle(ref, () => ({
      updateTransform(x: number, z: number, rotY: number) {
        if (groupRef.current) {
          groupRef.current.position.set(x, 0, z)
          groupRef.current.rotation.y = rotY
        }
        if (rigidBodyRef.current) {
          rigidBodyRef.current.setNextKinematicTranslation({ x, y: 0.9, z })
        }
      },
      setAnimation(anim: AnimationState) {
        if (anim !== lastAnimation.current) {
          lastAnimation.current = anim
          setAnimState(anim)
        }
      },
    }))

    return (
      <>
        {hasPhysics && (
          <RigidBody
            ref={rigidBodyRef}
            type="kinematicPosition"
            position={[initialData.position[0], 0.9, initialData.position[2]]}
            colliders={false}
          >
            <CapsuleCollider args={[0.5, 0.35]} />
          </RigidBody>
        )}
        <group
          ref={groupRef}
          position={[initialData.position[0], 0, initialData.position[2]]}
          rotation={[0, initialData.rotation, 0]}
        >
          <Suspense fallback={null}>
            <HytopiaAvatar skinUrl={skinUrl} animation={animation} />
          </Suspense>
        </group>
      </>
    )
  }
)

// ─── Match Ball ──────────────────────────────────────────────────
const SOCCER_BALL_MODEL = '/models/soccer-ball/scene.gltf'
const SOCCER_BALL_SCALE = BALL_RADIUS / 1.05 // native radius ~1.05

export const MatchBall = ({ ballRef }: { ballRef: React.RefObject<RapierRigidBody | null> }) => {
  const { scene } = useGLTF(SOCCER_BALL_MODEL)
  const clone = useMemo(() => {
    const c = scene.clone()
    c.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) (node as THREE.Mesh).castShadow = true
    })
    return c
  }, [scene])

  return (
    <RigidBody
      ref={ballRef}
      colliders="ball"
      mass={0.45}
      restitution={0.6}
      linearDamping={0.4}
      angularDamping={2.5}
      friction={0.35}
      position={[0, BALL_RADIUS, 0]}
      name="match-ball"
      ccd
    >
      <primitive object={clone} scale={SOCCER_BALL_SCALE} />
    </RigidBody>
  )
}

useGLTF.preload(SOCCER_BALL_MODEL)
