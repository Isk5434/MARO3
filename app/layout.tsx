import type { Metadata, Viewport } from 'next'
import '../src/styles/globals.css'
import '../src/styles/filters.css'
import { organizationSchema, websiteSchema } from '../src/lib/structured-data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

const defaultTitle = 'MARO | 名古屋市博物館サポーター'
const defaultDescription =
  '名古屋市博物館サポーター団体MAROの公式サイト。毎週木曜日に大学や博物館で活動を行い、若い世代と博物館をつなぐ企画・運営・発信を続けています。'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: '%s | MARO',
  },
  description: defaultDescription,
  keywords: ['MARO', '名古屋市博物館', '博物館サポーター', '名古屋', '博物館', '活動', 'ミュージアム'],
  authors: [{ name: 'MARO' }],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: siteUrl,
    siteName: 'MARO | 名古屋市博物館サポーター',
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: '/15765-compressed.jpg',
        width: 1200,
        height: 630,
        alt: 'MARO - 名古屋市博物館サポーター',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: ['/15765-compressed.jpg'],
    site: '@maro_museum',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.jpg',
  },
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema()) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
