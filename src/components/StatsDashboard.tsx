'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from '../styles/Stats.module.css'

const PASSWORD_STORAGE_KEY = '_maroStatsPassword'

interface DayCount {
  day: string
  views: number
  visitors: number
  avgSeconds: number
}

interface PageCount {
  path: string
  views: number
  visitors: number
  avgSeconds: number
}

interface StatsResponse {
  today: string
  totals: { views: number; visitors: number; avgSeconds: number }
  todayCount: { views: number; visitors: number; avgSeconds: number }
  days: DayCount[]
  pages: PageCount[]
}

type LoadOutcome =
  | { kind: 'success'; stats: StatsResponse }
  | { kind: 'error'; message: string; clearStored: boolean }

const STATIC_PAGE_LABELS: Record<string, string> = {
  '/': 'トップページ',
  '/activity': '活動内容',
  '/contact': 'お問い合わせ',
  '/link': 'リンク',
}

function pageLabel(path: string) {
  if (STATIC_PAGE_LABELS[path]) return STATIC_PAGE_LABELS[path]
  if (path.startsWith('/activity/')) return `記事: ${path.slice('/activity/'.length)}`
  return path
}

function formatNumber(value: number) {
  return value.toLocaleString('ja-JP')
}

// 0秒は「まだ測れていない」を意味するので数字を出さない
function formatDuration(seconds: number) {
  if (seconds <= 0) return '—'
  if (seconds < 60) return `${seconds}秒`

  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes}分` : `${minutes}分${rest}秒`
}

function formatDayLabel(day: string) {
  const [, month, date] = day.split('-')
  return `${Number(month)}/${Number(date)}`
}

function readStoredPassword() {
  try {
    return window.sessionStorage.getItem(PASSWORD_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function storePassword(password: string) {
  try {
    window.sessionStorage.setItem(PASSWORD_STORAGE_KEY, password)
  } catch {
    // 保存できなくても、その場の表示には影響しない
  }
}

function clearStoredPassword() {
  try {
    window.sessionStorage.removeItem(PASSWORD_STORAGE_KEY)
  } catch {
    // 同上
  }
}

// stateを触らない純粋な取得処理。呼び出し側が結果を見て画面を更新する。
async function fetchStats(password: string): Promise<LoadOutcome> {
  try {
    const response = await fetch('/api/stats', {
      headers: { Authorization: `Bearer ${password}` },
    })

    if (response.status === 401) {
      return { kind: 'error', message: 'パスワードが違います。', clearStored: true }
    }
    if (response.status === 429) {
      return {
        kind: 'error',
        message: '試行回数が多すぎます。5分ほど待ってからやり直してください。',
        clearStored: false,
      }
    }
    if (!response.ok) {
      const detail = await response.json().catch(() => null)
      return {
        kind: 'error',
        message:
          detail?.error === 'database_not_configured'
            ? 'データベースが未設定です。CloudflareのD1バインドを確認してください。'
            : '統計を取得できませんでした。',
        clearStored: false,
      }
    }

    return { kind: 'success', stats: (await response.json()) as StatsResponse }
  } catch {
    return {
      kind: 'error',
      message: '通信に失敗しました。ネットワーク環境を確認してください。',
      clearStored: false,
    }
  }
}

export function StatsDashboard() {
  const [password, setPassword] = useState('')
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const applyOutcome = useCallback((outcome: LoadOutcome, usedPassword: string) => {
    if (outcome.kind === 'success') {
      storePassword(usedPassword)
      setStats(outcome.stats)
      setErrorMessage('')
      return
    }

    if (outcome.clearStored) clearStoredPassword()
    setErrorMessage(outcome.message)
  }, [])

  // 同一タブ内なら再読み込みのたびにパスワードを入力し直さなくて済むようにする
  useEffect(() => {
    const stored = readStoredPassword()
    if (!stored) return

    let cancelled = false
    void fetchStats(stored).then((outcome) => {
      if (!cancelled) applyOutcome(outcome, stored)
    })

    return () => {
      cancelled = true
    }
  }, [applyOutcome])

  const maxDailyViews = useMemo(() => {
    if (!stats?.days.length) return 0
    return Math.max(...stats.days.map((day) => day.views))
  }, [stats])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    setIsLoading(true)
    const outcome = await fetchStats(password)
    applyOutcome(outcome, password)
    setIsLoading(false)
  }

  const handleSignOut = () => {
    clearStoredPassword()
    setPassword('')
    setStats(null)
    setErrorMessage('')
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>MARO ANALYTICS</p>
        <h1>アクセス統計</h1>
        {stats && (
          <button type="button" className={styles.signOut} onClick={handleSignOut}>
            ロックする
          </button>
        )}
      </header>

      {!stats && (
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <label htmlFor="stats-password">パスワード</label>
          <input
            id="stats-password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
          <button type="submit" disabled={isLoading || !password}>
            {isLoading ? '確認中…' : '表示する'}
          </button>
        </form>
      )}

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {stats && (
        <>
          <section className={styles.summary}>
            <div className={styles.card}>
              <p className={styles.cardLabel}>累計表示回数</p>
              <strong>{formatNumber(stats.totals.views)}</strong>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>累計訪問者数</p>
              <strong>{formatNumber(stats.totals.visitors)}</strong>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>今日の表示回数</p>
              <strong>{formatNumber(stats.todayCount.views)}</strong>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>今日の訪問者数</p>
              <strong>{formatNumber(stats.todayCount.visitors)}</strong>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>平均滞在時間</p>
              <strong>{formatDuration(stats.totals.avgSeconds)}</strong>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>今日の平均滞在時間</p>
              <strong>{formatDuration(stats.todayCount.avgSeconds)}</strong>
            </div>
          </section>

          <section className={styles.section}>
            <h2>日別の表示回数（直近30日）</h2>
            {stats.days.length === 0 ? (
              <p className={styles.empty}>まだ記録がありません。</p>
            ) : (
              <div className={styles.chart} role="img" aria-label="日別の表示回数グラフ">
                {stats.days.map((day) => (
                  <div key={day.day} className={styles.chartColumn}>
                    <span className={styles.chartValue}>{day.views}</span>
                    <span
                      className={styles.chartBar}
                      style={{
                        height: maxDailyViews ? `${(day.views / maxDailyViews) * 100}%` : '0%',
                      }}
                    />
                    <span className={styles.chartLabel}>{formatDayLabel(day.day)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <h2>ページ別</h2>
            {stats.pages.length === 0 ? (
              <p className={styles.empty}>まだ記録がありません。</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">ページ</th>
                      <th scope="col">表示回数</th>
                      <th scope="col">訪問者数</th>
                      <th scope="col">平均滞在</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pages.map((page) => (
                      <tr key={page.path}>
                        <td>
                          <span className={styles.pageName}>{pageLabel(page.path)}</span>
                          <span className={styles.pagePath}>{page.path}</span>
                        </td>
                        <td className={styles.numberCell}>{formatNumber(page.views)}</td>
                        <td className={styles.numberCell}>{formatNumber(page.visitors)}</td>
                        <td className={styles.numberCell}>{formatDuration(page.avgSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
