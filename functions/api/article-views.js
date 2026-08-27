// 記事ごとの累計表示回数を返す公開エンドポイント。記事カードと記事ページが使う。
const CACHE_SECONDS = 60

export async function onRequestGet({ env }) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
  }

  // D1バインドが未設定でも記事一覧は表示できるよう、空の集計を返す
  if (!env.DB) {
    console.warn('DB binding is missing; returning empty article views')
    return new Response(JSON.stringify({ views: {} }), { headers })
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT path, SUM(views) AS views
         FROM page_views
        WHERE path LIKE '/activity/%'
        GROUP BY path`,
    ).all()

    const views = {}
    for (const row of results ?? []) {
      views[row.path] = Number(row.views) || 0
    }

    return new Response(JSON.stringify({ views }), { headers })
  } catch (error) {
    console.error('Failed to load article views', error)
    return new Response(JSON.stringify({ views: {} }), { headers })
  }
}
