import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { PEEK_FOOTER_IMAGE } from '../config/assets'
import styles from '../styles/PeekFooter.module.css'

export function PeekFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const imageWrapRef = useRef<HTMLDivElement>(null)
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const imageWrap = imageWrapRef.current
    if (!wrapper || !imageWrap) return

    const checkBottom = () => {
      if (hasAnimatedRef.current) return
      const scrollBottom = window.scrollY + window.innerHeight
      const pageHeight = document.documentElement.scrollHeight
      if (scrollBottom >= pageHeight - 32) {
        hasAnimatedRef.current = true
        gsap.set(wrapper, { pointerEvents: 'none' })
        gsap.to(imageWrap, {
          y: 0,
          opacity: 1,
          duration: 0.95,
          ease: 'power3.out',
        })
      }
    }

    window.addEventListener('scroll', checkBottom, { passive: true })
    checkBottom()
    return () => window.removeEventListener('scroll', checkBottom)
  }, [])

  return (
    <div ref={wrapperRef} className={styles.wrapper} aria-hidden="true">
      <div ref={imageWrapRef} className={styles.imageWrap}>
        <img src={PEEK_FOOTER_IMAGE} alt="" className={styles.image} />
      </div>
    </div>
  )
}
