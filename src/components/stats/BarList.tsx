'use client'
import { useState } from 'react'
import styles from '../../styles/Stats.module.css'
import { formatNumber } from './chart-utils'

export interface BarItem {
  key: string
  label: string
  sublabel?: string
  value: number
  /** ツールチップに出す補足行 */
  details?: { label: string; value: string }[]
}

interface Props {
  items: BarItem[]
  valueLabel: string
  formatValue?: (value: number) => string
}

// 1つの尺度を並べるだけなので、色は系列1の一色に固定する。
// 大きい棒ほど濃く、のような値による色分けは棒の長さと二重になるので使わない。
export function BarList({ items, valueLabel, formatValue = formatNumber }: Props) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  if (items.length === 0) return <p className={styles.empty}>まだ記録がありません。</p>

  const max = Math.max(...items.map((item) => item.value), 1)
  const total = items.reduce((sum, item) => sum + item.value, 0)

  return (
    <ul className={styles.barList}>
      {items.map((item) => {
        const share = total > 0 ? (item.value / total) * 100 : 0

        return (
          <li
            key={item.key}
            className={styles.barRow}
            onMouseEnter={() => setHoveredKey(item.key)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            <div className={styles.barHeader}>
              <span className={styles.barLabel}>
                {item.label}
                {item.sublabel && <span className={styles.barSublabel}>{item.sublabel}</span>}
              </span>
              <span className={styles.barValue}>{formatValue(item.value)}</span>
            </div>

            <div className={styles.barTrack}>
              <span
                className={styles.barFill}
                style={{ width: `${Math.max((item.value / max) * 100, 1)}%` }}
              />
            </div>

            {hoveredKey === item.key && (
              <div className={styles.barTooltip}>
                <p className={styles.tooltipTitle}>{item.label}</p>
                <p>
                  {valueLabel} <strong>{formatValue(item.value)}</strong>
                </p>
                <p>
                  全体に占める割合 <strong>{share.toFixed(1)}%</strong>
                </p>
                {item.details?.map((detail) => (
                  <p key={detail.label}>
                    {detail.label} <strong>{detail.value}</strong>
                  </p>
                ))}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
