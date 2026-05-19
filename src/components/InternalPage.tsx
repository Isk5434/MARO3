import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { LINK_RIBBON_IMAGE } from '../config/assets'
import { INTERNAL_PAGES, getAppPath, type InternalPageId } from '../config/internal-pages'
import styles from '../styles/InternalPage.module.css'

interface Props {
  pageId: InternalPageId
}

const RIBBON_REPEAT = Array.from({ length: 10 }, (_, index) => index)

function setRevealMask(elements: NodeListOf<HTMLElement>, transparent: number, black: number) {
  elements.forEach((el, index) => {
    const offset = index * 10
    el.style.setProperty(
      '--internal-reveal-mask',
      `linear-gradient(-15deg, transparent ${transparent + offset}%, black ${black + offset}%)`,
    )
  })
}

export function InternalPage({ pageId }: Props) {
  const page = INTERNAL_PAGES[pageId]
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const revealTargets = section.querySelectorAll<HTMLElement>('[data-internal-reveal]')
    const actionTargets = Array.from(section.querySelectorAll<HTMLElement>('[data-internal-action]'))
    const mask = { transparent: 100, black: 150 }

    if (actionTargets.length > 0) gsap.set(actionTargets, { y: 16, opacity: 0 })
    setRevealMask(revealTargets, mask.transparent, mask.black)

    const timeline = gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .fromTo(
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
              el.style.removeProperty('--internal-reveal-mask')
              el.style.webkitMaskImage = 'none'
              el.style.maskImage = 'none'
            })
          },
        },
      )

    if (actionTargets.length > 0) {
      timeline.to(actionTargets, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06 }, '<55%')
    }
  }, [pageId])

  return (
    <main className={`${styles.page} ${pageId === 'link' ? styles.linkPage : ''}`}>
      <a href={getAppPath('')} className={styles.backLink}>
        TOPへ戻る
      </a>

      <section
        ref={sectionRef}
        className={`${styles.section} ${pageId === 'link' ? styles.linkSection : ''}`}
      >
        {pageId === 'link' && (
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

        <div className={styles.visualTiles} aria-hidden="true">
          <span className={`${styles.tile} ${styles.tileOne}`} />
          <span className={`${styles.tile} ${styles.tileTwo}`} />
          <span className={`${styles.tile} ${styles.tileThree}`} />
        </div>

        <article className={styles.content}>
          <p className={styles.eyebrow} data-internal-reveal>{page.eyebrow}</p>
          <h1 data-internal-reveal>{page.title}</h1>
          <p className={styles.lead} data-internal-reveal>{page.lead}</p>
          <div className={styles.body}>
            {page.body.map((paragraph) => (
              <p key={paragraph} data-internal-reveal>{paragraph}</p>
            ))}
          </div>

          {pageId === 'contact' && (
            <form className={styles.form}>
              <label>
                お名前
                <input type="text" name="name" autoComplete="name" data-internal-action />
              </label>
              <label>
                メールアドレス
                <input type="email" name="email" autoComplete="email" data-internal-action />
              </label>
              <label>
                お問い合わせ内容
                <textarea name="message" rows={5} data-internal-action />
              </label>
              <button type="button" data-internal-action>送信内容を確認</button>
            </form>
          )}

          {pageId === 'link' && (
            <div className={styles.summaryGrid}>
              <section className={styles.summaryBlock}>
                <h2>▼SNSも更新中！</h2>
                <div className={styles.socialIconList} aria-label="SNS links">
                  <a href="#facebook" aria-label="Facebook" data-internal-action>
                    <span className={styles.socialIcon}>f</span>
                    Facebook
                  </a>
                  <a href="#twitter" aria-label="Twitter / X" data-internal-action>
                    <span className={styles.socialIcon}>X</span>
                    Twitter / X
                  </a>
                  <a href="#instagram" aria-label="Instagram" data-internal-action>
                    <span className={styles.socialIcon}>◎</span>
                    Instagram
                  </a>
                </div>
              </section>

              <section className={styles.summaryBlock}>
                <h2>▼ブログも見てね！</h2>
                <a href="#blog" className={styles.blogCard} data-internal-action>
                  <span className={styles.blogThumb} aria-hidden="true" />
                  <span>
                    <strong>MAROブログ</strong>
                    <small>「知的好奇心こしょぐり隊」</small>
                  </span>
                </a>
              </section>

              <section className={styles.summaryBlock}>
                <h2>各種リンク / サイトマップ</h2>
                <div className={styles.linkList}>
                  <a href={getAppPath('activity')} data-internal-action>活動内容</a>
                  <a href={getAppPath('contact')} data-internal-action>お問い合わせ</a>
                  <a href={getAppPath('')} data-internal-action>トップページ</a>
                </div>
              </section>
            </div>
          )}
        </article>
      </section>
    </main>
  )
}
