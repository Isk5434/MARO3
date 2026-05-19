import { SITE_CONTENT } from '../config/content'
import styles from '../styles/Header.module.css'

interface Props {
  isDark: boolean
  onBgToggle: () => void
}

export function Header({ isDark, onBgToggle }: Props) {
  return (
    <header className={styles.header}>
      <span className={styles.logo}>{SITE_CONTENT.title}</span>
      <div className={styles.controls}>
        <button
          className={`${styles.bgToggle}${isDark ? ` ${styles.dark}` : ''}`}
          onClick={onBgToggle}
          aria-label="Toggle background"
        />
      </div>
    </header>
  )
}
