// ページの滞在秒数を加算する。sendBeacon から呼ばれるため、離脱直前でも届くよう軽く作ってある。
const ORIGIN_PATTERN = /^https:\/\/([a-z0-9-]+\.)?maroinu\.pages\.dev$/
const LOCAL_ORIGIN_PATTERN = /^http:\/\/localhost(:\d+)?$/
const BOT_UA_PATTERN =
  /bot|crawler|spider|crawl|slurp|bingpreview|headlesschrome|lighthouse|pingdom|monitor|curl|wget|python-requests|axios|go-http-client|node-fetch/i
const MAX_PATH_LENGTH = 200
const PATH_PATTERN = /^\/[a-zA-Z0-9\-_/]*$/
// 1回の送信で加算できる上限。異常値で平均が壊れるのを防ぐ。
const MAX_SECONDS_PER_REPORT = 1800

function isAllowedOrigin(origin) {
  // sendBeacon は Origin を付けない場合があるため、空は許容し、食い違う場合だけ拒否する
  if (!origin) return true
  return ORIGIN_PATTERN.test(origin) || LOCAL_ORIGIN_PATTERN.test(origin)
}

function jstDay(date = new Date()) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function normalizePath(raw) {
  if (typeof raw !== 'string' || raw.length > MAX_PATH_LENGTH) return null

  const path = raw.split('?')[0].split('#')[0]
  if (!PATH_PATTERN.test(path)) return null
  if (path === '/') return '/'

  return path.replace(/\/+$/, '') || '/'
}

export function onRequestOptions({ request }) {
  const origin = request.headers.get('Origin') ?? ''
  if (!isAllowedOrigin(origin)) return new Response(null, { status: 403 })

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function onRequestPost({ request, env }) {
  if (!isAllowedOrigin(request.headers.get('Origin') ?? '')) {
    return new Response(null, { status: 403 })
  }

  const userAgent = request.headers.get('User-Agent') ?? ''
  if (!userAgent || BOT_UA_PATTERN.test(userAgent)) return new Response(null, { status: 204 })

  // sendBeacon は text/plain で送ってくるので、Content-Type に頼らず本文を読む
  let body
  try {
    body = JSON.parse(await request.text())
  } catch {
    return new Response(null, { status: 400 })
  }

  const path = normalizePath(body?.path)
  if (!path) return new Response(null, { status: 400 })

  const seconds = Math.min(Math.round(Number(body?.seconds) || 0), MAX_SECONDS_PER_REPORT)
  if (seconds <= 0) return new Response(null, { status: 204 })

  // 1回のページ表示につき1件だけ「測定できた」と数える。以降の追加送信は秒数だけ足す。
  const isFirstReport = body?.first === true ? 1 : 0

  if (!env.DB) {
    console.warn('DB binding is missing; skipping duration record')
    return new Response(null, { status: 204 })
  }

  try {
    await env.DB.prepare(
      `INSERT INTO page_views (path, day, views, visitors, total_seconds, duration_samples)
       VALUES (?1, ?2, 0, 0, ?3, ?4)
       ON CONFLICT(path, day) DO UPDATE SET
         total_seconds = total_seconds + ?3,
         duration_samples = duration_samples + ?4`,
    )
      .bind(path, jstDay(), seconds, isFirstReport)
      .run()
  } catch (error) {
    console.error('Failed to record dwell time', error)
    return new Response(null, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
