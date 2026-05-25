import gsap from 'gsap'
import { useProgress } from '@react-three/drei'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LOADING_MARK_IMAGE } from '../config/assets'
import styles from '../styles/LoadingScreen.module.css'

const MIN_LOADING_MS = 1800
const FAKE_LOADING_MS = 1400
const READY_REVEAL_DELAY_MS = 300
const GLASS_EFFECT_SPEED = 0.5
const GLASS_DURATION_MS = 750 / GLASS_EFFECT_SPEED
const GLASS_FADE_MS = 600 / GLASS_EFFECT_SPEED

interface ShardConfig {
  clipPath: string
  originX: number
  originY: number
  tx: number
  ty: number
  rotate: number
  delay: number
}

function buildShards(): ShardConfig[] {
  const cols = 6
  const rows = 5
  const pts: [number, number][][] = []

  for (let row = 0; row <= rows; row += 1) {
    pts.push([])
    for (let col = 0; col <= cols; col += 1) {
      const bx = (col / cols) * 100
      const by = (row / rows) * 100
      const interior = col > 0 && col < cols && row > 0 && row < rows
      const jx = interior ? (Math.random() - 0.5) * (100 / cols) * 0.45 : 0
      const jy = interior ? (Math.random() - 0.5) * (100 / rows) * 0.45 : 0
      pts[row].push([bx + jx, by + jy])
    }
  }

  const shards: ShardConfig[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const tl = pts[row][col]
      const tr = pts[row][col + 1]
      const bl = pts[row + 1][col]
      const br = pts[row + 1][col + 1]
      const triangles: [number, number][][] = [
        [tl, tr, br],
        [tl, br, bl],
      ]

      triangles.forEach((tri) => {
        const originX = (tri[0][0] + tri[1][0] + tri[2][0]) / 3
        const originY = (tri[0][1] + tri[1][1] + tri[2][1]) / 3
        const dx = originX - 50
        const dy = originY - 50
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const speed = 80 + Math.random() * 70

        shards.push({
          clipPath: `polygon(${tri.map((p) => `${p[0].toFixed(1)}% ${p[1].toFixed(1)}%`).join(', ')})`,
          originX,
          originY,
          tx: (dx / dist) * speed * (0.8 + Math.random() * 0.4),
          ty: (dy / dist) * speed * (0.8 + Math.random() * 0.4),
          rotate: (Math.random() - 0.5) * 360,
          delay: Math.random() * 200,
        })
      })
    }
  }

  return shards
}

interface Props {
  onLoaded: () => void
}

