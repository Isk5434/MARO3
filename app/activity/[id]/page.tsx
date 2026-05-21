import { notFound } from 'next/navigation'
import { getActivityArticle, getActivityArticleIds } from '../../../src/lib/microcms'
import { ActivityArticleView } from '../../../src/components/ActivityArticleView'

interface Props {
  params: Promise<{ id: string }>
}

export const dynamicParams = false

export async function generateStaticParams() {
  const ids = await getActivityArticleIds()
  return ids.map((id) => ({ id }))
}

export default async function ActivityArticlePage({ params }: Props) {
  const { id } = await params
  const article = await getActivityArticle(id)

  if (!article) notFound()

  return <ActivityArticleView article={article} />
}
