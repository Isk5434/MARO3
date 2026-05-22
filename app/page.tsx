import type { Metadata } from 'next'
import App from '../src/App'
import { webPageSchema } from '../src/lib/structured-data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function HomePage() {
  const schema = webPageSchema({
    name: 'MARO | 名古屋市博物館サポーター',
    description:
      '名古屋市博物館サポーター団体MAROの公式サイト。毎週木曜日に大学や博物館で活動を行い、若い世代と博物館をつなぐ企画・運営・発信を続けています。',
    url: `${siteUrl}/`,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <App initialPageId={null} />
    </>
  )
}
