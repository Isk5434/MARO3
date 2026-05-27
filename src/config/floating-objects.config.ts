// To add / remove / swap 3D objects in the hero section, edit this file.
// shape: 'torus' | 'box' | 'sphere' | 'cone' | 'torusKnot' | 'glb'
import { assetPath } from './base-path'

// For a custom GLB: shape: 'glb' + glbPath: '/models/xxx.glb'

interface FloatingObjectBase {
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale?: number
  color: string
  roughness: number
  metalness: number
  transmission?: number
  ior?: number
  thickness?: number
  floatOffset?: number
  floatAmplitude?: number
  floatSpeed?: number
  rotateAxis?: [number, number, number]
  mobilePosition?: [number, number, number]
  mobileRotation?: [number, number, number]
  mobileScale?: number
}

export type GlbFloatingConfig = FloatingObjectBase & { shape: 'glb'; args: []; glbPath: string }

export type FloatingObjectConfig =
  | (FloatingObjectBase & { shape: 'torus'; args: [number, number, number, number] })
  | (FloatingObjectBase & { shape: 'box'; args: [number, number, number] })
  | (FloatingObjectBase & { shape: 'sphere'; args: [number, number, number] })
  | (FloatingObjectBase & { shape: 'cone'; args: [number, number, number] })
  | (FloatingObjectBase & {
      shape: 'torusKnot'
      args: [number, number, number, number, number, number]
    })
  | GlbFloatingConfig

export type FloatingShape = FloatingObjectConfig['shape']

export const FLOATING_OBJECTS: FloatingObjectConfig[] = [
  // ── Glass rings ──────────────────────────────────────
  {
    id: 'ring-glass-1',
    shape: 'torus',
    args: [0.55, 0.1, 16, 48],
    position: [-2.5, 0.8, -0.5],
    rotation: [0.4, 0.0, 0.3],
    color: '#98e8c2',
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.92,
    ior: 1.45,
    thickness: 0.3,
    floatOffset: 0.0,
    floatAmplitude: 0.18,
    floatSpeed: 0.7,
    rotateAxis: [0.001, 0.003, 0.0008],
  },
  {
    id: 'ring-glass-2',
    shape: 'torus',
    args: [0.38, 0.07, 16, 48],
    position: [2.8, -0.3, 0.2],
    rotation: [0.8, 0.3, -0.2],
    color: '#98e8c2',
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.9,
    ior: 1.45,
    thickness: 0.2,
    floatOffset: 1.5,
    floatAmplitude: 0.14,
    floatSpeed: 0.9,
    rotateAxis: [-0.0015, 0.002, 0.001],
  },
  {
    id: 'ring-glass-3',
    shape: 'torus',
    args: [0.65, 0.08, 16, 48],
    position: [1.5, 1.2, -1.2],
    rotation: [1.2, 0.5, 0.4],
    color: '#98e8c2',
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.95,
    ior: 1.45,
    thickness: 0.25,
    floatOffset: 3.0,
    floatAmplitude: 0.12,
    floatSpeed: 0.6,
    rotateAxis: [0.002, -0.001, 0.0015],
  },
  // ── Dark floating panels ───────────────────────────────
  {
    id: 'panel-dark-1',
    shape: 'box',
    args: [1.4, 0.055, 0.55],
    position: [-3.2, 0.4, 0.3],
    rotation: [0.6, 0.4, 0.8],
    color: '#1c1410',
    roughness: 0.7,
    metalness: 0.1,
    floatOffset: 0.8,
    floatAmplitude: 0.12,
    floatSpeed: 0.5,
    rotateAxis: [0.0008, 0.0015, 0.001],
  },
  {
    id: 'panel-dark-2',
    shape: 'box',
    args: [1.0, 0.05, 0.42],
    position: [3.5, 0.6, -0.5],
    rotation: [0.3, -0.5, 1.0],
    color: '#1c1410',
    roughness: 0.7,
    metalness: 0.1,
    floatOffset: 2.2,
    floatAmplitude: 0.16,
    floatSpeed: 0.65,
    rotateAxis: [-0.001, 0.002, 0.0012],
  },
  {
    id: 'panel-dark-3',
    shape: 'box',
    args: [0.85, 0.045, 0.35],
    position: [-1.8, -1.2, 0.8],
    rotation: [1.1, 0.2, 0.5],
    color: '#1c1410',
    roughness: 0.65,
    metalness: 0.12,
    floatOffset: 4.0,
    floatAmplitude: 0.14,
    floatSpeed: 0.75,
    rotateAxis: [0.0012, -0.0008, 0.0018],
  },
  // ── Olive/dark-green tori ────────────────────────────
  {
    id: 'torus-olive-1',
    shape: 'torus',
    args: [0.75, 0.28, 14, 36],
    position: [-0.8, -1.5, 0.5],
    rotation: [0.2, 0.8, 0.3],
    color: '#3d4a2e',
    roughness: 0.8,
    metalness: 0.0,
    floatOffset: 1.2,
    floatAmplitude: 0.2,
    floatSpeed: 0.55,
    rotateAxis: [0.0018, 0.001, -0.0012],
  },
  {
    id: 'torus-olive-2',
    shape: 'torus',
    args: [0.55, 0.2, 14, 36],
    position: [2.2, 1.4, -0.8],
    rotation: [1.0, 0.2, -0.4],
    color: '#3d4a2e',
    roughness: 0.8,
    metalness: 0.0,
    floatOffset: 2.8,
    floatAmplitude: 0.16,
    floatSpeed: 0.8,
    rotateAxis: [-0.0015, 0.002, 0.0008],
  },
  // ── GLB models ────────────────────────────────────────
  {
    id: 'glb-bunny',
    shape: 'glb',
    args: [],
    glbPath: assetPath('models/bunny.glb'),
    position: [-3.0, 1.0, -0.4],
    rotation: [0.1, 0.4, -0.1],
    scale: 0.7,
    color: '#ffffff',
    roughness: 0.4,
    metalness: 0.0,
    floatOffset: 0.5,
    floatAmplitude: 0.18,
    floatSpeed: 0.6,
    rotateAxis: [0.0, 0.006, 0.0],
    mobilePosition: [-0.9, 2.0, 0],
    mobileRotation: [0, 0.4, 0],
    mobileScale: 1.0,
  },
  {
    id: 'glb-maro-banzai',
    shape: 'glb',
    args: [],
    glbPath: assetPath('models/maro-inu-banzai.glb'),
    position: [0.8, 1.6, -0.8],
    rotation: [0.0, -0.5, 0.1],
    scale: 0.7,
    color: '#ffffff',
    roughness: 0.4,
    metalness: 0.0,
    floatOffset: 2.0,
    floatAmplitude: 0.2,
    floatSpeed: 0.75,
    rotateAxis: [0.0, 0.005, 0.0],
    mobilePosition: [1.0, 0.2, -0.3],
    mobileRotation: [0, -0.5, 0],
    mobileScale: 1.0,
  },
  {
    id: 'glb-maro-hand',
    shape: 'glb',
    args: [],
    glbPath: assetPath('models/maro-inu-hand.glb'),
    position: [3.2, -0.6, 0.2],
    rotation: [0.2, 0.3, 0.0],
    scale: 0.7,
    color: '#ffffff',
    roughness: 0.4,
    metalness: 0.0,
    floatOffset: 4.0,
    floatAmplitude: 0.14,
    floatSpeed: 0.85,
    rotateAxis: [0.0, 0.004, 0.0],
    mobilePosition: [-0.2, -2.0, 0],
    mobileRotation: [0, 0.3, 0],
    mobileScale: 1.0,
  },
]
