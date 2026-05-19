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

  return (
    <div
      className={`${styles.backdrop}${isOpen ? ` ${styles.open}` : ''}`}
      onClick={onClose}
    >
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 className={styles.heading}>{about.heading}</h2>
        <p className={styles.body}>{about.body}</p>
        <div className={styles.links}>
          {about.links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={styles.link}
              target="_blank"
              rel="noreferrer"
            >
              {l.label} →
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
