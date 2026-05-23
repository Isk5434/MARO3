import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ページが見つかりません',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        gap: '1.5rem',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ fontSize: '4rem', margin: 0, lineHeight: 1 }}>404</h1>
      <p style={{ fontSize: '1.125rem', margin: 0 }}>ページが見つかりません</p>
      <p style={{ color: '#666', margin: 0 }}>
        URLが変更されたか、ページが削除された可能性があります。
      </p>
      <Link
        href="/"
        style={{
          marginTop: '0.5rem',
          padding: '0.75rem 2rem',
          background: '#000',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '0.375rem',
        }}
      >
        トップへ戻る
      </Link>
    </main>
  )
}
