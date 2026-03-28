import * as THREE from 'three'
import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'

interface BallTrailProps {
  getPosition: () => { x: number; y: number; z: number } | null
  color?: string
  isActive?: boolean
  maxPoints?: number
}

export function BallTrail({ getPosition, color = '#ffffff', isActive = false, maxPoints = 40 }: BallTrailProps) {
  // Pre-allocated ring buffer — no per-frame allocations.
  // startIdx: index (in floats) of the oldest live point.
  // endIdx:   index (in floats) one past the newest live point.
  // Live point count = (endIdx - startIdx) / 3
  // The buffer is sized 2× maxPoints so indices can grow freely
  // without wrapping; once both pointers exceed maxPoints*3 we
  // reset them to the front (a cheap O(1) copy of the live window).
  const BUFFER_FLOATS = maxPoints * 3 * 2
  const positionsBuffer = useRef(new Float32Array(BUFFER_FLOATS))
  const startIdx = useRef(0)  // oldest live point (float index)
  const endIdx = useRef(0)    // one past newest live point (float index)
  const wasActive = useRef(false)

  const { lineObj, geometry } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const posArr = new Float32Array(maxPoints * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    geo.setDrawRange(0, 0)
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.5,
    })
    return { lineObj: new THREE.Line(geo, mat), geometry: geo }
  }, [color, maxPoints])

  useEffect(() => {
    return () => {
      lineObj.geometry.dispose()
      ;(lineObj.material as THREE.Material).dispose()
    }
  }, [lineObj])

  useFrame(() => {
    const buf = positionsBuffer.current
    const maxFloats = maxPoints * 3

    if (isActive) {
      if (!wasActive.current) {
        // Reset trail on transition to active — no allocation needed.
        startIdx.current = 0
        endIdx.current = 0
        wasActive.current = true
      }

      const pos = getPosition()
      if (pos) {
        // Compact buffer if the write head is approaching the end.
        // This is O(livePoints) but happens at most once per maxPoints frames.
        if (endIdx.current + 3 > BUFFER_FLOATS) {
          const liveFloats = endIdx.current - startIdx.current
          buf.copyWithin(0, startIdx.current, endIdx.current)
          startIdx.current = 0
          endIdx.current = liveFloats
        }

        buf[endIdx.current]     = pos.x
        buf[endIdx.current + 1] = pos.y
        buf[endIdx.current + 2] = pos.z
        endIdx.current += 3

        // Drop oldest point if trail exceeds maxPoints.
        if (endIdx.current - startIdx.current > maxFloats) {
          startIdx.current += 3
        }
      }
    } else {
      wasActive.current = false
      // Fade out: remove two points per frame from the front (same rate as before).
      if (endIdx.current - startIdx.current > 0) {
        startIdx.current += 6
        if (startIdx.current > endIdx.current) {
          startIdx.current = endIdx.current
        }
      }
    }

    // Write the live window into the pre-allocated GPU buffer attribute.
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const liveFloats = endIdx.current - startIdx.current
    const count = Math.min(liveFloats / 3, maxPoints)
    const srcStart = endIdx.current - count * 3
    for (let i = 0; i < count * 3; i++) {
      arr[i] = buf[srcStart + i]
    }
    attr.needsUpdate = true
    geometry.setDrawRange(0, count)
  })

  return <primitive object={lineObj} />
}
