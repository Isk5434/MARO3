import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getActivityArticle, getActivityArticleIds } from '../../../src/lib/microcms'
import { ActivityArticleView } from '../../../src/components/ActivityArticleView'
import { articleSchema, breadcrumbSchema } from '../../../src/lib/structured-data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maroinu.pages.dev'

interface Props {
  params: Promise<{ id: string }>
}

export const dynamicParams = false

export async function generateStaticParams() {
  const ids = await getActivityArticleIds()
  return ids.map((id) => ({ id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const article = await getActivityArticle(id)

  if (!article) return { title: '記事が見つかりません' }

  const ogImages = article.eyecatch
    ? [{ url: article.eyecatch.url, width: article.eyecatch.width, height: article.eyecatch.height, alt: article.title }]
    : undefined

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/activity/${id}/` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.description,
      publishedTime: article.publishedAt,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: article.eyecatch ? [article.eyecatch.url] : undefined,
    },
  }
}

export default async function ActivityArticlePage({ params }: Props) {
  const { id } = await params
  const article = await getActivityArticle(id)

  if (!article) notFound()

  const article_schema = articleSchema({
    title: article.title,
    description: article.description ?? '',
    url: `${siteUrl}/activity/${id}/`,
    publishedAt: article.publishedAt ?? new Date().toISOString(),
    imageUrl: article.eyecatch?.url,
    category: article.category,
  })

  const breadcrumb = breadcrumbSchema([
    { name: 'ホーム', url: `${siteUrl}/` },
    { name: '活動内容', url: `${siteUrl}/activity/` },
    { name: article.title, url: `${siteUrl}/activity/${id}/` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article_schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <ActivityArticleView article={article} />
    </>
  )
}
