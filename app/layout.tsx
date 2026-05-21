import type { Metadata, Viewport } from 'next'
import '../src/styles/globals.css'
import '../src/styles/filters.css'

export const metadata: Metadata = {
  title: 'maro',
  description: '名古屋市博物館サポーターMARO',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
