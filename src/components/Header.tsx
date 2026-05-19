import { useEffect, useRef, useState } from 'react'
import { SITE_CONTENT } from '../config/content'
import { getAppPath, INTERNAL_PAGES } from '../config/internal-pages'
import styles from '../styles/Header.module.css'

interface Props {
  isDark: boolean
  onBgToggle: () => void
}

const MENU_ITEMS = [
  INTERNAL_PAGES.activity,
  INTERNAL_PAGES.contact,
  INTERNAL_PAGES.link,
]

export function Header({ isDark, onBgToggle }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  return (
    <header className={styles.header}>
      <span className={styles.logo}>{SITE_CONTENT.title}</span>
      <div className={styles.controls}>
        <button
          className={`${styles.bgToggle}${isDark ? ` ${styles.dark}` : ''}`}
          onClick={onBgToggle}
          aria-label="Toggle background"
        />
        <div ref={menuRef} className={styles.menuArea}>
          <button
            className={`${styles.menuToggle}${menuOpen ? ` ${styles.open}` : ''}`}
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="phase-menu"
          >
            <span />
            <span />
            <span />
          </button>
          <nav
            id="phase-menu"
            className={`${styles.menuPanel}${menuOpen ? ` ${styles.visible}` : ''}`}
            aria-label="Main menu"
          >
            {MENU_ITEMS.map((item) => (
              <a key={item.id} href={getAppPath(item.id)} onClick={() => setMenuOpen(false)}>
                <span>{item.eyebrow}</span>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
