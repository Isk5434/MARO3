import type { MetadataRoute } from 'next'
import { getActivityArticleIds } from '../src/lib/microcms'

export const dynamic = 'force-static'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maroinu.pages.dev'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articleIds = await getActivityArticleIds()
  const generatedAt = new Date()

  const articleUrls: MetadataRoute.Sitemap = articleIds.map((id) => ({
    url: `${siteUrl}/activity/${id}/`,
    lastModified: generatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    { url: `${siteUrl}/`, lastModified: generatedAt, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/activity/`, lastModified: generatedAt, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/contact/`, lastModified: generatedAt, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/link/`, lastModified: generatedAt, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/llms.txt`, lastModified: generatedAt, changeFrequency: 'monthly', priority: 0.4 },
    ...articleUrls,
  ]
}
