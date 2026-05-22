const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

export const orgId = `${siteUrl}/#organization`
export const websiteId = `${siteUrl}/#website`

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': orgId,
    name: 'MARO',
    alternateName: '名古屋市博物館サポーターMARO',
    description:
      '名古屋市博物館サポーター団体MAROは、毎週木曜日に大学や博物館で活動し、若い世代と博物館をつなぐ企画・運営・発信を続けています。',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/favicon.svg`,
    },
    image: `${siteUrl}/15765-compressed.jpg`,
    sameAs: [
      'https://www.facebook.com/ncumaro/',
      'https://x.com/meishihakusapo',
      'https://www.instagram.com/maroinu_dayo',
      'https://museumsupporter-maro.wixsite.com/maro',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: '名古屋市',
      addressRegion: '愛知県',
      addressCountry: 'JP',
    },
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    url: siteUrl,
    name: 'MARO | 名古屋市博物館サポーター',
    description:
      '名古屋市博物館サポーター団体MAROの公式サイト。若い世代と博物館をつなぐ活動を続けています。',
    publisher: { '@id': orgId },
    inLanguage: 'ja',
  }
}

export function webPageSchema({
  name,
  description,
  url,
  breadcrumb,
}: {
  name: string
  description: string
  url: string
  breadcrumb?: { name: string; url: string }[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    isPartOf: { '@id': websiteId },
    publisher: { '@id': orgId },
    inLanguage: 'ja',
    ...(breadcrumb && { breadcrumb: breadcrumbSchema(breadcrumb) }),
  }
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function articleSchema({
  title,
  description,
  url,
  publishedAt,
  imageUrl,
}: {
  title: string
  description: string
  url: string
  publishedAt: string
  imageUrl?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    datePublished: publishedAt,
    inLanguage: 'ja',
    author: { '@id': orgId },
    publisher: { '@id': orgId },
    isPartOf: { '@id': websiteId },
    ...(imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: imageUrl,
      },
    }),
  }
}

export function faqSchema(
  items: { question: string; answer: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
