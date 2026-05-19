import { useCallback, useRef, useState } from 'react'
import { AboutModal } from './components/AboutModal'
import { AboutMaroSection } from './components/AboutMaroSection'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { HeroSection } from './components/HeroSection'
import { LoadingScreen } from './components/LoadingScreen'
import { SvgFilters } from './components/SvgFilters'
import { useMouseTracker } from './hooks/useMouseTracker'
import styles from './styles/App.module.css'

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const firstContentRef = useRef<HTMLElement | null>(null)
  const mouseRef = useRef({ nx: 0, ny: 0 })

  useMouseTracker(({ nx, ny }) => {
    mouseRef.current.nx = nx
    mouseRef.current.ny = ny
  })

  const handleBgToggle = useCallback(() => {
    setIsDark((current) => {
      const next = !current
      document.body.classList.toggle('dark-bg', next)
      return next
    })
  }, [])

  const handleHeroCta = useCallback(() => {
    firstContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <>
      <SvgFilters />
      <LoadingScreen onLoaded={() => setLoaded(true)} />
      <div className={`${styles.appShell} ${loaded ? styles.loaded : ''}`} aria-hidden={!loaded}>
        <Header
          onAboutClick={() => setShowAbout(true)}
          isDark={isDark}
          onBgToggle={handleBgToggle}
        />
        <main className={styles.page}>
          <div className={styles.pinnedPhase}>
            <HeroSection mouseRef={mouseRef} onCtaClick={handleHeroCta} />
          </div>
          <div className={styles.coverTransition}>
            <AboutMaroSection ref={firstContentRef} />
          </div>
        </main>
        <Footer />
        <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      </div>
    </>
  )
}
