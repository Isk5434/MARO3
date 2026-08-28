'use client'
import { Fragment, useState } from 'react'
import styles from '../../styles/Stats.module.css'
import { formatNumber, WEEKDAY_LABELS, weekdayOf } from './chart-utils'

export interface HeatmapCell {
  day: string
  hour: number
  views: number
}

// 連続量なので単一色相の明->暗。虹色や色相の混在は使わない。
const STEP_COUNT = 5

export function Heatmap({ cells }: { cells: HeatmapCell[] }) {
  const [hovered, setHovered] = useState<{ weekday: number; hour: number; views: number } | null>(
    null,
  )

  const grid: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
  for (const cell of cells) {
    if (cell.hour < 0 || cell.hour > 23) continue
    grid[weekdayOf(cell.day)][cell.hour] += cell.views
  }

  const max = Math.max(...grid.flat(), 0)
  if (max === 0) return <p className={styles.empty}>まだ記録がありません。</p>

  // 0 は「無かった」なので色を持たせず、1以上を5段階に割り当てる
  const stepOf = (value: number) => (value === 0 ? 0 : Math.ceil((value / max) * STEP_COUNT))

  return (
    <div className={styles.heatmapWrap}>
      <div className={styles.heatmap}>
        <span />
        {Array.from({ length: 24 }, (_, hour) => (
          <span key={hour} className={styles.heatmapHourLabel}>
            {hour % 6 === 0 ? hour : ''}
          </span>
        ))}

        {grid.map((row, weekday) => (
          <Fragment key={weekday}>
            <span className={styles.heatmapDayLabel}>{WEEKDAY_LABELS[weekday]}</span>
            {row.map((views, hour) => (
              <span
                key={hour}
                className={styles.heatmapCell}
                data-step={stepOf(views)}
                onMouseEnter={() => setHovered({ weekday, hour, views })}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </Fragment>
        ))}
      </div>

      <div className={styles.heatmapFooter}>
        <div className={styles.heatmapScale}>
          <span className={styles.axisTextInline}>少ない</span>
          {Array.from({ length: STEP_COUNT }, (_, index) => (
            <span key={index} className={styles.heatmapCell} data-step={index + 1} />
          ))}
          <span className={styles.axisTextInline}>多い（最大 {formatNumber(max)}）</span>
        </div>

        {hovered && (
          <p className={styles.heatmapReadout}>
            {WEEKDAY_LABELS[hovered.weekday]}曜 {hovered.hour}時台
            <strong>{formatNumber(hovered.views)}</strong>回
          </p>
        )}
      </div>
    </div>
  )
}
