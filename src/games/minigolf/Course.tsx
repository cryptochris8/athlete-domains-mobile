import { useRef, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { Quaternion, Euler } from 'three'
import type { HoleConfig } from './config'
import { MINIGOLF_CONFIG } from './config'

interface CourseProps {
  hole: HoleConfig
  onBallInHole: () => void
  onWaterHazard: () => void
}

function Windmill({ position }: { position: [number, number, number] }) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const angleRef = useRef(0)
  const quat = useRef(new Quaternion())

  useFrame((_, delta) => {
    if (bodyRef.current) {
      angleRef.current += delta * 1.5
      quat.current.setFromEuler(new Euler(0, 0, angleRef.current))
      bodyRef.current.setNextKinematicRotation(quat.current)
    }
  })

  return (
    <group position={position}>
      {/* Base */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.15, 0.3, 0.15]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      </RigidBody>

      {/* Rotating blades - kinematic for collision */}
      <RigidBody ref={bodyRef} type="kinematicPosition" colliders="cuboid" position={[0, 0.35, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1, 0.08, 0.05]} />
          <meshStandardMaterial color="#E74C3C" />
        </mesh>
      </RigidBody>
    </group>
  )
}

function Bumper({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="ball" restitution={1.2} position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#F7C948" emissive="#F7C948" emissiveIntensity={0.3} />
      </mesh>
    </RigidBody>
  )
}

function Ramp({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  // Create a gentle incline: back edge (facing tee, +Z) at ground level,
  // slopes upward toward the hole (-Z direction)
  const rampAngle = 0.1 // ~5.7 degree incline
  const halfH = size[1] / 2
  const halfZ = size[2] / 2
  // Calculate Y so the back-bottom edge sits flush at ground level
  const backBottomLocalY = -halfH * Math.cos(rampAngle) + halfZ * Math.sin(rampAngle)
  const centerY = GROUND_Y - backBottomLocalY

  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      position={[position[0], centerY, position[2]]}
      rotation={[-rampAngle, 0, 0]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#A0522D" />
      </mesh>
    </RigidBody>
  )
}

function WaterHazard({ position, size, onEnter }: { position: [number, number, number]; size: [number, number, number]; onEnter: () => void }) {
  return (
    <group position={position}>
      {/* Visual water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[size[0], size[2]]} />
        <meshStandardMaterial color="#1E90FF" transparent opacity={0.6} />
      </mesh>
      {/* Sensor */}
      <RigidBody type="fixed" sensor onIntersectionEnter={onEnter}>
        <CuboidCollider args={[size[0] / 2, 0.05, size[2] / 2]} position={[0, 0.02, 0]} />
      </RigidBody>
    </group>
  )
}

// Ground surface is at y=0.05 (boxGeometry 0.1 thick, centered at y=0)
const GROUND_Y = 0.05
const CUP_RADIUS = 0.08 // ~3x ball radius (0.025) for realistic look
const CUP_DEPTH = 0.14  // deep enough to trap the ball

function GolfCup({ position, onBallInHole }: { position: [number, number, number]; onBallInHole: () => void }) {
  const flagRef = useRef<THREE.Group>(null)
  const holedRef = useRef(false)

  // Reset holed guard when position changes (new hole)
  useEffect(() => { holedRef.current = false }, [position])

  // Gentle flag wave animation
  useFrame((state) => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.08
    }
  })

  const handleIntersection = useCallback(() => {
    if (holedRef.current) return
    holedRef.current = true
    onBallInHole()
    // Reset after a delay to allow re-use on next hole
    setTimeout(() => { holedRef.current = false }, 3000)
  }, [onBallInHole])

  return (
    <group position={[position[0], GROUND_Y, position[2]]}>
      {/* Dark recessed cup interior (cylinder going down into ground) */}
      <mesh position={[0, -CUP_DEPTH / 2, 0]}>
        <cylinderGeometry args={[CUP_RADIUS, CUP_RADIUS, CUP_DEPTH, 32, 1, true]} />
        <meshStandardMaterial color="#0a0a0a" side={THREE.BackSide} />
      </mesh>

      {/* Cup bottom (dark) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -CUP_DEPTH, 0]}>
        <circleGeometry args={[CUP_RADIUS, 32]} />
        <meshStandardMaterial color="#050505" />
      </mesh>

      {/* White rim ring (visible lip around hole - sits ON the surface) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[CUP_RADIUS, CUP_RADIUS + 0.02, 32]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Dark circle on surface (the visible hole opening) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <circleGeometry args={[CUP_RADIUS, 32]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Flag group (with wave animation) */}
      <group ref={flagRef}>
        {/* Flag pole */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.6, 8]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        {/* Flag */}
        <mesh position={[0.08, 0.52, 0]}>
          <planeGeometry args={[0.16, 0.1]} />
          <meshStandardMaterial color="#E74C3C" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Hole sensor - sits deep in the cup so only balls that drop in trigger it */}
      <RigidBody type="fixed" sensor onIntersectionEnter={handleIntersection}>
        <CuboidCollider
          args={[CUP_RADIUS * 0.7, CUP_DEPTH / 2, CUP_RADIUS * 0.7]}
          position={[0, -CUP_DEPTH / 2, 0]}
        />
      </RigidBody>
    </group>
  )
}

function TeeMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={[position[0], GROUND_Y + 0.003, position[2]]}>
      {/* Tee circle on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.08, 16]} />
        <meshStandardMaterial color="#fff" transparent opacity={0.7} />
      </mesh>
      {/* Center dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[0.015, 8]} />
        <meshStandardMaterial color="#fff" transparent opacity={0.9} />
      </mesh>
    </group>
  )
}

export function Course({ hole, onBallInHole, onWaterHazard }: CourseProps) {
  const themeColor = hole.theme === 'safari' ? '#4CAF50'
    : hole.theme === 'space' ? '#2C2C54'
    : '#1E90FF'

  const groundColor = hole.theme === 'safari' ? '#2D8B2D'
    : hole.theme === 'space' ? '#1a1a3e'
    : '#1A6B5A'

  return (
    <group>
      {/* Ground / course surface */}
      <RigidBody type="fixed" colliders="cuboid" friction={0.8}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[hole.courseWidth, hole.courseLength, 0.1]} />
          <meshStandardMaterial color={groundColor} roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Walls — enforce minimum height to contain airborne balls from ramps */}
      {hole.walls.map((wall, i) => {
        const minH = MINIGOLF_CONFIG.boundaryWallHeight
        const h = Math.max(wall.size[1], minH)
        return (
          <RigidBody key={i} type="fixed" colliders="cuboid" restitution={0.6}>
            <mesh
              position={[wall.position[0], h / 2, wall.position[2]]}
              rotation={wall.rotation ?? [0, 0, 0]}
              castShadow
            >
              <boxGeometry args={[wall.size[0], h, wall.size[2]]} />
              <meshStandardMaterial color={themeColor} roughness={0.7} />
            </mesh>
          </RigidBody>
        )
      })}

      {/* Tee marker at starting position */}
      <TeeMarker position={hole.teePosition} />

      {/* === GOLF CUP (3D recessed hole with visible rim) === */}
      <GolfCup
        position={[hole.holePosition[0], 0, hole.holePosition[2]]}
        onBallInHole={onBallInHole}
      />

      {/* Obstacles */}
      {hole.obstacles.map((obs, i) => {
        switch (obs.type) {
          case 'windmill':
            return <Windmill key={i} position={obs.position} />
          case 'bumper':
            return <Bumper key={i} position={obs.position} />
          case 'ramp':
            return <Ramp key={i} position={obs.position} size={obs.size ?? [1, 0.15, 1]} />
          case 'water':
            return <WaterHazard key={i} position={obs.position} size={obs.size ?? [1, 0.01, 1]} onEnter={onWaterHazard} />
          default:
            return null
        }
      })}

      {/* Fun fact sign */}
      <group position={[hole.courseWidth / 2 + 0.5, 0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.4, 0.05]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <Text
          position={[0, 0, 0.03]}
          fontSize={0.04}
          maxWidth={0.5}
          color="#fff"
          anchorX="center"
          anchorY="middle"
        >
          {hole.funFact}
        </Text>
      </group>

      {/* Hole name */}
      <Text
        position={[0, 0.5, hole.teePosition[2] + 0.5]}
        fontSize={0.15}
        fontWeight={700}
        color="#fff"
        anchorX="center"
        outlineWidth={0.01}
        outlineColor="#000"
      >
        {`Hole ${hole.id}: ${hole.name}`}
      </Text>
    </group>
  )
}