export function LoadingScreen({ onLoaded }: Props) {
  const { progress, total } = useProgress()
  const [fakeProgress, setFakeProgress] = useState(0)
  const [fakeEnabled, setFakeEnabled] = useState(false)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'entering' | 'done'>('loading')
  const [shards, setShards] = useState<ShardConfig[]>([])
  const [triggered, setTriggered] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const loadStartRef = useRef(0)

  const displayProgress = total > 0 ? progress : fakeEnabled ? fakeProgress : 0
  const visibleProgress = Math.min(100, Math.round(displayProgress))
  const isReady = phase === 'ready' || phase === 'entering'

  const setHeroMask = useCallback((value: string) => {
    document.querySelectorAll<HTMLElement>('[data-hero-mask]').forEach((el) => {
      el.style.setProperty('--hero-reveal-mask', value)
    })
  }, [])

  useEffect(() => {
    loadStartRef.current = performance.now()
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setFakeEnabled(true), 600)
    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!fakeEnabled || total > 0) return

    const start = performance.now()
    let rafId: number

    const tick = () => {
      const elapsed = performance.now() - start
      const nextProgress = Math.min((elapsed / FAKE_LOADING_MS) * 100, 100)
      setFakeProgress(nextProgress)
      if (nextProgress < 100) rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [fakeEnabled, total])

  const completedRef = useRef(false)
  const readyTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (visibleProgress < 100 || completedRef.current) return

    completedRef.current = true
    const elapsed = performance.now() - loadStartRef.current
    const readyDelay = Math.max(READY_REVEAL_DELAY_MS, MIN_LOADING_MS - elapsed)
    readyTimeoutRef.current = window.setTimeout(() => {
      gsap.set('[data-hero-visual]', { scale: 1.06, opacity: 0 })
      gsap.set('[data-hero-backdrop]', { scale: 1.04, opacity: 0 })
      gsap.set('[data-hero-title]', { opacity: 1 })
      gsap.set('[data-hero-subtitle]', { opacity: 1 })
      gsap.set('[data-hero-cta]', { y: 18, opacity: 0 })
      gsap.set('[data-hero-hint]', { opacity: 0 })
      setHeroMask('linear-gradient(-15deg, transparent 100%, black 150%)')
      onLoaded()
      setPhase('ready')
      document.body.classList.add('webgl-ready')
    }, readyDelay)
  }, [visibleProgress, onLoaded, setHeroMask])

  useEffect(() => {
    return () => {
      if (readyTimeoutRef.current !== null) window.clearTimeout(readyTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    document.body.classList.add('is-loading')
    return () => {
      document.body.classList.remove('is-loading', 'webgl-ready')
    }
  }, [])

  useEffect(() => {
    if (phase !== 'entering' || shards.length === 0) return

    const rafId = requestAnimationFrame(() => {
      setTriggered(true)

      const mask = { transparent: 100, black: 150 }
      const heroMaskTargets = document.querySelectorAll<HTMLElement>('[data-hero-mask]')

      const timeline = gsap.timeline({
        delay: 0.15,
        defaults: { duration: 1.2, ease: 'expo.out' },
        onComplete: () => {
          document.body.classList.remove('is-loading', 'webgl-ready')
          setPhase('done')
        },
      })

      timeline
        .to('[data-hero-visual]', { scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out' })
        .to(
          '[data-hero-backdrop]',
          { scale: 1, opacity: 1, duration: 1.35, ease: 'power3.out' },
          '<',
        )
        .fromTo(
          mask,
          { transparent: 100, black: 150 },
          {
            duration: 3.6,
            transparent: -35,
            black: 0,
            ease: 'sine.out',
            onUpdate: () => {
              heroMaskTargets.forEach((el, index) => {
                const delay = index * 12
                el.style.setProperty(
                  '--hero-reveal-mask',
                  `linear-gradient(-15deg, transparent ${mask.transparent + delay}%, black ${mask.black + delay}%)`,
                )
              })
            },
          },
          '<25%',
        )
        .to('[data-hero-cta]', { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }, '<45%')
        .to('[data-hero-hint]', { opacity: 0.55, duration: 0.45, ease: 'sine.out' }, '<20%')
    })

    return () => cancelAnimationFrame(rafId)
  }, [phase, shards.length])

  const handleEnter = () => {
    if (phase !== 'ready') return

    gsap.to(btnRef.current, {
      opacity: 0,
      duration: 0.32,
      ease: 'power2.in',
    })
    gsap.to(contentRef.current, {
      scale: 0.94,
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
    })

    setPhase('entering')
    setShards(buildShards())
  }

  if (phase === 'done') return null

  return (
    <div
      className={`${styles.overlay} ${isReady ? styles.ready : ''} ${
        phase === 'entering' ? styles.clear : ''
      }`}
      aria-busy={phase === 'loading'}
      aria-live="polite"
    >
      <div ref={contentRef} className={styles.content}>
        <img
          className={styles.mark}
          src={LOADING_MARK_IMAGE}
          alt=""
          aria-hidden="true"
          decoding="async"
        />

        <div className={styles.switcher}>
          <div className={styles.loadingLine} aria-hidden={isReady}>
            <span className={styles.title}>Loading</span>
            {[0, 1, 2, 3].map((dot) => (
              <span key={dot} className={styles.dot} style={{ animationDelay: `${dot * 0.1}s` }} />
            ))}
          </div>

          <button
            ref={btnRef}
            className={styles.enterBtn}
            type="button"
            onClick={handleEnter}
            disabled={phase !== 'ready'}
            aria-label="サイトに入る"
          >
            <span>Enter Site</span>
          </button>
        </div>

        <span className={styles.percent}>{visibleProgress}%</span>
      </div>

      {shards.map((shard, index) => (
        <div
          key={index}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--color-bg)',
            clipPath: shard.clipPath,
            transformOrigin: `${shard.originX}% ${shard.originY}%`,
            pointerEvents: 'none',
            transform: triggered
              ? `translate3d(${shard.tx}vw, ${shard.ty}vh, 0) rotate(${shard.rotate}deg) scale(0.5)`
              : 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
            opacity: triggered ? 0 : 1,
            transition: triggered
              ? `transform ${GLASS_DURATION_MS}ms cubic-bezier(0.55, 0, 1, 0.45) ${shard.delay}ms, opacity ${GLASS_FADE_MS}ms ease ${shard.delay}ms`
              : 'none',
          }}
        />
      ))}
    </div>
  )
}
