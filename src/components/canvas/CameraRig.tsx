import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import * as THREE from 'three'

interface Props {
  mouseRef: MutableRefObject<{ nx: number; ny: number }>
  isMobile: boolean
}

export function CameraRig({ mouseRef, isMobile }: Props) {
  const { camera } = useThree()
  const targetX = useRef(0)
  const targetY = useRef(0)

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = isMobile ? 70 : 48
    cam.updateProjectionMatrix()
  }, [camera, isMobile])

  useFrame((state) => {
    if (isMobile) return
    const { nx, ny } = mouseRef.current
    targetX.current += (nx * 0.08 - targetX.current) * 0.05
    targetY.current += (-ny * 0.05 - targetY.current) * 0.05
    state.camera.rotation.set(targetY.current, targetX.current, state.camera.rotation.z)
  })

  return null
}
