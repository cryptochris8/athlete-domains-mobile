import { Physics } from '@react-three/rapier'
import type { ReactNode } from 'react'
import { PHYSICS } from './constants'

interface PhysicsProviderProps {
  children: ReactNode
  paused?: boolean
}

export function PhysicsProvider({ children, paused = false }: PhysicsProviderProps) {
  return (
    <Physics gravity={PHYSICS.gravity} paused={paused}>
      {children}
    </Physics>
  )
}
