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
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
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
