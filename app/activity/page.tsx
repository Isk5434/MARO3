import type { Metadata } from 'next'
import App from '../../src/App'
import { getActivityArticles } from '../../src/lib/microcms'
import { breadcrumbSchema, webPageSchema } from '../../src/lib/structured-data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

export const metadata: Metadata = {
  title: '活動内容',
  description:
    'MAROの活動内容一覧。名古屋市博物館でのイベントや、若い世代と博物館をつなぐ企画・運営・発信の取り組みを紹介します。',
  alternates: { canonical: '/activity/' },
}

export default async function ActivityPage() {
  const articles = await getActivityArticles()

  const breadcrumb = breadcrumbSchema([
    { name: 'ホーム', url: `${siteUrl}/` },
    { name: '活動内容', url: `${siteUrl}/activity/` },
  ])

  const page = webPageSchema({
    name: '活動内容 | MARO',
    description:
      'MAROの活動内容一覧。名古屋市博物館でのイベントや、若い世代と博物館をつなぐ企画・運営・発信の取り組みを紹介します。',
    url: `${siteUrl}/activity/`,
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(page) }} />
      <App initialPageId="activity" activityArticles={articles} />
    </>
  )
}
