import type { ActivityArticle, ActivityArticleSummary } from '../types/activity'

interface MicroCmsListResponse<T> {
  contents: T[]
  totalCount: number
  offset: number
  limit: number
}

type MicroCmsActivityArticle = ActivityArticle & {
  createdAt?: string
  updatedAt?: string
  revisedAt?: string
}

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN
const apiKey = process.env.MICROCMS_API_KEY
const endpoint = process.env.MICROCMS_ACTIVITY_ENDPOINT || 'activities'

function isConfigured() {
  return Boolean(serviceDomain && apiKey)
}

function getBaseUrl() {
  return `https://${serviceDomain}.microcms.io/api/v1/${endpoint}`
}

async function requestMicroCms<T>(path = '', params?: Record<string, string>) {
  if (!isConfigured()) return null

  const url = new URL(`${getBaseUrl()}${path}`)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  const response = await fetch(url.toString(), {
    headers: {
      'X-MICROCMS-API-KEY': apiKey!,
    },
  })

  if (!response.ok) {
    console.warn(`microCMS request failed: ${response.status} ${response.statusText}`)
    return null
  }

  return response.json() as Promise<T>
}

export async function getActivityArticles(): Promise<ActivityArticleSummary[]> {
  const data = await requestMicroCms<MicroCmsListResponse<MicroCmsActivityArticle>>('', {
    fields: 'id,title,description,publishedAt,eyecatch',
    orders: '-publishedAt',
    limit: '50',
  })

  return data?.contents ?? []
}

export async function getActivityArticleIds() {
  if (!isConfigured()) return ['preview']

  const data = await requestMicroCms<MicroCmsListResponse<{ id: string }>>('', {
    fields: 'id',
    limit: '100',
  })

  return data?.contents.map((article) => article.id) ?? ['preview']
}

export async function getActivityArticle(id: string): Promise<ActivityArticle | null> {
  if (!isConfigured()) {
    if (id !== 'preview') return null

    return {
      id: 'preview',
      title: '記事詳細プレビュー',
      description: 'microCMSを接続すると、ここに活動記事の本文が表示されます。',
      publishedAt: new Date('2026-05-21T00:00:00.000Z').toISOString(),
      body: '<p>microCMSのサービスドメイン、APIキー、activities APIを設定すると、記事一覧と記事詳細が自動で生成されます。</p>',
    }
  }

  return requestMicroCms<ActivityArticle>(`/${id}`, {
    fields: 'id,title,description,body,publishedAt,eyecatch',
  })
}
