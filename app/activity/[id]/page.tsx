import { notFound } from 'next/navigation'
import { getActivityArticle, getActivityArticleIds } from '../../../src/lib/microcms'
import { getAppPath } from '../../../src/config/internal-pages'
import styles from '../../../src/styles/ActivityArticle.module.css'

interface Props {
  params: {
    id: string
  }
}

export const dynamicParams = false

function formatDate(date?: string) {
  if (!date) return ''
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

export async function generateStaticParams() {
  const ids = await getActivityArticleIds()
  return ids.map((id) => ({ id }))
}

export default async function ActivityArticlePage({ params }: Props) {
  const { id } = params
  const article = await getActivityArticle(id)

  if (!article) notFound()

  return (
    <main className={styles.page}>
      <a href={getAppPath('activity')} className={styles.backLink}>
        活動内容へ戻る
      </a>

      <article className={styles.article}>
        <p className={styles.eyebrow}>ACTIVITY LOG</p>
        <h1>{article.title}</h1>
        {article.publishedAt && <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>}
        {article.description && <p className={styles.lead}>{article.description}</p>}

        {article.eyecatch?.url && (
          <img
            src={article.eyecatch.url}
            alt=""
            className={styles.eyecatch}
          />
        )}

        {article.body ? (
          <div className={styles.body} dangerouslySetInnerHTML={{ __html: article.body }} />
        ) : (
          <p className={styles.body}>本文はまだありません。</p>
        )}
      </article>
    </main>
  )
}
