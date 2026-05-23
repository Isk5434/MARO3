import { useEffect } from 'react'
import { SITE_CONTENT } from '../config/content'
import styles from '../styles/AboutModal.module.css'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function AboutModal({ isOpen, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const { about } = SITE_CONTENT

  if (!isOpen) return null

  return (
    <div
      className={`${styles.backdrop}${isOpen ? ` ${styles.open}` : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
      >
        <button className={styles.closeBtn} type="button" onClick={onClose} aria-label="閉じる">
          ✕
        </button>
        <h2 id="about-modal-title" className={styles.heading}>
          {about.heading}
        </h2>
        <p className={styles.body}>{about.body}</p>
        <div className={styles.links}>
          {about.links.map((l) => (
            <a key={l.label} href={l.href} className={styles.link} target="_blank" rel="noreferrer">
              {l.label} →
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
