import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AboutModal } from './components/AboutModal'
import { AboutMaroSection } from './components/AboutMaroSection'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { HeroSection } from './components/HeroSection'
import { InternalPage } from './components/InternalPage'
import { LoadingScreen } from './components/LoadingScreen'
import { MaroTopicSection } from './components/MaroTopicSection'
import { PeekFooter } from './components/PeekFooter'
import { SvgFilters } from './components/SvgFilters'
import { getCurrentInternalPage } from './config/internal-pages'
import { useMouseTracker } from './hooks/useMouseTracker'
import styles from './styles/App.module.css'

export default function App() {
  const internalPageId = getCurrentInternalPage()
  const isInternalPage = internalPageId !== null
  const [loaded, setLoaded] = useState(isInternalPage)
  const [showAbout, setShowAbout] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [heroActive, setHeroActive] = useState(true)
  const firstContentRef = useRef<HTMLElement | null>(null)
  const mouseRef = useRef({ nx: 0, ny: 0 })

  useMouseTracker(({ nx, ny }) => {
    mouseRef.current.nx = nx
    mouseRef.current.ny = ny
  })

  const handleBgToggle = useCallback(() => {
    setIsDark((current) => !current)
  }, [])

  useLayoutEffect(() => {
    document.body.classList.toggle('dark-bg', isDark)
  }, [isDark])

  const handleHeroCta = useCallback(() => {
    firstContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    if (isInternalPage) return

    let rafId = 0
    const updateHeroActive = () => {
      rafId = 0
      setHeroActive(window.scrollY < window.innerHeight * 1.2)
    }

    const handleScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(updateHeroActive)
    }

    updateHeroActive()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isInternalPage])

  return (
    <>
      <SvgFilters />
      {!isInternalPage && <LoadingScreen onLoaded={() => setLoaded(true)} />}
      <div className={`${styles.appShell} ${loaded ? styles.loaded : ''}`} aria-hidden={!loaded}>
        {isInternalPage ? (
          <InternalPage pageId={internalPageId} />
        ) : (
          <>
            <Header
              isDark={isDark}
              onBgToggle={handleBgToggle}
            />
            <main className={styles.page}>
              <div className={styles.pinnedPhase}>
                <HeroSection mouseRef={mouseRef} onCtaClick={handleHeroCta} active={heroActive} />
              </div>
              <div className={styles.coverTransition}>
                <AboutMaroSection ref={firstContentRef} />
                <MaroTopicSection
                  eyebrow="ACTIVITY"
                  title="活動内容"
                  lead="毎週木曜日に大学や博物館で会議などの活動を行っています。"
                  lines={[
                    '名古屋市博物館でのイベントや、魅力発信のための取り組みを行ってきました。',
                    '若い世代が博物館と出会うきっかけをつくるため、企画・運営・発信を続けています。',
                  ]}
                  pageId="activity"
                  action="活動内容を見る"
                  variant="activity"
                />
                <MaroTopicSection
                  eyebrow="CONTACT"
                  title="お問い合わせ"
                  lead="MAROの活動見学・入部希望・取材・お問い合わせ等はこちらから。"
                  lines={[
                    '活動に興味がある方、見学や入部を希望される方、取材や協働の相談をしたい方へ。',
                    'このホームページ内にお問い合わせページを用意しています。',
                  ]}
                  pageId="contact"
                  action="お問い合わせへ"
                  variant="contact"
                />
                <MaroTopicSection
                  eyebrow="LINK"
                  title="リンク"
                  lead="SNS、ブログ、各種リンクをまとめて見られるページです。"
                  lines={[
                    'Facebook、Twitter / X、Instagram の更新情報と、MAROブログへの入口をまとめています。',
                    '各種リンクやサイトマップも、このホームページ内のページとして整理します。',
                  ]}
                  pageId="link"
                  action="リンクを見る"
                  variant="link"
                />
                <PeekFooter />
              </div>
            </main>
            <Footer />
            <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
          </>
        )}
      </div>
    </>
  )
}
