export type ActivityImage = {
  url: string
  width: number
  height: number
}

export type ActivityArticleSummary = {
  id: string
  title: string
  description?: string
  publishedAt: string
  revisedAt?: string
  category?: string
  eyecatch?: ActivityImage
}

export type ActivityArticle = ActivityArticleSummary & {
  body: string
}
