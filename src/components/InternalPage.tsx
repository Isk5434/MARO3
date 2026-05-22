import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import {
  CONTACT_ROUNDEL_IMAGE,
  CONTACT_ROUNDEL_MOBILE_IMAGE,
  CONTACT_SASH_IMAGE,
  CONTACT_SASH_MOBILE_IMAGE,
  FAVICON_IMAGE,
  LINK_RIBBON_IMAGE,
  LINK_RIBBON_MOBILE_IMAGE,
  LOOP_RING_IMAGE,
  LOOP_RING_MOBILE_IMAGE,
} from '../config/assets'
import { INTERNAL_PAGES, getAppPath, type InternalPageId } from '../config/internal-pages'
import styles from '../styles/InternalPage.module.css'
import type { ActivityArticleSummary } from '../types/activity'

interface Props {
  pageId: InternalPageId
  activityArticles?: ActivityArticleSummary[]
}

function ContactForm() {
  const [fields, setFields] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY,
          ...fields,
        }),
      })
      const json = await res.json()
      setStatus(json.success ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <p className={styles.formSuccess} data-internal-action>
        送信が完了しました。ありがとうございます。
      </p>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        お名前
        <input
          type="text"
          name="name"
          required
          autoComplete="name"
          value={fields.name}
          onChange={handleChange}
          data-internal-action
        />
      </label>
      <label>
        メールアドレス
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={fields.email}
          onChange={handleChange}
          data-internal-action
        />
      </label>
      <label>
        お問い合わせ内容
        <textarea
          name="message"
          rows={5}
          required
          value={fields.message}
          onChange={handleChange}
          data-internal-action
        />
      </label>
      {status === 'error' && (
        <p className={styles.formError}>送信に失敗しました。時間をおいて再度お試しください。</p>
      )}
      <button type="submit" disabled={status === 'sending'} data-internal-action>
        {status === 'sending' ? '送信中…' : '送信する'}
      </button>
    </form>
  )
}

const RIBBON_REPEAT = Array.from({ length: 10 }, (_, index) => index)
const CONTACT_SASH_REPEAT = Array.from({ length: 8 }, (_, index) => index)

function setRevealMask(elements: NodeListOf<HTMLElement>, transparent: number, black: number) {
  elements.forEach((el, index) => {
    const offset = index * 10
    el.style.setProperty(
      '--internal-reveal-mask',
      `linear-gradient(-15deg, transparent ${transparent + offset}%, black ${black + offset}%)`,
    )
  })
}

function formatDate(date?: string) {
  if (!date) return ''
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

export function InternalPage({ pageId, activityArticles = [] }: Props) {
  const page = INTERNAL_PAGES[pageId]
  const sectionRef = useRef<HTMLElement>(null)
  const pageClassName = styles[`${pageId}Page`] ?? ''
  const sectionClassName = styles[`${pageId}Section`] ?? ''

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
    <main className={`${styles.page} ${pageClassName}`}>
      <a href={getAppPath('')} className={styles.backLink}>
        TOPへ戻る
      </a>

      <section
        ref={sectionRef}
        className={`${styles.section} ${sectionClassName}`}
      >
        {pageId === 'activity' && (
          <div className={styles.loopRing} aria-hidden="true">
            <picture>
              <source media="(max-width: 720px)" srcSet={LOOP_RING_MOBILE_IMAGE} type="image/webp" />
              <img src={LOOP_RING_IMAGE} alt="" />
            </picture>
          </div>
        )}

        {pageId === 'contact' && (
          <>
            <div className={styles.contactSash} aria-hidden="true">
              <div className={styles.contactSashTrack}>
                {CONTACT_SASH_REPEAT.map((item) => (
                  <picture key={item} className={styles.contactSashPicture}>
                    <source media="(max-width: 720px)" srcSet={CONTACT_SASH_MOBILE_IMAGE} type="image/webp" />
                    <img src={CONTACT_SASH_IMAGE} alt="" className={styles.contactSashImage} />
                  </picture>
                ))}
              </div>
            </div>
            <div className={styles.contactRoundel} aria-hidden="true">
              <picture>
                <source media="(max-width: 720px)" srcSet={CONTACT_ROUNDEL_MOBILE_IMAGE} type="image/webp" />
                <img src={CONTACT_ROUNDEL_IMAGE} alt="" />
              </picture>
            </div>
          </>
        )}

        {pageId === 'link' && (
          <div className={styles.flowBanner} aria-hidden="true">
            {['top', 'bottom'].map((position) => (
              <div key={position} className={`${styles.diagonalRibbon} ${styles[position]}`}>
                <div className={styles.flowTrack}>
                  {RIBBON_REPEAT.map((item) => (
                    <picture key={item} className={styles.flowPicture}>
                      <source media="(max-width: 720px)" srcSet={LINK_RIBBON_MOBILE_IMAGE} type="image/webp" />
                      <img src={LINK_RIBBON_IMAGE} alt="" className={styles.flowImage} />
                    </picture>
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

          {pageId === 'activity' && (
            <section className={styles.articleList} aria-label="活動記事一覧">
              <div className={styles.articleListHeader} data-internal-action>
                <p>ACTIVITY LOG</p>
                <h2>記事一覧</h2>
              </div>

              {activityArticles.length > 0 ? (
                <div className={styles.articleGrid}>
                  {activityArticles.map((article) => (
                    <a
                      key={article.id}
                      href={`${getAppPath('activity')}/${article.id}`}
                      className={styles.articleCard}
                      data-internal-action
                    >
                      {article.eyecatch?.url && (
                        <img
                          src={article.eyecatch.url}
                          alt=""
                          className={styles.articleImage}
                          loading="lazy"
                        />
                      )}
                      <div className={styles.articleText}>
                        <span className={styles.articleMeta}>{formatDate(article.publishedAt)}</span>
                        <strong>{article.title}</strong>
                        {article.description && <small>{article.description}</small>}
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyArticles} data-internal-action>
                  記事はまだありません。microCMSを接続すると、ここに活動記事が表示されます。
                </p>
              )}
            </section>
          )}

          {pageId === 'contact' && <ContactForm />}

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
                  <img src={FAVICON_IMAGE} alt="" className={styles.blogThumb} aria-hidden="true" />
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
