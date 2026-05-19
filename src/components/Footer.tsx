import { SITE_CONTENT } from '../config/content'
import styles from '../styles/Footer.module.css'

function getTimestamp() {
  const now = new Date()
  return now.toISOString().slice(0, 10).replace(/-/g, '.')
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.timestamp}>{getTimestamp()}</span>
      <nav className={styles.links}>
        {SITE_CONTENT.footer.links.map((l) => (
          <a key={l.label} href={l.href} className={styles.link}>
            {l.label}
          </a>
        ))}
      </nav>
    </footer>
  )
}
