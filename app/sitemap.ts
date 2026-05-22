import type { MetadataRoute } from 'next'
import { getActivityArticleIds } from '../src/lib/microcms'

export const dynamic = 'force-static'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articleIds = await getActivityArticleIds()

  const articleUrls: MetadataRoute.Sitemap = articleIds.map((id) => ({
    url: `${siteUrl}/activity/${id}/`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    { url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/activity/`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/contact/`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/link/`, changeFrequency: 'monthly', priority: 0.5 },
    ...articleUrls,
  ]
}
