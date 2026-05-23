import { useEffect, useRef } from 'react'

export interface MousePos {
  x: number
  y: number
  nx: number
  ny: number
}

export function useMouseTracker(onChange: (pos: MousePos) => void) {
  const ref = useRef(onChange)

  useEffect(() => {
    ref.current = onChange
  }, [onChange])

  useEffect(() => {
    let rafId: number

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        ref.current({
          x: e.clientX,
          y: e.clientY,
          nx: (e.clientX / window.innerWidth) * 2 - 1,
          ny: (e.clientY / window.innerHeight) * 2 - 1,
        })
      })
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [])
}
