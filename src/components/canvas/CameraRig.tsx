import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { MutableRefObject } from 'react'

interface Props {
  mouseRef: MutableRefObject<{ nx: number; ny: number }>
}

export function CameraRig({ mouseRef }: Props) {
  const targetX = useRef(0)
  const targetY = useRef(0)

  useFrame((state) => {
    const { nx, ny } = mouseRef.current
    targetX.current += (nx * 0.08 - targetX.current) * 0.05
    targetY.current += (-ny * 0.05 - targetY.current) * 0.05
    state.camera.rotation.set(targetY.current, targetX.current, state.camera.rotation.z)
  })

  return null
}
