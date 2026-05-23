import type { Metadata } from 'next'
import App from '../../src/App'
import { getActivityArticles } from '../../src/lib/microcms'
import { activityItemListSchema, breadcrumbSchema, webPageSchema } from '../../src/lib/structured-data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maroinu.pages.dev'

export const metadata: Metadata = {
  title: '活動内容',
  description:
    'MAROの活動内容一覧。名古屋市立大学（名市大）から始まった学生主体の博物館サポーター活動や、名古屋市博物館でのイベント・発信の取り組みを紹介します。',
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
      'MAROの活動内容一覧。名古屋市立大学（名市大）から始まった学生主体の博物館サポーター活動や、名古屋市博物館でのイベント・発信の取り組みを紹介します。',
    url: `${siteUrl}/activity/`,
    type: 'CollectionPage',
    keywords: [
      'MARO 活動内容',
      'MARO 博物館',
      '名市大 MARO',
      '名古屋市立大学 MARO',
      '名古屋市博物館 イベント',
      '博物館サポーター 活動',
    ],
  })
  const itemList = activityItemListSchema(articles)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(page) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <App initialPageId="activity" activityArticles={articles} />
    </>
  )
}
