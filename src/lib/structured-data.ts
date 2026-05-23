const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maroinu.pages.dev'

export const orgId = `${siteUrl}/#organization`
export const websiteId = `${siteUrl}/#website`

const maroTopics = [
  { name: 'MARO', sameAs: `${siteUrl}/` },
  { name: '名古屋市博物館サポーター', sameAs: 'https://www.museum.city.nagoya.jp/' },
  { name: '名古屋市立大学', alternateName: '名市大' },
  { name: '博物館サポーター活動' },
  { name: '学生団体' },
  { name: '名古屋の文化活動' },
].map((topic) => ({
  '@type': 'Thing',
  ...topic,
}))

const defaultKeywords = [
  'MARO',
  'MARO 博物館',
  'maro 名市大',
  '名市大 MARO',
  '名古屋市立大学 MARO',
  '名古屋市博物館サポーター',
  '博物館サポーター',
  '学生団体',
]

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': orgId,
    name: 'MARO',
    alternateName: ['名古屋市博物館サポーターMARO', '名市大 MARO', '名古屋市立大学 MARO'],
    description:
      '名古屋市博物館サポーター団体MAROは、名古屋市立大学から始まった学生主体の活動として、若い世代と博物館をつなぐ企画・運営・発信を続けています。',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/favicon.svg`,
    },
    image: `${siteUrl}/15765-compressed.jpg`,
    foundingLocation: {
      '@type': 'Place',
      name: '名古屋市',
      address: {
        '@type': 'PostalAddress',
        addressLocality: '名古屋市',
        addressRegion: '愛知県',
        addressCountry: 'JP',
      },
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: '名古屋市',
    },
    knowsAbout: defaultKeywords,
    subjectOf: {
      '@type': 'WebSite',
      '@id': websiteId,
    },
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
      '名古屋市博物館サポーター団体MAROの公式サイト。名古屋市立大学から始まった学生主体の活動として、若い世代と博物館をつなぐ活動を続けています。',
    alternateName: ['MARO 博物館', 'maro 名市大', '名市大 MARO'],
    publisher: { '@id': orgId },
    inLanguage: 'ja',
    about: maroTopics,
    keywords: defaultKeywords,
    hasPart: [
      {
        '@type': 'WebPage',
        name: '活動内容',
        url: `${siteUrl}/activity/`,
      },
      {
        '@type': 'WebPage',
        name: 'お問い合わせ',
        url: `${siteUrl}/contact/`,
      },
      {
        '@type': 'WebPage',
        name: 'リンク',
        url: `${siteUrl}/link/`,
      },
      {
        '@type': 'DigitalDocument',
        name: 'llms.txt',
        url: `${siteUrl}/llms.txt`,
        encodingFormat: 'text/plain',
      },
    ],
  }
}

export function webPageSchema({
  name,
  description,
  url,
  breadcrumb,
  type = 'WebPage',
  keywords = defaultKeywords,
  about = maroTopics,
}: {
  name: string
  description: string
  url: string
  breadcrumb?: { name: string; url: string }[]
  type?: 'WebPage' | 'AboutPage' | 'CollectionPage' | 'ContactPage'
  keywords?: string[]
  about?: Array<Record<string, unknown>>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description,
    url,
    isPartOf: { '@id': websiteId },
    publisher: { '@id': orgId },
    inLanguage: 'ja',
    about,
    keywords,
    mainEntity: { '@id': orgId },
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
  category,
}: {
  title: string
  description: string
  url: string
  publishedAt: string
  imageUrl?: string
  category?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    mainEntityOfPage: url,
    datePublished: publishedAt,
    inLanguage: 'ja',
    author: { '@id': orgId },
    publisher: { '@id': orgId },
    isPartOf: { '@id': websiteId },
    isAccessibleForFree: true,
    articleSection: category ?? '活動内容',
    about: maroTopics,
    keywords: category ? [...defaultKeywords, category] : defaultKeywords,
    ...(imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: imageUrl,
      },
    }),
  }
}

export function activityItemListSchema(
  articles: {
    id: string
    title: string
    description?: string
    publishedAt?: string
    category?: string
  }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'MAROの活動記事一覧',
    description:
      '名古屋市博物館サポーター団体MAROの活動、イベント、発信の記録をまとめた一覧です。',
    itemListElement: articles.map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}/activity/${article.id}/`,
      item: {
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        datePublished: article.publishedAt,
        articleSection: article.category,
        url: `${siteUrl}/activity/${article.id}/`,
        publisher: { '@id': orgId },
      },
    })),
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
