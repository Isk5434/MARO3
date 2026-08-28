'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from '../styles/Stats.module.css'
import { BarList, type BarItem } from './stats/BarList'
import { ColumnChart } from './stats/ColumnChart'
import { Heatmap } from './stats/Heatmap'
import { Sparkline } from './stats/Sparkline'
import { TimeSeriesChart } from './stats/TimeSeriesChart'
import {
  formatCompact,
  formatDayLabel,
  formatDuration,
  formatNumber,
  percentChange,
  shiftDay,
  WEEKDAY_LABELS,
  weekdayOf,
} from './stats/chart-utils'

const PASSWORD_STORAGE_KEY = '_maroStatsPassword'
const RANGE_OPTIONS = [7, 30, 90] as const

type Range = (typeof RANGE_OPTIONS)[number]

interface ViewSummary {
  views: number
  avgSeconds: number
}

interface VisitSummary {
  visitors: number
  sessions: number
}

interface StatsResponse {
  today: string
  range: number
  rangeStart: string
  totals: ViewSummary
  period: ViewSummary
  previous: ViewSummary
  days: { day: string; views: number; avgSeconds: number }[]
  pages: { path: string; views: number; viewers: number; avgSeconds: number }[]
  visits: {
    totals: VisitSummary
    period: VisitSummary
    previous: VisitSummary
    days: { day: string; visitors: number; sessions: number }[]
  } | null
  context: {
    hourly: { hour: number; views: number }[]
    devices: { device: string; views: number }[]
    sources: { source: string; views: number }[]
    heatmap: { day: string; hour: number; views: number }[]
  } | null
}

interface DayRow {
  day: string
  views: number
  visitors: number
  avgSeconds: number
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

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'パソコン',
  mobile: 'スマートフォン',
  tablet: 'タブレット',
  unknown: '不明',
}

const SOURCE_LABELS: Record<string, string> = {
  direct: '直接アクセス・ブックマーク',
  internal: 'サイト内の移動',
  other: 'その他',
  google: 'Google 検索',
  yahoo: 'Yahoo! 検索',
  bing: 'Bing 検索',
  x: 'X（旧Twitter）',
  instagram: 'Instagram',
  facebook: 'Facebook',
  line: 'LINE',
}

