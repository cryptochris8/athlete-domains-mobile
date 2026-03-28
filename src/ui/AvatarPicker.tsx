import { useState, useEffect, useMemo, Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SPORT_TABS, type AvatarSport } from '@/core/constants'
import { audioManager } from '@/core/AudioManager'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { HytopiaAvatar } from '@/components/HytopiaAvatar'

interface AvatarPickerProps {
  profileId: number
  onClose: () => void
}

export interface CatalogEntry {
  id: number
  sport: string
  name: string
}

const ITEMS_PER_PAGE = 24
const GRID_COLS = 6

/** Slowly rotating avatar for the preview */
function RotatingAvatar({ skinUrl }: { skinUrl: string }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.8
    }
  })

  return (
    <group ref={groupRef} position={[0, -0.9, 0]}>
      <HytopiaAvatar skinUrl={skinUrl} scale={1} />
    </group>
  )
}

/** Pagination helper — exported for testing */
export function paginateCatalog(items: CatalogEntry[], page: number): { pageItems: CatalogEntry[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE))
  const clamped = Math.max(0, Math.min(page, totalPages - 1))
  const start = clamped * ITEMS_PER_PAGE
  return { pageItems: items.slice(start, start + ITEMS_PER_PAGE), totalPages }
}

/** Filter catalog by sport — exported for testing */
export function filterBySport(catalog: CatalogEntry[], sport: AvatarSport | 'all'): CatalogEntry[] {
  if (sport === 'all') return catalog
  return catalog.filter((e) => e.sport === sport)
}

export function AvatarPicker({ profileId, onClose }: AvatarPickerProps) {
  const updateProfile = usePlayerStore((s) => s.updateProfile)
  const currentSkinId = usePlayerStore((s) => {
    const profile = s.profiles.find((p) => p.id === profileId)
    return profile?.skinId ?? 1
  })

  const [catalog, setCatalog] = useState<CatalogEntry[]>([])
  const [sport, setSport] = useState<AvatarSport | 'all'>('all')
  const [page, setPage] = useState(0)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  // Load catalog on mount
  useEffect(() => {
    fetch('/avatar-catalog.json')
      .then((r) => r.json())
      .then((data: CatalogEntry[]) => setCatalog(data))
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => filterBySport(catalog, sport), [catalog, sport])
  const { pageItems, totalPages } = useMemo(() => paginateCatalog(filtered, page), [filtered, page])

  // Reset page when sport changes
  useEffect(() => { setPage(0) }, [sport])

  const previewId = hoveredId ?? currentSkinId
  const previewUrl = `/skins/avatars/${previewId}.png`

  return (
    <div
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #1A1A2E, #16213E)',
          borderRadius: '24px',
          padding: '1.5rem',
          maxWidth: '560px',
          width: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '2px solid rgba(255,255,255,0.15)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h2 style={{
          color: '#FFFFFF',
          fontSize: '1.3rem',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '0.75rem',
        }}>
          Choose Your Avatar
        </h2>

        {/* 3D preview */}
        <div style={{
          width: '140px',
          height: '160px',
          margin: '0 auto 0.75rem',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          border: '2px solid rgba(255,255,255,0.1)',
        }}>
          <Canvas
            camera={{ position: [0, 0.2, 2.2], fov: 40 }}
            gl={{ alpha: true }}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={1.2} />
            <directionalLight position={[2, 3, 2]} intensity={1.5} />
            <Suspense fallback={null}>
              <RotatingAvatar skinUrl={previewUrl} />
            </Suspense>
          </Canvas>
        </div>

        {/* Sport filter tabs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.35rem',
          justifyContent: 'center',
          marginBottom: '0.75rem',
        }}>
          {SPORT_TABS.map((tab) => {
            const isActive = sport === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => { audioManager.play('switchFlip'); setSport(tab.value) }}
                style={{
                  padding: '0.3rem 0.7rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: isActive ? '2px solid #FFD700' : '2px solid rgba(255,255,255,0.15)',
                  background: isActive ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#FFD700' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Thumbnail grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gap: '0.4rem',
          marginBottom: '0.75rem',
          minHeight: '200px',
        }}>
          {pageItems.map((entry) => {
            const isSelected = entry.id === currentSkinId
            const isHovered = entry.id === hoveredId
            return (
              <button
                key={entry.id}
                aria-label={entry.name}
                onMouseEnter={() => setHoveredId(entry.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  audioManager.play('grab')
                  updateProfile(profileId, { skinId: entry.id })
                  onClose()
                }}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '8px',
                  border: isSelected
                    ? '3px solid #FFD700'
                    : isHovered
                      ? '3px solid #4ECDC4'
                      : '3px solid rgba(255,255,255,0.1)',
                  background: isSelected
                    ? 'rgba(255,215,0,0.15)'
                    : isHovered
                      ? 'rgba(78,205,196,0.1)'
                      : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  padding: 0,
                  overflow: 'hidden',
                  transition: 'transform 0.12s ease, border-color 0.12s ease',
                  transform: isSelected || isHovered ? 'scale(1.06)' : 'scale(1)',
                  boxShadow: isSelected ? '0 2px 10px rgba(255,215,0,0.3)' : 'none',
                }}
              >
                <img
                  src={`/skins/avatars/${entry.id}.png`}
                  alt={entry.name}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    imageRendering: 'pixelated',
                  }}
                />
              </button>
            )
          })}
        </div>

        {/* Pagination */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '0.75rem',
        }}>
          <button
            onClick={() => { audioManager.play('click'); setPage((p) => Math.max(0, p - 1)) }}
            disabled={page <= 0}
            style={{
              padding: '0.3rem 0.8rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              background: page <= 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
              color: page <= 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)',
              cursor: page <= 0 ? 'default' : 'pointer',
            }}
          >
            Prev
          </button>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => { audioManager.play('click'); setPage((p) => Math.min(totalPages - 1, p + 1)) }}
            disabled={page >= totalPages - 1}
            style={{
              padding: '0.3rem 0.8rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              background: page >= totalPages - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
              color: page >= totalPages - 1 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)',
              cursor: page >= totalPages - 1 ? 'default' : 'pointer',
            }}
          >
            Next
          </button>
        </div>

        <button
          onClick={() => { audioManager.play('click'); onClose() }}
          style={{
            display: 'block',
            margin: '0 auto',
            padding: '0.5rem 2rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
