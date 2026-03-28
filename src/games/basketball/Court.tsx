import { RigidBody } from '@react-three/rapier'
import { BASKETBALL_CONFIG } from './config'

export function Court() {
  const { courtWidth, courtLength } = BASKETBALL_CONFIG

  return (
    <group>
      {/* Court floor */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0.5}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[courtWidth, courtLength, 0.1]} />
          <meshStandardMaterial color="#C68642" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Court lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[courtWidth - 0.5, courtLength - 0.5]} />
        <meshStandardMaterial color="#B5763A" roughness={0.9} />
      </mesh>

      {/* Free throw line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -1]} receiveShadow>
        <planeGeometry args={[3.6, 0.05]} />
        <meshStandardMaterial color="#fff" />
      </mesh>

      {/* Three point arc — centered on hoop, with straight sidelines to baseline */}
      {(() => {
        const arcRadius = 5.8
        const lineW = 0.05
        const hoopZ = -5
        const baselineZ = -courtLength / 2
        // Arc ends at x = ±arcRadius at hoopZ; sidelines run from there to baseline
        const sideLineLength = Math.abs(hoopZ - baselineZ)
        return (
          <group>
            {/* Curved arc — centered on hoop position */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, hoopZ]} receiveShadow>
              <ringGeometry args={[arcRadius, arcRadius + lineW, 32, 1, Math.PI, Math.PI]} />
              <meshStandardMaterial color="#fff" />
            </mesh>
            {/* Left sideline — from arc end to baseline */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-arcRadius, 0.002, hoopZ - sideLineLength / 2]} receiveShadow>
              <planeGeometry args={[lineW, sideLineLength]} />
              <meshStandardMaterial color="#fff" />
            </mesh>
            {/* Right sideline — from arc end to baseline */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[arcRadius, 0.002, hoopZ - sideLineLength / 2]} receiveShadow>
              <planeGeometry args={[lineW, sideLineLength]} />
              <meshStandardMaterial color="#fff" />
            </mesh>
          </group>
        )
      })()}

      {/* Side walls (invisible physics barriers) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-courtWidth / 2, 2, 0]}>
        <mesh visible={false}>
          <boxGeometry args={[0.2, 4, courtLength]} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[courtWidth / 2, 2, 0]}>
        <mesh visible={false}>
          <boxGeometry args={[0.2, 4, courtLength]} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[0, 2, -courtLength / 2]}>
        <mesh visible={false}>
          <boxGeometry args={[courtWidth, 4, 0.2]} />
        </mesh>
      </RigidBody>
    </group>
  )
}
