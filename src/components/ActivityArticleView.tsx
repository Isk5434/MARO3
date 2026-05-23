'use client'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { getAppPath } from '../config/internal-pages'
import styles from '../styles/ActivityArticle.module.css'
import type { ActivityArticle } from '../types/activity'

function formatDate(date?: string) {
  if (!date) return ''
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

function setRevealMask(elements: NodeListOf<HTMLElement>, transparent: number, black: number) {
  elements.forEach((el, index) => {
    const offset = index * 10
    el.style.setProperty(
      '--article-reveal-mask',
      `linear-gradient(-15deg, transparent ${transparent + offset}%, black ${black + offset}%)`,
    )
  })
}

export function ActivityArticleView({ article }: { article: ActivityArticle }) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const revealTargets = section.querySelectorAll<HTMLElement>('[data-article-reveal]')
    const mask = { transparent: 100, black: 150 }
    setRevealMask(revealTargets, mask.transparent, mask.black)

    gsap.timeline({ defaults: { ease: 'power3.out' } }).fromTo(
      mask,
      { transparent: 100, black: 150 },
      {
        duration: 2.2,
        transparent: -35,
        black: 0,
        ease: 'sine.out',
        onUpdate: () => setRevealMask(revealTargets, mask.transparent, mask.black),
        onComplete: () => {
          revealTargets.forEach((el) => {
            el.style.removeProperty('--article-reveal-mask')
            el.style.webkitMaskImage = 'none'
            el.style.maskImage = 'none'
          })
        },
      },
    )
  }, [])

  return (
    <main className={styles.page}>
      <a href={getAppPath('activity')} className={styles.backLink}>
        活動内容へ戻る
      </a>

      <section ref={sectionRef} className={styles.section}>
        <div className={styles.visualTiles} aria-hidden="true">
          <span className={`${styles.tile} ${styles.tileOne}`} />
          <span className={`${styles.tile} ${styles.tileTwo}`} />
          <span className={`${styles.tile} ${styles.tileThree}`} />
        </div>

        <article className={styles.content}>
          <p className={styles.eyebrow} data-article-reveal>
            ACTIVITY LOG
          </p>
          <h1 data-article-reveal>{article.title}</h1>
          {article.publishedAt && (
            <time dateTime={article.publishedAt} data-article-reveal>
              {formatDate(article.publishedAt)}
            </time>
          )}
          {article.description && (
            <p className={styles.lead} data-article-reveal>
              {article.description}
            </p>
          )}

          {article.eyecatch?.url && (
            <img src={article.eyecatch.url} alt="" className={styles.eyecatch} />
          )}

          {article.body ? (
            <div className={styles.body} dangerouslySetInnerHTML={{ __html: article.body }} />
          ) : (
            <p className={styles.body}>本文はまだありません。</p>
          )}
        </article>
      </section>
    </main>
  )
}
