import type { Metadata } from 'next'
import App from '../../src/App'
import { breadcrumbSchema, webPageSchema } from '../../src/lib/structured-data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maroinu.pages.dev'

export const metadata: Metadata = {
  title: 'リンク',
  description:
    'MAROのSNS・ブログ・各種リンクをまとめたページ。Facebook、Twitter / X、Instagram の更新情報やMAROブログへのリンクを掲載しています。',
  alternates: { canonical: '/link/' },
}

export default function LinkPage() {
  const breadcrumb = breadcrumbSchema([
    { name: 'ホーム', url: `${siteUrl}/` },
    { name: 'リンク', url: `${siteUrl}/link/` },
  ])

  const page = webPageSchema({
    name: 'リンク | MARO',
    description:
      'MAROのSNS・ブログ・各種リンクをまとめたページ。Facebook、Twitter / X、Instagram の更新情報やMAROブログへのリンクを掲載しています。',
    url: `${siteUrl}/link/`,
    keywords: ['MARO SNS', 'MARO Instagram', 'MARO X', 'MARO ブログ', '名市大 MARO'],
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(page) }}
      />
      <App initialPageId="link" />
    </>
  )
}
