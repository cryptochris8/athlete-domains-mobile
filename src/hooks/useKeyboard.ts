import { useEffect, useRef } from 'react'

export function useKeyboard() {
  const keys = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      keys.current.add(e.code)
    }
    const handleUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code)
    }

    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)
    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
    }
  }, [])

  return keys
}
