import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import {
  CONTACT_ROUNDEL_IMAGE,
  CONTACT_SASH_IMAGE,
  LINK_RIBBON_IMAGE,
  LOOP_RING_IMAGE,
} from '../config/assets'
import { getAppPath, type InternalPageId } from '../config/internal-pages'
import styles from '../styles/MaroTopicSection.module.css'

interface Props {
  eyebrow: string
  title: string
  lead: string
  lines: string[]
  pageId: InternalPageId
  action: string
  variant: 'activity' | 'contact' | 'link'
}

const RIBBON_REPEAT = Array.from({ length: 10 }, (_, index) => index)
const CONTACT_SASH_REPEAT = Array.from({ length: 8 }, (_, index) => index)

function setRevealMask(elements: NodeListOf<HTMLElement>, transparent: number, black: number) {
  elements.forEach((el, index) => {
    const offset = index * 12
    el.style.setProperty(
      '--topic-reveal-mask',
      `linear-gradient(-15deg, transparent ${transparent + offset}%, black ${black + offset}%)`,
    )
  })
}

export function MaroTopicSection({
  eyebrow,
  title,
  lead,
  lines,
  pageId,
  action,
  variant,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const hasRevealedRef = useRef(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasRevealedRef.current) return
        hasRevealedRef.current = true

        const revealTargets = section.querySelectorAll<HTMLElement>('[data-topic-reveal]')
        const mask = { transparent: 100, black: 150 }

        gsap.set(section.querySelector('[data-topic-button]'), { y: 18, opacity: 0 })
        setRevealMask(revealTargets, mask.transparent, mask.black)

        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .fromTo(
            mask,
            { transparent: 100, black: 150 },
            {
              duration: 2.4,
              transparent: -35,
              black: 0,
              ease: 'sine.out',
              onUpdate: () => setRevealMask(revealTargets, mask.transparent, mask.black),
              onComplete: () => {
                revealTargets.forEach((el) => {
                  el.style.setProperty('--topic-reveal-mask', 'linear-gradient(-15deg, black 0%, black 100%)')
                })
              },
            },
          )
          .to(section.querySelector('[data-topic-button]'), { y: 0, opacity: 1, duration: 0.65 }, '<55%')
      },
      { threshold: 0.58 },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id={pageId}
      ref={sectionRef}
      className={`${styles.section} ${styles[variant]}`}
      aria-label={title}
    >
      <div className={styles.visualTiles} aria-hidden="true">
        <span className={`${styles.tile} ${styles.tileOne}`} />
        <span className={`${styles.tile} ${styles.tileTwo}`} />
        <span className={`${styles.tile} ${styles.tileThree}`} />
      </div>

      {variant === 'activity' && (
        <div className={styles.loopRing} aria-hidden="true">
          <img src={LOOP_RING_IMAGE} alt="" />
        </div>
      )}

      {variant === 'contact' && (
        <>
          <div className={styles.contactSash} aria-hidden="true">
            <div className={styles.contactSashTrack}>
              {CONTACT_SASH_REPEAT.map((item) => (
                <img key={item} src={CONTACT_SASH_IMAGE} alt="" className={styles.contactSashImage} />
              ))}
            </div>
          </div>
          <div className={styles.contactRoundel} aria-hidden="true">
            <img src={CONTACT_ROUNDEL_IMAGE} alt="" />
          </div>
        </>
      )}

      {variant === 'link' && (
        <div className={styles.flowBanner} aria-hidden="true">
          {['top', 'bottom'].map((position) => (
            <div key={position} className={`${styles.diagonalRibbon} ${styles[position]}`}>
              <div className={styles.flowTrack}>
                {RIBBON_REPEAT.map((item) => (
                  <img key={item} src={LINK_RIBBON_IMAGE} alt="" className={styles.flowImage} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.content}>
        <p className={styles.eyebrow} data-topic-reveal>{eyebrow}</p>
        <h2 data-topic-reveal>{title}</h2>
        <p className={styles.lead} data-topic-reveal>{lead}</p>
        <div className={styles.body}>
          {lines.map((line) => (
            <p key={line} data-topic-reveal>{line}</p>
          ))}
        </div>
        <a href={getAppPath(pageId)} className={styles.button} data-topic-button>
          {action}
        </a>
      </div>
    </section>
  )
}
