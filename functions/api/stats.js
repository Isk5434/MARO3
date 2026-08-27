// 管理者向けの集計エンドポイント。STATS_PASSWORD を知っている人だけが読める。
const DAY_RANGE = 30
const TOP_PAGES_LIMIT = 50
const MAX_FAILED_ATTEMPTS = 10
const FAILED_WINDOW_SECONDS = 300

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

function jstDay(date = new Date()) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function daysAgo(count) {
  return jstDay(new Date(Date.now() - count * 24 * 60 * 60 * 1000))
}

// 比較時間からパスワードを推測されないよう、長さが同じなら全文字を必ず走査する
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false

  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

function extractPassword(request) {
  const header = request.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

function toNumber(value) {
  return Number(value) || 0
}

// 滞在時間を測れなかった表示もあるので、表示回数ではなく測定できた件数で割る
function averageSeconds(totalSeconds, samples) {
  const count = toNumber(samples)
  return count > 0 ? Math.round(toNumber(totalSeconds) / count) : 0
}

export async function onRequestGet({ request, env }) {
  if (!env.STATS_PASSWORD) {
    console.error('STATS_PASSWORD is not configured')
    return jsonResponse({ error: 'server_not_configured' }, 500)
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const failedKey = `statsfail:${ip}`

  // 失敗回数の制限。KVへの書き込みは認証失敗時だけなので無料枠を圧迫しない。
  let failedCount = 0
  if (env.RATE_LIMIT_KV) {
    const stored = await env.RATE_LIMIT_KV.get(failedKey)
    failedCount = stored ? parseInt(stored, 10) : 0
    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      return jsonResponse({ error: 'too_many_attempts' }, 429)
    }
  }

  if (!safeEqual(extractPassword(request), env.STATS_PASSWORD)) {
    if (env.RATE_LIMIT_KV) {
      await env.RATE_LIMIT_KV.put(failedKey, String(failedCount + 1), {
        expirationTtl: FAILED_WINDOW_SECONDS,
      })
    }
    return jsonResponse({ error: 'unauthorized' }, 401)
  }

  if (!env.DB) {
    console.error('DB binding is missing')
    return jsonResponse({ error: 'database_not_configured' }, 500)
  }

  const today = jstDay()
  const rangeStart = daysAgo(DAY_RANGE - 1)

  try {
    const [totalsResult, daysResult, pagesResult] = await env.DB.batch([
      env.DB.prepare(
        `SELECT COALESCE(SUM(views), 0)            AS views,
                COALESCE(SUM(visitors), 0)         AS visitors,
                COALESCE(SUM(total_seconds), 0)    AS total_seconds,
                COALESCE(SUM(duration_samples), 0) AS duration_samples
           FROM page_views`,
      ),
      env.DB.prepare(
        `SELECT day,
                SUM(views)            AS views,
                SUM(visitors)         AS visitors,
                SUM(total_seconds)    AS total_seconds,
                SUM(duration_samples) AS duration_samples
           FROM page_views
          WHERE day >= ?1
          GROUP BY day
          ORDER BY day`,
      ).bind(rangeStart),
      env.DB.prepare(
        `SELECT path,
                SUM(views)            AS views,
                SUM(visitors)         AS visitors,
                SUM(total_seconds)    AS total_seconds,
                SUM(duration_samples) AS duration_samples
           FROM page_views
          GROUP BY path
          ORDER BY views DESC
          LIMIT ?1`,
      ).bind(TOP_PAGES_LIMIT),
    ])

    const days = (daysResult.results ?? []).map((row) => ({
      day: row.day,
      views: toNumber(row.views),
      visitors: toNumber(row.visitors),
      avgSeconds: averageSeconds(row.total_seconds, row.duration_samples),
    }))

    const totalsRow = totalsResult.results?.[0] ?? {}
    const todayRow = days.find((row) => row.day === today)

    return jsonResponse({
      today,
      totals: {
        views: toNumber(totalsRow.views),
        visitors: toNumber(totalsRow.visitors),
        avgSeconds: averageSeconds(totalsRow.total_seconds, totalsRow.duration_samples),
      },
      todayCount: {
        views: todayRow?.views ?? 0,
        visitors: todayRow?.visitors ?? 0,
        avgSeconds: todayRow?.avgSeconds ?? 0,
      },
      days,
      pages: (pagesResult.results ?? []).map((row) => ({
        path: row.path,
        views: toNumber(row.views),
        visitors: toNumber(row.visitors),
        avgSeconds: averageSeconds(row.total_seconds, row.duration_samples),
      })),
    })
  } catch (error) {
    console.error('Failed to load stats', error)
    return jsonResponse({ error: 'query_failed' }, 500)
  }
}
