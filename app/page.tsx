import type { Metadata } from 'next'
import App from '../src/App'
import { webPageSchema } from '../src/lib/structured-data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maroinu.pages.dev'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function HomePage() {
  const schema = webPageSchema({
    name: 'MARO | 名古屋市博物館サポーター',
    description:
      '名古屋市博物館サポーター団体MAROの公式サイト。名古屋市立大学（名市大）から始まった学生主体の活動として、若い世代と博物館をつなぐ企画・運営・発信を続けています。',
    url: `${siteUrl}/`,
    keywords: [
      'MARO',
      'MARO 博物館',
      'maro 名市大',
      '名市大 MARO',
      '名古屋市立大学 MARO',
      '名古屋市博物館サポーター',
    ],
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
