import type { Metadata, Viewport } from 'next'
import '../src/styles/globals.css'
import '../src/styles/filters.css'
import { organizationSchema, websiteSchema } from '../src/lib/structured-data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maroinu.pages.dev'
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const defaultTitle = 'MARO | 名古屋市博物館サポーター・名古屋市立大学発の学生団体'
const defaultDescription =
  '名古屋市博物館サポーター団体MAROの公式サイト。名古屋市立大学から始まった学生主体の活動として、若い世代と博物館をつなぐ企画・運営・発信を続けています。'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: '%s | MARO',
  },
  description: defaultDescription,
  keywords: [
    'MARO',
    'MARO 博物館',
    'maro 名市大',
    '名市大 MARO',
    '名古屋市立大学 MARO',
    '名古屋市博物館',
    '博物館サポーター',
    '名古屋',
    '博物館',
    '学生団体',
    'ミュージアム',
  ],
  authors: [{ name: 'MARO' }],
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    title: 'MARO',
    statusBarStyle: 'default',
  },
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
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
        {process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN}"}`}
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  )
}
