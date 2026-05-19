import gsap from 'gsap'
import { forwardRef, useEffect, useRef, useState } from 'react'
import styles from '../styles/AboutMaroSection.module.css'

const MARO_BODY = [
  '名古屋市博物館サポーターMARO（読み：マロ）は、「名古屋市博物館へ若者を呼び込む」という目標を掲げ、様々なイベントを企画・運営したり、博物館の魅力を多くの人に知ってもらう取り組みをしたりしているボランティア団体です。',
  '2009年、名古屋市立大学の授業で行った調査により、名古屋市博物館に訪れる若者が少ないということが明らかになりました。この状況を打開するために、名古屋市博物館へと大学生を呼び込むための取り組みがはじまりました。それ以来、授業の一環として様々な取り組みが行われました。',
  '2011年、継続的な活動を目指して組織を発足させることになりました。それが「名古屋市博物館サポーターMARO」です。',
  'MAROの発足以降も、名古屋市博物館の協力を得ながら、大学生が主体であるMAROならではの取り組みができるように、日々活動をしています。',
]

function setRevealMask(elements: NodeListOf<HTMLElement>, transparent: number, black: number) {
  elements.forEach((el, index) => {
    const offset = index * 12
    el.style.setProperty(
      '--about-reveal-mask',
      `linear-gradient(-15deg, transparent ${transparent + offset}%, black ${black + offset}%)`,
    )
  })
}

export const AboutMaroSection = forwardRef<HTMLElement>(function AboutMaroSection(_, ref) {
  const [isOpen, setIsOpen] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLElement>(null)
  const hasRevealedRef = useRef(false)

  const setRefs = (node: HTMLElement | null) => {
    sectionRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasRevealedRef.current) return
        hasRevealedRef.current = true

        const revealTargets = section.querySelectorAll<HTMLElement>('[data-about-reveal]')
        const mask = { transparent: 100, black: 150 }

        gsap.set(introRef.current, { opacity: 1 })
        gsap.set('[data-about-button]', { y: 18, opacity: 0 })
        setRevealMask(revealTargets, mask.transparent, mask.black)

        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .fromTo(
            mask,
            { transparent: 100, black: 150 },
            {
              duration: 1.35,
              transparent: -35,
              black: 0,
              ease: 'sine.out',
              onUpdate: () => setRevealMask(revealTargets, mask.transparent, mask.black),
            },
          )
          .to('[data-about-button]', { y: 0, opacity: 1, duration: 0.42 }, '<45%')
      },
      { threshold: 0.58 },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isOpen || !detailRef.current) return

    const revealTargets = detailRef.current.querySelectorAll<HTMLElement>('[data-detail-reveal]')
    const mask = { transparent: 100, black: 150 }
    setRevealMask(revealTargets, mask.transparent, mask.black)

    gsap.fromTo(
      detailRef.current,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' },
    )
    gsap.to(mask, {
      duration: 1.05,
      transparent: -35,
      black: 0,
      ease: 'sine.out',
      onUpdate: () => setRevealMask(revealTargets, mask.transparent, mask.black),
    })
  }, [isOpen])

  const handleOpen = () => {
    gsap.to(introRef.current, {
      y: -18,
      opacity: 0,
      scale: 1,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => setIsOpen(true),
    })
  }

  return (
    <section id="about" ref={setRefs} className={styles.section} aria-label="What is MARO">
      <div className={styles.visualTiles} aria-hidden="true">
        <span className={`${styles.tile} ${styles.tileOne}`} />
        <span className={`${styles.tile} ${styles.tileTwo}`} />
        <span className={`${styles.tile} ${styles.tileThree}`} />
        <span className={`${styles.tile} ${styles.tileFour}`} />
        <span className={`${styles.tile} ${styles.tileFive}`} />
      </div>

      <div className={styles.stage}>
        {!isOpen ? (
          <div ref={introRef} className={styles.intro}>
            <p className={styles.question} data-about-reveal>
              What is MARO？
            </p>
            <button
              className={styles.primaryButton}
              onClick={handleOpen}
              data-about-button
              aria-label="MAROとは？を開く"
            >
              <span className={styles.buttonLabel}>MAROとは？</span>
              <span className={styles.buttonArrow} aria-hidden="true">→</span>
            </button>
          </div>
        ) : (
          <article ref={detailRef} className={styles.detail}>
            <div className={styles.detailInner}>
              <h2 data-detail-reveal>MAROとは？</h2>
              {MARO_BODY.map((paragraph) => (
                <p key={paragraph} data-detail-reveal>
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        )}
      </div>
    </section>
  )
})
