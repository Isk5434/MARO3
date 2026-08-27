'use client'
import { useEffect } from 'react'

const SESSION_PREFIX = '_maroViewed:'
const VISITOR_PREFIX = '_maroVisitor:'
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

// サーバ側と同じくJST基準で日付を出す
function jstDay() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function normalizePath(raw: string) {
  if (raw === '/') return '/'
  return raw.replace(/\/+$/, '') || '/'
}

// 前日以前の訪問フラグを消す。放置するとパス×日数ぶん溜まり続けるため。
function pruneVisitorKeys(storage: Storage | null, today: string) {
  if (!storage) return

  try {
    const staleKeys: string[] = []
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i)
      if (key?.startsWith(VISITOR_PREFIX) && !key.endsWith(`:${today}`)) {
        staleKeys.push(key)
      }
    }
    staleKeys.forEach((key) => storage.removeItem(key))
  } catch {
    // 走査に失敗しても実害はない
  }
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

    const sessionStore = safeStorage('session')
    const sessionKey = `${SESSION_PREFIX}${path}`
    // 同じタブでの再読み込みは二重に数えない
    if (safeGet(sessionStore, sessionKey)) return
    safeSet(sessionStore, sessionKey, '1')

    const today = jstDay()
    const localStore = safeStorage('local')
    pruneVisitorKeys(localStore, today)

    const visitorKey = `${VISITOR_PREFIX}${path}:${today}`
    const isUniqueVisit = !safeGet(localStore, visitorKey)
    if (isUniqueVisit) safeSet(localStore, visitorKey, '1')

    sendPayload('/api/view', { path, unique: isUniqueVisit })

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
