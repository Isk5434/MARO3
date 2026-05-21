import App from '../../src/App'
import { getActivityArticles } from '../../src/lib/microcms'

export default async function ActivityPage() {
  const articles = await getActivityArticles()

  return <App initialPageId="activity" activityArticles={articles} />
}
