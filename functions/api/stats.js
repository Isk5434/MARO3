// 管理者向けの集計エンドポイント。STATS_PASSWORD を知っている人だけが読める。
//
// 指標の定義:
//   表示回数   … ページを開いた回数。再読み込みも1回として数える（page_views.views）
//   訪問者数   … その日はじめてサイトに来た人の数。サイト全体で1人1回（daily_visits）
//   セッション … タブのセッション数（daily_visits）
//   閲覧者数   … そのページを見た人数。ページ単位なので合計しても訪問者数にはならない
const ALLOWED_RANGES = [7, 30, 90]
const DEFAULT_RANGE = 30
const TOP_PAGES_LIMIT = 50
const TOP_SOURCES_LIMIT = 12
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

function viewSummary(row = {}) {
  return {
    views: toNumber(row.views),
    avgSeconds: averageSeconds(row.total_seconds, row.duration_samples),
  }
}

const VIEW_COLUMNS = `COALESCE(SUM(views), 0)            AS views,
          COALESCE(SUM(total_seconds), 0)    AS total_seconds,
          COALESCE(SUM(duration_samples), 0) AS duration_samples`

// daily_visits は後から追加したテーブルなので、未作成なら null を返して
// 訪問者数まわりの表示を隠す
async function loadDailyVisits(env, rangeStart, previousStart) {
  const summarize = (row = {}) => ({
    visitors: toNumber(row.visitors),
    sessions: toNumber(row.sessions),
  })

  try {
    const [totals, period, previous, days] = await env.DB.batch([
      env.DB.prepare(
        `SELECT COALESCE(SUM(visitors), 0) AS visitors, COALESCE(SUM(sessions), 0) AS sessions
           FROM daily_visits`,
      ),
      env.DB.prepare(
        `SELECT COALESCE(SUM(visitors), 0) AS visitors, COALESCE(SUM(sessions), 0) AS sessions
           FROM daily_visits WHERE day >= ?1`,
      ).bind(rangeStart),
      env.DB.prepare(
        `SELECT COALESCE(SUM(visitors), 0) AS visitors, COALESCE(SUM(sessions), 0) AS sessions
           FROM daily_visits WHERE day >= ?1 AND day < ?2`,
      ).bind(previousStart, rangeStart),
      env.DB.prepare(
        `SELECT day, visitors, sessions FROM daily_visits WHERE day >= ?1 ORDER BY day`,
      ).bind(rangeStart),
    ])

    return {
      totals: summarize(totals.results?.[0]),
      period: summarize(period.results?.[0]),
      previous: summarize(previous.results?.[0]),
      days: (days.results ?? []).map((row) => ({
        day: row.day,
        visitors: toNumber(row.visitors),
        sessions: toNumber(row.sessions),
      })),
    }
  } catch (error) {
    console.warn('daily_visits is unavailable (migration 003 may not be applied)', error)
    return null
  }
}

// visit_events も同様に、未作成なら null を返して該当パネルを隠す
async function loadVisitContext(env, rangeStart) {
  try {
    const [hourly, devices, sources, heatmap] = await env.DB.batch([
      env.DB.prepare(
        `SELECT hour, SUM(views) AS views FROM visit_events
          WHERE day >= ?1 GROUP BY hour ORDER BY hour`,
      ).bind(rangeStart),
      env.DB.prepare(
        `SELECT device, SUM(views) AS views FROM visit_events
          WHERE day >= ?1 GROUP BY device ORDER BY views DESC`,
      ).bind(rangeStart),
      env.DB.prepare(
        `SELECT source, SUM(views) AS views FROM visit_events
          WHERE day >= ?1 GROUP BY source ORDER BY views DESC LIMIT ?2`,
      ).bind(rangeStart, TOP_SOURCES_LIMIT),
      env.DB.prepare(
        `SELECT day, hour, SUM(views) AS views FROM visit_events
          WHERE day >= ?1 GROUP BY day, hour`,
      ).bind(rangeStart),
    ])

    return {
      hourly: (hourly.results ?? []).map((row) => ({
        hour: toNumber(row.hour),
        views: toNumber(row.views),
      })),
      devices: (devices.results ?? []).map((row) => ({
        device: row.device,
        views: toNumber(row.views),
      })),
      sources: (sources.results ?? []).map((row) => ({
        source: row.source,
        views: toNumber(row.views),
      })),
      heatmap: (heatmap.results ?? []).map((row) => ({
        day: row.day,
        hour: toNumber(row.hour),
        views: toNumber(row.views),
      })),
    }
  } catch (error) {
    console.warn('visit_events is unavailable (migration 002 may not be applied)', error)
    return null
  }
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

  const requestedRange = Number(new URL(request.url).searchParams.get('range'))
  const range = ALLOWED_RANGES.includes(requestedRange) ? requestedRange : DEFAULT_RANGE

  const today = jstDay()
  const rangeStart = daysAgo(range - 1)
  const previousStart = daysAgo(range * 2 - 1)

  try {
    const [totalsResult, periodResult, previousResult, daysResult, pagesResult] =
      await env.DB.batch([
        env.DB.prepare(`SELECT ${VIEW_COLUMNS} FROM page_views`),
        env.DB.prepare(`SELECT ${VIEW_COLUMNS} FROM page_views WHERE day >= ?1`).bind(rangeStart),
        env.DB.prepare(`SELECT ${VIEW_COLUMNS} FROM page_views WHERE day >= ?1 AND day < ?2`).bind(
          previousStart,
          rangeStart,
        ),
        env.DB.prepare(
          `SELECT day,
                  SUM(views)            AS views,
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
                  SUM(visitors)         AS viewers,
                  SUM(total_seconds)    AS total_seconds,
                  SUM(duration_samples) AS duration_samples
             FROM page_views
            WHERE day >= ?1
            GROUP BY path
            ORDER BY views DESC
            LIMIT ?2`,
        ).bind(rangeStart, TOP_PAGES_LIMIT),
      ])

    return jsonResponse({
      today,
      range,
      rangeStart,
      totals: viewSummary(totalsResult.results?.[0]),
      period: viewSummary(periodResult.results?.[0]),
      previous: viewSummary(previousResult.results?.[0]),
      days: (daysResult.results ?? []).map((row) => ({
        day: row.day,
        views: toNumber(row.views),
        avgSeconds: averageSeconds(row.total_seconds, row.duration_samples),
      })),
      pages: (pagesResult.results ?? []).map((row) => ({
        path: row.path,
        views: toNumber(row.views),
        viewers: toNumber(row.viewers),
        avgSeconds: averageSeconds(row.total_seconds, row.duration_samples),
      })),
      visits: await loadDailyVisits(env, rangeStart, previousStart),
      context: await loadVisitContext(env, rangeStart),
    })
  } catch (error) {
    console.error('Failed to load stats', error)
    return jsonResponse({ error: 'query_failed' }, 500)
  }
}
