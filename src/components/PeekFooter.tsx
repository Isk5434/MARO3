import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { PEEK_FOOTER_IMAGE } from '../config/assets'
import styles from '../styles/PeekFooter.module.css'

export function PeekFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const img = imgRef.current
    if (!wrapper || !img) return

    gsap.set(img, { y: '100%' })

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimatedRef.current) return
        hasAnimatedRef.current = true
        gsap.to(img, {
          y: '0%',
          duration: 1.4,
          ease: 'elastic.out(1, 0.55)',
        })
      },
      { threshold: 0.05 },
    )

    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={wrapperRef} className={styles.wrapper} aria-hidden="true">
      <img ref={imgRef} src={PEEK_FOOTER_IMAGE} alt="" className={styles.image} />
    </div>
  )
}
