export interface ActivityArticleSummary {
  id: string
  title: string
  description?: string
  publishedAt?: string
  eyecatch?: {
    url: string
    width?: number
    height?: number
  }
}

export interface ActivityArticle extends ActivityArticleSummary {
  body?: string
}
