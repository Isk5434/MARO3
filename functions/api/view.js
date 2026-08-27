// ページ表示を1件記録する。個人を特定する情報（IP・UA・Cookie）は保存しない。
const ORIGIN_PATTERN = /^https:\/\/([a-z0-9-]+\.)?maroinu\.pages\.dev$/
const LOCAL_ORIGIN_PATTERN = /^http:\/\/localhost(:\d+)?$/
const BOT_UA_PATTERN =
  /bot|crawler|spider|crawl|slurp|bingpreview|headlesschrome|lighthouse|pingdom|monitor|curl|wget|python-requests|axios|go-http-client|node-fetch/i
const MAX_PATH_LENGTH = 200
const PATH_PATTERN = /^\/[a-zA-Z0-9\-_/]*$/

function isAllowedOrigin(origin) {
  // sendBeacon は Origin を付けない場合があるため、空は許容し、食い違う場合だけ拒否する
  if (!origin) return true
  return ORIGIN_PATTERN.test(origin) || LOCAL_ORIGIN_PATTERN.test(origin)
}

// 日付の区切りを日本時間に合わせる（UTCのままだと朝9時で日付が変わってしまう）
function jstDay(date = new Date()) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// 末尾スラッシュを落として表記ゆれを吸収する。想定外の文字が入っていたら弾く。
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
  const origin = request.headers.get('Origin') ?? ''
  if (!isAllowedOrigin(origin)) return new Response(null, { status: 403 })

  const userAgent = request.headers.get('User-Agent') ?? ''
  // ボットは記録しない。成功扱いで返して相手にリトライさせない。
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

  // D1バインドが未設定でもサイトを壊さない
  if (!env.DB) {
    console.warn('DB binding is missing; skipping view record')
    return new Response(null, { status: 204 })
  }

  const isUniqueVisit = body?.unique === true ? 1 : 0

  try {
    await env.DB.prepare(
      `INSERT INTO page_views (path, day, views, visitors)
       VALUES (?1, ?2, 1, ?3)
       ON CONFLICT(path, day) DO UPDATE SET
         views = views + 1,
         visitors = visitors + ?3`,
    )
      .bind(path, jstDay(), isUniqueVisit)
      .run()
  } catch (error) {
    console.error('Failed to record page view', error)
    return new Response(null, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
