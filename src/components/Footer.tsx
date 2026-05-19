import styles from '../styles/Footer.module.css'

function getTimestamp() {
  const now = new Date()
  return now.toISOString().slice(0, 10).replace(/-/g, '.')
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.timestamp}>{getTimestamp()}</span>
    </footer>
  )
}
