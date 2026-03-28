import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { BOWLING_CONFIG } from './config'

// Lane surface height: box is 0.1 thick rotated -PI/2 at y=0, so surface is at y=0.05
const LANE_SURFACE_Y = 0.052 // slightly above actual surface to prevent z-fighting

// Arrow shape pointing toward pins (flat 2D on lane surface)
function createArrowShape(scale = 1): THREE.Shape {
  const s = new THREE.Shape()
  // Arrow pointing in +Y (toward pins when rotated to floor)
  s.moveTo(0, 0.14 * scale)                    // tip
  s.lineTo(-0.05 * scale, 0.04 * scale)        // left notch
  s.lineTo(-0.024 * scale, 0.04 * scale)       // left shaft top
  s.lineTo(-0.024 * scale, -0.10 * scale)      // left shaft bottom
  s.lineTo(0.024 * scale, -0.10 * scale)       // right shaft bottom
  s.lineTo(0.024 * scale, 0.04 * scale)        // right shaft top
  s.lineTo(0.05 * scale, 0.04 * scale)         // right notch
  s.closePath()
  return s
}

interface LaneProps {
  hasBumpers?: boolean
}

export function Lane({ hasBumpers = false }: LaneProps) {
  const { laneLength, laneWidth, gutterWidth } = BOWLING_CONFIG

  const arrowShape = useMemo(() => createArrowShape(1), [])

  // Board line positions (alternating light/dark strips)
  const boardLines = useMemo(() => {
    const lines: number[] = []
    const boardWidth = laneWidth / 39 // Standard lane has 39 boards
    for (let i = 1; i < 39; i++) {
      lines.push(-laneWidth / 2 + i * boardWidth)
    }
    return lines
  }, [laneWidth])

  return (
    <group>
      {/* Lane surface */}
      <RigidBody type="fixed" colliders="cuboid" friction={0.15} restitution={0.1}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[laneWidth, laneLength, 0.1]} />
          <meshStandardMaterial color="#DEB887" roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* Board lines - subtle vertical stripes */}
      {boardLines.filter((_, i) => i % 5 === 4).map((x, i) => (
        <mesh key={`board-${i}`} position={[x, LANE_SURFACE_Y, -1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.005, 16]} />
          <meshStandardMaterial color="#C4A060" transparent opacity={0.3} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      ))}

      {/* === FOUL LINE === */}
      <mesh position={[0, LANE_SURFACE_Y, 6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[laneWidth + 0.02, 0.05]} />
        <meshStandardMaterial color="#222222" depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      {/* Red accent lines on either side of foul line */}
      <mesh position={[0, LANE_SURFACE_Y, 6.54]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[laneWidth + 0.02, 0.02]} />
        <meshStandardMaterial color="#CC0000" depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh position={[0, LANE_SURFACE_Y, 6.46]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[laneWidth + 0.02, 0.02]} />
        <meshStandardMaterial color="#CC0000" depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>

      {/* === APPROACH DOTS === */}
      {/* Row 1 (closest to foul line) */}
      {[-0.3, -0.15, 0, 0.15, 0.3].map((x, i) => (
        <mesh key={`dot1-${i}`} position={[x, LANE_SURFACE_Y, 7.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.025, 12]} />
          <meshStandardMaterial color="#333333" depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}
      {/* Row 2 */}
      {[-0.3, -0.15, 0, 0.15, 0.3].map((x, i) => (
        <mesh key={`dot2-${i}`} position={[x, LANE_SURFACE_Y, 7.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.025, 12]} />
          <meshStandardMaterial color="#333333" depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}
      {/* Row 3 (furthest from foul line) */}
      {[-0.3, -0.15, 0, 0.15, 0.3].map((x, i) => (
        <mesh key={`dot3-${i}`} position={[x, LANE_SURFACE_Y, 8.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.025, 12]} />
          <meshStandardMaterial color="#333333" depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}

      {/* === TARGETING ARROWS === */}
      {/* 7 arrows at z=3, standard bowling arrow positions */}
      {[-0.35, -0.23, -0.12, 0, 0.12, 0.23, 0.35].map((x, i) => (
        <mesh
          key={`arrow-${i}`}
          position={[x, LANE_SURFACE_Y, 3]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <shapeGeometry args={[arrowShape]} />
          <meshStandardMaterial
            color={i === 3 ? '#CC0000' : '#8B4513'}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
      ))}

      {/* === RANGE FINDER DOTS === */}
      {/* Row of dots past the arrows */}
      {[-0.35, -0.23, -0.12, 0, 0.12, 0.23, 0.35].map((x, i) => (
        <mesh key={`range-${i}`} position={[x, LANE_SURFACE_Y, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.018, 12]} />
          <meshStandardMaterial color="#555555" depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}

      {/* Gutters or bumpers */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {hasBumpers ? (
            // Bumper rail
            <RigidBody type="fixed" colliders="cuboid" restitution={0.6}>
              <mesh position={[side * (laneWidth / 2 + 0.05), 0.08, 0]} castShadow>
                <boxGeometry args={[0.1, 0.16, laneLength]} />
                <meshStandardMaterial color="#FF4444" roughness={0.5} />
              </mesh>
            </RigidBody>
          ) : (
            // Gutter (lower surface)
            <RigidBody type="fixed" colliders="cuboid" friction={0.8}>
              <mesh
                position={[side * (laneWidth / 2 + gutterWidth / 2), -0.08, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
              >
                <boxGeometry args={[gutterWidth, laneLength, 0.1]} />
                <meshStandardMaterial color="#333" />
              </mesh>
            </RigidBody>
          )}
        </group>
      ))}

      {/* Back wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.5, -laneLength / 2 - 0.2]} visible={false}>
          <boxGeometry args={[3, 1, 0.4]} />
        </mesh>
      </RigidBody>

      {/* Pin deck (slightly different color area at end) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LANE_SURFACE_Y, -7]} receiveShadow>
        <planeGeometry args={[laneWidth + 0.5, 3]} />
        <meshStandardMaterial color="#C4A882" roughness={0.4} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
      </mesh>

      {/* Gutter channel edges (visual only) */}
      {!hasBumpers && [-1, 1].map((side) => (
        <mesh
          key={`gutter-edge-${side}`}
          position={[side * laneWidth / 2, LANE_SURFACE_Y, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.012, laneLength]} />
          <meshStandardMaterial color="#8B7355" depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      ))}
    </group>
  )
}