function pageLabel(path: string) {
  if (STATIC_PAGE_LABELS[path]) return STATIC_PAGE_LABELS[path]
  if (path.startsWith('/activity/')) return `記事: ${path.slice('/activity/'.length)}`
  return path
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
async function fetchStats(password: string, range: Range): Promise<LoadOutcome> {
  try {
    const response = await fetch(`/api/stats?range=${range}`, {
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

// 記録が無かった日も0として並べる。抜けたまま線を引くと推移を読み違えるため。
function buildDayRows(stats: StatsResponse): DayRow[] {
  const viewsByDay = new Map(stats.days.map((day) => [day.day, day]))
  const visitorsByDay = new Map((stats.visits?.days ?? []).map((day) => [day.day, day.visitors]))
  const rows: DayRow[] = []

  for (let cursor = stats.rangeStart; cursor <= stats.today; cursor = shiftDay(cursor, 1)) {
    const view = viewsByDay.get(cursor)
    rows.push({
      day: cursor,
      views: view?.views ?? 0,
      visitors: visitorsByDay.get(cursor) ?? 0,
      avgSeconds: view?.avgSeconds ?? 0,
    })
  }

  return rows
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const change = percentChange(current, previous)
  if (change === null) return <span className={styles.deltaNeutral}>前期間は記録なし</span>
  if (Math.round(change) === 0) return <span className={styles.deltaNeutral}>前期間と同じ</span>

  const isUp = change > 0
  return (
    <span className={isUp ? styles.deltaUp : styles.deltaDown}>
      <span aria-hidden="true">{isUp ? '▲' : '▼'}</span>
      {Math.abs(change).toFixed(Math.abs(change) < 10 ? 1 : 0)}%
      <span className={styles.deltaNote}>前期間比</span>
    </span>
  )
}

interface TileProps {
  label: string
  value: string
  current: number
  previous: number
  trend: number[]
}

function StatTile({ label, value, current, previous, trend }: TileProps) {
  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>{label}</p>
      <strong className={styles.cardValue}>{value}</strong>
      <DeltaBadge current={current} previous={previous} />
      <Sparkline values={trend} />
    </div>
  )
}

export function StatsDashboard() {
  const [password, setPassword] = useState('')
  const [range, setRange] = useState<Range>(30)
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showTable, setShowTable] = useState(false)

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
    void fetchStats(stored, range).then((outcome) => {
      if (!cancelled) applyOutcome(outcome, stored)
    })

    return () => {
      cancelled = true
    }
  }, [applyOutcome, range])

  const days = useMemo(() => (stats ? buildDayRows(stats) : []), [stats])

  const weekdayColumns = useMemo(() => {
    if (days.length === 0) return []

    const totals = Array.from({ length: 7 }, () => ({ views: 0, count: 0 }))
    for (const day of days) {
      const bucket = totals[weekdayOf(day.day)]
      bucket.views += day.views
      bucket.count += 1
    }

    return totals.map((bucket, weekday) => ({
      key: String(weekday),
      label: WEEKDAY_LABELS[weekday],
      value: bucket.count > 0 ? Math.round(bucket.views / bucket.count) : 0,
    }))
  }, [days])

  const pageItems: BarItem[] = useMemo(
    () =>
      (stats?.pages ?? []).slice(0, 10).map((page) => ({
        key: page.path,
        label: pageLabel(page.path),
        sublabel: page.path,
        value: page.views,
        details: [
          { label: '閲覧者数', value: formatNumber(page.viewers) },
          { label: '平均滞在時間', value: formatDuration(page.avgSeconds) },
        ],
      })),
    [stats],
  )

  const dwellItems: BarItem[] = useMemo(
    () =>
      (stats?.pages ?? [])
        .filter((page) => page.avgSeconds > 0)
        .slice()
        .sort((a, b) => b.avgSeconds - a.avgSeconds)
        .slice(0, 8)
        .map((page) => ({
          key: page.path,
          label: pageLabel(page.path),
          sublabel: page.path,
          value: page.avgSeconds,
          details: [{ label: '表示回数', value: formatNumber(page.views) }],
        })),
    [stats],
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    setIsLoading(true)
    const outcome = await fetchStats(password, range)
    applyOutcome(outcome, password)
    setIsLoading(false)
  }

  const handleSignOut = () => {
    clearStoredPassword()
    setPassword('')
    setStats(null)
    setErrorMessage('')
  }

  const visits = stats?.visits ?? null
  const perVisitor = (views: number, visitors: number) => (visitors > 0 ? views / visitors : 0)

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>MARO ANALYTICS</p>
          <h1>アクセス統計</h1>
        </div>
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
          <section className={styles.hero}>
            <p className={styles.cardLabel}>公開してからの累計表示回数</p>
            <p className={styles.heroValue}>{formatNumber(stats.totals.views)}</p>
            <p className={styles.heroNote}>
              {visits &&
                `累計訪問者数 ${formatNumber(visits.totals.visitors)} ・ 累計セッション数 ${formatNumber(visits.totals.sessions)} ・ `}
              平均滞在時間 {formatDuration(stats.totals.avgSeconds)}
            </p>
          </section>

          {!visits && (
            <section className={styles.panel}>
              <h2>訪問者数がまだ集計できません</h2>
              <p className={styles.panelNote}>
                サイト全体の訪問者数とセッション数を出すには、D1 の Console で
                <code>db/migrations/003-add-daily-visits.sql</code>
                を実行してください。実行後に記録された分から集計されます。
              </p>
            </section>
          )}

          <div className={styles.controls}>
            <div className={styles.rangeGroup} role="group" aria-label="表示する期間">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={option === range ? styles.rangeActive : styles.rangeButton}
                  aria-pressed={option === range}
                  onClick={() => setRange(option)}
                >
                  {option}日
                </button>
              ))}
            </div>
            <p className={styles.rangeNote}>
              {formatDayLabel(stats.rangeStart)} 〜 {formatDayLabel(stats.today)} の集計
            </p>
            <button
              type="button"
              className={styles.tableToggle}
              aria-pressed={showTable}
              onClick={() => setShowTable((shown) => !shown)}
            >
              {showTable ? 'グラフだけ表示' : '数値の表も見る'}
            </button>
          </div>

          <section className={styles.summary}>
            <StatTile
              label="表示回数"
              value={formatCompact(stats.period.views)}
              current={stats.period.views}
              previous={stats.previous.views}
              trend={days.map((day) => day.views)}
            />
            {visits && (
              <StatTile
                label="訪問者数"
                value={formatCompact(visits.period.visitors)}
                current={visits.period.visitors}
                previous={visits.previous.visitors}
                trend={days.map((day) => day.visitors)}
              />
            )}
            <StatTile
              label="平均滞在時間"
              value={formatDuration(stats.period.avgSeconds)}
              current={stats.period.avgSeconds}
              previous={stats.previous.avgSeconds}
              trend={days.map((day) => day.avgSeconds)}
            />
            {visits && (
              <StatTile
                label="1人あたりの表示回数"
                value={
                  visits.period.visitors > 0
                    ? perVisitor(stats.period.views, visits.period.visitors).toFixed(1)
                    : '—'
                }
                current={perVisitor(stats.period.views, visits.period.visitors)}
                previous={perVisitor(stats.previous.views, visits.previous.visitors)}
                trend={days.map((day) => perVisitor(day.views, day.visitors))}
              />
            )}
          </section>

          <section className={styles.panel}>
            <h2>推移</h2>
            <p className={styles.panelNote}>
              日ごとの表示回数{visits && 'と訪問者数'}。
              線の上にカーソルを合わせるとその日の数字が出ます。
            </p>
            <TimeSeriesChart days={days} showVisitors={Boolean(visits)} />
          </section>

          <div className={styles.panelGrid}>
            <section className={styles.panel}>
              <h2>よく見られたページ</h2>
              <p className={styles.panelNote}>期間内の表示回数が多い順に上位10件。</p>
              <BarList items={pageItems} valueLabel="表示回数" />
            </section>

            <section className={styles.panel}>
              <h2>じっくり読まれたページ</h2>
              <p className={styles.panelNote}>
                1回あたりの平均滞在時間が長い順。表示回数の多さとは別の指標です。
              </p>
              <BarList items={dwellItems} valueLabel="平均滞在時間" formatValue={formatDuration} />
            </section>
          </div>

          <section className={styles.panel}>
            <h2>曜日ごとの平均表示回数</h2>
            <p className={styles.panelNote}>期間内の各曜日を平均した値です。</p>
            <ColumnChart
              items={weekdayColumns}
              ariaLabel="曜日ごとの平均表示回数"
              valueLabel="平均表示回数"
            />
          </section>

          {stats.context ? (
            <>
              <div className={styles.panelGrid}>
                <section className={styles.panel}>
                  <h2>流入元</h2>
                  <p className={styles.panelNote}>
                    どこを経由して来たか。ホスト名までしか記録していません。
                  </p>
                  <BarList
                    items={stats.context.sources.map((source) => ({
                      key: source.source,
                      label: SOURCE_LABELS[source.source] ?? source.source,
                      value: source.views,
                    }))}
                    valueLabel="表示回数"
                  />
                </section>

                <section className={styles.panel}>
                  <h2>デバイス</h2>
                  <p className={styles.panelNote}>画面幅から判定しています。</p>
                  <BarList
                    items={stats.context.devices.map((device) => ({
                      key: device.device,
                      label: DEVICE_LABELS[device.device] ?? device.device,
                      value: device.views,
                    }))}
                    valueLabel="表示回数"
                  />
                </section>
              </div>

              <section className={styles.panel}>
                <h2>時間帯</h2>
                <p className={styles.panelNote}>日本時間での時間帯別の表示回数です。</p>
                <ColumnChart
                  items={Array.from({ length: 24 }, (_, hour) => ({
                    key: String(hour),
                    label: String(hour),
                    value: stats.context?.hourly.find((item) => item.hour === hour)?.views ?? 0,
                  }))}
                  ariaLabel="時間帯ごとの表示回数"
                  valueLabel="表示回数"
                  labelStep={3}
                />
              </section>

              <section className={styles.panel}>
                <h2>曜日 × 時間帯</h2>
                <p className={styles.panelNote}>
                  濃いところがよく見られている時間です。告知を出す時間帯の目安に使えます。
                </p>
                <Heatmap cells={stats.context.heatmap} />
              </section>
            </>
          ) : (
            <section className={styles.panel}>
              <h2>流入元・デバイス・時間帯</h2>
              <p className={styles.panelNote}>
                この3つを表示するには、D1 の Console で
                <code>db/migrations/002-add-visit-events.sql</code>
                を実行してください。実行後に記録された分から集計されます。
              </p>
            </section>
          )}

          {showTable && (
            <section className={styles.panel}>
              <h2>数値の表</h2>
              <p className={styles.panelNote}>
                グラフと同じ内容です。色が見分けにくい場合はこちらを。
              </p>

              <h3 className={styles.tableHeading}>ページ別</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">ページ</th>
                      <th scope="col">表示回数</th>
                      <th scope="col">閲覧者数</th>
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
                        <td className={styles.numberCell}>{formatNumber(page.viewers)}</td>
                        <td className={styles.numberCell}>{formatDuration(page.avgSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={styles.panelNote}>
                閲覧者数は「その日はじめてそのページを見た人」の合計です。
                1人が複数ページを見ると各ページで1ずつ数えるため、
                合計してもサイト全体の訪問者数にはなりません。
              </p>

              <h3 className={styles.tableHeading}>日別</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">日付</th>
                      <th scope="col">表示回数</th>
                      {visits && <th scope="col">訪問者数</th>}
                      <th scope="col">平均滞在</th>
                    </tr>
                  </thead>
                  <tbody>
                    {days
                      .slice()
                      .reverse()
                      .map((day) => (
                        <tr key={day.day}>
                          <td>
                            {formatDayLabel(day.day)}（{WEEKDAY_LABELS[weekdayOf(day.day)]}）
                          </td>
                          <td className={styles.numberCell}>{formatNumber(day.views)}</td>
                          {visits && (
                            <td className={styles.numberCell}>{formatNumber(day.visitors)}</td>
                          )}
                          <td className={styles.numberCell}>{formatDuration(day.avgSeconds)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}
