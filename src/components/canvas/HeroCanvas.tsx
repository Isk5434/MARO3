import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useEffect } from 'react'
import { FloatingObjects } from './FloatingObjects'
import { CameraRig } from './CameraRig'
import { useGLTF } from '@react-three/drei'
import type { MutableRefObject } from 'react'

useGLTF.setDecoderPath(`${import.meta.env.BASE_URL}draco/gltf/`)

interface Props {
  mouseRef: MutableRefObject<{ nx: number; ny: number }>
  active?: boolean
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

export function HeroCanvas({ mouseRef, active = true }: Props) {
  const isMobile = useIsMobile()

  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 48 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        background: 'transparent',
        pointerEvents: 'none',
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={1.4} color="#f8f0e0" />
        <directionalLight position={[5, 8, 5]} intensity={2.0} color="#fff8e8" />
        <directionalLight position={[-4, 2, -3]} intensity={0.6} color="#c8d8f0" />
        <pointLight position={[0, 3, 2]} intensity={0.4} color="#ffe0c0" />
        <FloatingObjects isMobile={isMobile} />
        <CameraRig mouseRef={mouseRef} isMobile={isMobile} />
      </Suspense>
    </Canvas>
  )
}
