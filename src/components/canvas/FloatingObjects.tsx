import { useRef, Suspense, Component, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { FLOATING_OBJECTS } from '../../config/floating-objects.config'
import type { FloatingObjectConfig } from '../../config/floating-objects.config'

FLOATING_OBJECTS.filter(c => c.shape === 'glb' && c.glbPath).forEach(c => useGLTF.preload(c.glbPath!))


function FloatingGlb({ cfg }: { cfg: FloatingObjectConfig }) {
  const { scene } = useGLTF(cfg.glbPath!)
  const groupRef = useRef<THREE.Group>(null)
  const baseY = cfg.position[1]
  const time = useRef(cfg.floatOffset ?? 0)

  const normalizedScene = (() => {
    const clone = scene.clone()
    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const s = maxDim > 0 ? 1.2 / maxDim : 1
    clone.scale.setScalar(s)
    const center = new THREE.Vector3()
    new THREE.Box3().setFromObject(clone).getCenter(center)
    clone.position.sub(center)
    return clone
  })()

  useFrame((_, delta) => {
    if (!groupRef.current) return
    time.current += delta * (cfg.floatSpeed ?? 0.7)
    groupRef.current.position.y = baseY + Math.sin(time.current) * (cfg.floatAmplitude ?? 0.15)
    const [rx, ry, rz] = cfg.rotateAxis ?? [0.0, 0.005, 0.0]
    groupRef.current.rotation.x += rx
    groupRef.current.rotation.y += ry
    groupRef.current.rotation.z += rz
  })

  return (
    <group
      ref={groupRef}
      position={cfg.position}
      rotation={cfg.rotation}
      scale={cfg.scale ?? 1}
    >
      <primitive object={normalizedScene} />
    </group>
  )
}

function FloatingItem({ cfg }: { cfg: FloatingObjectConfig }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const baseY = cfg.position[1]
  const time = useRef(cfg.floatOffset ?? 0)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    time.current += delta * (cfg.floatSpeed ?? 0.7)
    meshRef.current.position.y = baseY + Math.sin(time.current) * (cfg.floatAmplitude ?? 0.15)
    const [rx, ry, rz] = cfg.rotateAxis ?? [0.001, 0.001, 0.001]
    meshRef.current.rotation.x += rx
    meshRef.current.rotation.y += ry
    meshRef.current.rotation.z += rz
  })

  const isGlass = (cfg.transmission ?? 0) > 0

  const geo = (() => {
    switch (cfg.shape) {
      case 'torus':     return <torusGeometry args={cfg.args as [number,number,number,number]} />
      case 'box':       return <boxGeometry args={cfg.args as [number,number,number]} />
      case 'sphere':    return <sphereGeometry args={cfg.args as [number,number,number]} />
      case 'cone':      return <coneGeometry args={cfg.args as [number,number,number]} />
      case 'torusKnot': return <torusKnotGeometry args={cfg.args as [number,number,number,number,number,number]} />
      default:          return null
    }
  })()

  const mat = isGlass ? (
    <meshPhysicalMaterial
      color={cfg.color}
      roughness={cfg.roughness}
      metalness={cfg.metalness}
      transmission={cfg.transmission}
      ior={cfg.ior ?? 1.45}
      thickness={cfg.thickness ?? 0.3}
      transparent
      opacity={0.55}
    />
  ) : (
    <meshStandardMaterial color={cfg.color} roughness={cfg.roughness} metalness={cfg.metalness} />
  )

  return (
    <mesh
      ref={meshRef}
      position={cfg.position}
      rotation={cfg.rotation}
      scale={cfg.scale ?? 1}
    >
      {geo}
      {mat}
    </mesh>
  )
}

class GlbErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

// ── Phone emerge: 1モデル分 ──
// targetPos に下から (-5y) 飛び込んできて、π 回転 + スケール 0→1 で登場。
// 着地後はサインカーブで持続フロート + 緩やかに自転。

export function FloatingObjects() {
  const glbItems = FLOATING_OBJECTS.filter((cfg) => cfg.shape === 'glb')
  const primitiveItems = FLOATING_OBJECTS.filter((cfg) => cfg.shape !== 'glb')

  return (
    <>
      {/* 1st layer: 既存のフロート群 */}
      {primitiveItems.map((cfg) => (
        <FloatingItem key={cfg.id} cfg={cfg} />
      ))}
      {glbItems.map((cfg) => (
        <GlbErrorBoundary key={cfg.id}>
          <Suspense fallback={null}>
            <FloatingGlb cfg={cfg} />
          </Suspense>
        </GlbErrorBoundary>
      ))}

    </>
  )
}
