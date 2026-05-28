import { Canvas } from '@react-three/fiber'
import { Suspense, useSyncExternalStore } from 'react'
import { FloatingObjects } from './FloatingObjects'
import { CameraRig } from './CameraRig'
import { useGLTF } from '@react-three/drei'
import type { MutableRefObject } from 'react'
import { assetPath } from '../../config/base-path'

useGLTF.setDecoderPath(assetPath('draco/gltf/'))

interface Props {
  mouseRef: MutableRefObject<{ nx: number; ny: number }>
  active?: boolean
}

function useIsMobile() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia('(max-width: 768px)')
      const handler = () => onStoreChange()
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    },
    () => window.matchMedia('(max-width: 768px)').matches,
    () => true,
  )
}

export function HeroCanvas({ mouseRef, active = true }: Props) {
  const isMobile = useIsMobile()

  if (isMobile || !active) return null

  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 48 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.25]}
      frameloop="always"
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
        <ambientLight intensity={0.65} color="#f8f0e0" />
        <directionalLight position={[5, 8, 5]} intensity={1.25} color="#fff6e4" />
        <directionalLight position={[-4, 2, -3]} intensity={0.45} color="#c8d8f0" />
        <pointLight position={[0, 3, 2]} intensity={0.28} color="#ffd9b8" />
        <FloatingObjects isMobile={isMobile} />
        <CameraRig mouseRef={mouseRef} isMobile={isMobile} />
      </Suspense>
    </Canvas>
  )
}
