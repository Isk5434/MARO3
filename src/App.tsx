'use client'

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
import type { InternalPageId } from './config/internal-pages'
import { useMouseTracker } from './hooks/useMouseTracker'
import styles from './styles/App.module.css'
import type { ActivityArticleSummary } from './types/activity'

interface AppProps {
  initialPageId?: InternalPageId | null
  activityArticles?: ActivityArticleSummary[]
}

function installZoomGuard() {
  let lastTouchEnd = 0

  const prevent = (event: Event) => event.preventDefault()
  const preventMultiTouch = (event: TouchEvent) => {
    if (event.touches.length > 1) event.preventDefault()
  }
  const preventDoubleTap = (event: TouchEvent) => {
    const now = Date.now()
    if (now - lastTouchEnd <= 300) event.preventDefault()
    lastTouchEnd = now
  }
  const preventCtrlWheel = (event: WheelEvent) => {
    if (event.ctrlKey) event.preventDefault()
  }

  document.addEventListener('gesturestart', prevent)
  document.addEventListener('gesturechange', prevent)
  document.addEventListener('gestureend', prevent)
  document.addEventListener('touchmove', preventMultiTouch, { passive: false })
  document.addEventListener('touchend', preventDoubleTap, { passive: false })
  window.addEventListener('wheel', preventCtrlWheel, { passive: false })

  return () => {
    document.removeEventListener('gesturestart', prevent)
    document.removeEventListener('gesturechange', prevent)
    document.removeEventListener('gestureend', prevent)
    document.removeEventListener('touchmove', preventMultiTouch)
    document.removeEventListener('touchend', preventDoubleTap)
    window.removeEventListener('wheel', preventCtrlWheel)
  }
}

export default function App({ initialPageId = null, activityArticles = [] }: AppProps) {
  const internalPageId = initialPageId
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

  useEffect(() => installZoomGuard(), [])

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
      <div className={styles.orientationGuard} role="alert" aria-live="assertive">
        <div className={styles.orientationMark} aria-hidden="true" />
        <p>スマートフォンは縦向きでご覧ください。</p>
      </div>
      <div className={`${styles.appShell} ${loaded ? styles.loaded : ''}`} aria-hidden={!loaded}>
        {isInternalPage ? (
          <InternalPage pageId={internalPageId} activityArticles={activityArticles} />
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
