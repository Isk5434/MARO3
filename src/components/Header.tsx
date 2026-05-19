import { SITE_CONTENT } from '../config/content'
import styles from '../styles/Header.module.css'

interface Props {
  onAboutClick: () => void
  isDark: boolean
  onBgToggle: () => void
}

export function Header({ onAboutClick, isDark, onBgToggle }: Props) {
  return (
    <header className={styles.header}>
      <span className={styles.logo}>{SITE_CONTENT.title}</span>
      <div className={styles.controls}>
        <button className={styles.btn} onClick={onAboutClick}>
          About
        </button>
        <button
          className={`${styles.bgToggle}${isDark ? ` ${styles.dark}` : ''}`}
          onClick={onBgToggle}
          aria-label="Toggle background"
        />
      </div>
    </header>
  )
}
