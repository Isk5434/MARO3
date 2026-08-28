'use client'
import { useEffect } from 'react'

// サイト全体で「その日はじめて来た人」を判定するフラグ。パスに紐づけない。
const VISITOR_PREFIX = '_maroVisitor:'
// ページ別に「その日はじめてそのページを見た人」を判定するフラグ。
const PAGE_PREFIX = '_maroPage:'
// タブのセッションを1回だけ数えるためのフラグ。
const SESSION_KEY = '_maroSession'
// 旧仕様で残っている可能性のあるキー。見つけたら掃除する。
const LEGACY_PREFIXES = ['_maroViewed:']
// 統計ページ自体は集計対象から外す
const IGNORED_PREFIXES = ['/stats']
// これ未満は「開いた瞬間に閉じた」扱いにして送らない
const MIN_REPORTABLE_MS = 1000

// プライベートモードなどでストレージが例外を投げても計測だけで止まらないようにする
function safeStorage(kind: 'session' | 'local'): Storage | null {
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

function safeGet(storage: Storage | null, key: string) {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function safeSet(storage: Storage | null, key: string, value: string) {
  try {
    storage?.setItem(key, value)
  } catch {
    // 保存できなくても計測自体は成立しているので無視する
  }
}

/** キーが無ければ立てて true を返す。すでにあれば false。 */
function claimFlag(storage: Storage | null, key: string) {
  if (safeGet(storage, key)) return false
  safeSet(storage, key, '1')
  return true
}

// サーバ側と同じくJST基準で日付を出す
function jstDay() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function normalizePath(raw: string) {
  if (raw === '/') return '/'
  return raw.replace(/\/+$/, '') || '/'
}

// 前日以前のフラグと旧仕様のキーを消す。放置するとパス×日数ぶん溜まり続けるため。
function pruneStaleKeys(storage: Storage | null, today: string) {
  if (!storage) return

  try {
    const staleKeys: string[] = []
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i)
      if (!key) continue

      const isDatedFlag = key.startsWith(PAGE_PREFIX) || key.startsWith(VISITOR_PREFIX)
      if (isDatedFlag && !key.endsWith(`:${today}`)) staleKeys.push(key)
      if (LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix))) staleKeys.push(key)
    }
    staleKeys.forEach((key) => storage.removeItem(key))
  } catch {
    // 走査に失敗しても実害はない
  }
}

// 画面幅で判定する。UA文字列の解析はブラウザ差が大きく、当てにならないため。
function detectDevice() {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// 流入元は「どこ経由で来たか」だけが分かればよいので、ホスト名までに丸める。
// URL全体は個人の閲覧履歴に近づくため保存しない。
const KNOWN_SOURCES: [RegExp, string][] = [
  [/(^|\.)google\./, 'google'],
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, 'x'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)facebook\.com$/, 'facebook'],
  [/(^|\.)(yahoo\.co\.jp|yahoo\.com)$/, 'yahoo'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)line\.me$/, 'line'],
]

function detectSource() {
  const referrer = document.referrer
  if (!referrer) return 'direct'

  let host: string
  try {
    host = new URL(referrer).hostname.toLowerCase()
  } catch {
    return 'other'
  }

  if (host === window.location.hostname) return 'internal'

  for (const [pattern, name] of KNOWN_SOURCES) {
    if (pattern.test(host)) return name
  }

  return host.replace(/^www\./, '')
}

// 離脱直前でも届くよう sendBeacon を優先する。text/plain ならプリフライトが起きない。
function sendPayload(url: string, payload: unknown) {
  const json = JSON.stringify(payload)

  try {
    if (navigator.sendBeacon?.(url, new Blob([json], { type: 'text/plain;charset=UTF-8' }))) {
      return
    }
  } catch {
    // sendBeacon が使えない環境では fetch に落とす
  }

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: json,
    keepalive: true,
  }).catch(() => {
    // 計測の失敗でページの表示を妨げない
  })
}

export function ViewTracker() {
  useEffect(() => {
    const path = normalizePath(window.location.pathname)
    if (IGNORED_PREFIXES.some((prefix) => path.startsWith(prefix))) return

    const today = jstDay()
    const localStore = safeStorage('local')
    const sessionStore = safeStorage('session')
    pruneStaleKeys(localStore, today)

    // 表示回数はページを開くたびに数える。再読み込みも1回として扱う。
    // 訪問者数・セッション数はそれぞれ別のフラグで重複を防ぐ。
    sendPayload('/api/view', {
      path,
      pageFirstToday: claimFlag(localStore, `${PAGE_PREFIX}${path}:${today}`),
      newVisitor: claimFlag(localStore, `${VISITOR_PREFIX}${today}`),
      newSession: claimFlag(sessionStore, SESSION_KEY),
      device: detectDevice(),
      source: detectSource(),
    })

    // ここから滞在時間の計測。タブが裏に回っている間は加算しない。
    let visibleSince = document.visibilityState === 'visible' ? performance.now() : null
    let pendingMs = 0
    let hasReported = false

    const accumulate = (keepRunning: boolean) => {
      if (visibleSince !== null) {
        const now = performance.now()
        pendingMs += now - visibleSince
        visibleSince = keepRunning ? now : null
      }
    }

    const flush = () => {
      accumulate(false)
      if (pendingMs < MIN_REPORTABLE_MS) return

      const seconds = Math.round(pendingMs / 1000)
      sendPayload('/api/duration', { path, seconds, first: !hasReported })
      hasReported = true
      // 送った分だけ差し引き、端数は次回に持ち越す
      pendingMs -= seconds * 1000
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flush()
        return
      }
      visibleSince = performance.now()
    }

    // 「戻る」で復元されたときは計測を再開する
    const handlePageShow = () => {
      if (document.visibilityState === 'visible') visibleSince = performance.now()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', flush)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('pageshow', handlePageShow)
      flush()
    }
  }, [])

  return null
}
