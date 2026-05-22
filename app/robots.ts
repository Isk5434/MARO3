import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      // AI answer engines — explicitly allowed for AEO
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'Claude-Web', allow: '/' },
      { userAgent: 'cohere-ai', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
      { userAgent: 'YouBot', allow: '/' },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
