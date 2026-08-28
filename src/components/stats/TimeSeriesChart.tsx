'use client'
import { useRef, useState } from 'react'
import styles from '../../styles/Stats.module.css'
import {
  formatDayLabel,
  formatNumber,
  niceScale,
  useChartWidth,
  WEEKDAY_LABELS,
  weekdayOf,
} from './chart-utils'

export interface SeriesPoint {
  day: string
  views: number
  visitors: number
}

const HEIGHT = 268
const PAD_TOP = 18
const PAD_RIGHT = 18
const PAD_BOTTOM = 30
const PAD_LEFT = 46
// 端点ラベルがこれより近づくと重なって読めないので、両方とも出さずに凡例とツールチップに任せる
const LABEL_COLLISION_GAP = 18

export function TimeSeriesChart({ days }: { days: SeriesPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const width = useChartWidth(containerRef)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (days.length === 0) return <p className={styles.empty}>まだ記録がありません。</p>

  const plotWidth = Math.max(width - PAD_LEFT - PAD_RIGHT, 10)
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  const scale = niceScale(Math.max(...days.map((day) => Math.max(day.views, day.visitors)), 1))

  const xAt = (index: number) =>
    PAD_LEFT + (days.length === 1 ? plotWidth / 2 : (plotWidth * index) / (days.length - 1))
  const yAt = (value: number) => PAD_TOP + plotHeight - (value / scale.max) * plotHeight

  const linePath = (pick: (point: SeriesPoint) => number) =>
    days
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${xAt(index)} ${yAt(pick(point))}`)
      .join(' ')

  const areaPath = `${linePath((point) => point.views)} L${xAt(days.length - 1)} ${
    PAD_TOP + plotHeight
  } L${xAt(0)} ${PAD_TOP + plotHeight} Z`

  // 日数が増えても目盛りが潰れないよう、ラベルは6本程度に間引く
  const labelStep = Math.max(1, Math.ceil(days.length / 6))
  const lastIndex = days.length - 1
  const lastPoint = days[lastIndex]
  const canLabelEnds =
    Math.abs(yAt(lastPoint.views) - yAt(lastPoint.visitors)) >= LABEL_COLLISION_GAP

  const handleMove = (clientX: number) => {
    const bounds = containerRef.current?.getBoundingClientRect()
    if (!bounds) return

    const offset = clientX - bounds.left - PAD_LEFT
    const step = days.length === 1 ? plotWidth : plotWidth / (days.length - 1)
    const index = Math.round(offset / step)
    setHoverIndex(Math.min(Math.max(index, 0), lastIndex))
  }

  const hovered = hoverIndex === null ? null : days[hoverIndex]

  return (
    <div className={styles.chartFrame}>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.swatchOne}`} aria-hidden="true" />
          表示回数
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.swatchTwo}`} aria-hidden="true" />
          訪問者数
        </span>
      </div>

      <div
        ref={containerRef}
        className={styles.chartSurface}
        style={{ height: HEIGHT }}
        onMouseMove={(event) => handleMove(event.clientX)}
        onMouseLeave={() => setHoverIndex(null)}
        onTouchStart={(event) => handleMove(event.touches[0].clientX)}
        onTouchMove={(event) => handleMove(event.touches[0].clientX)}
      >
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label="日別の表示回数と訪問者数の推移">
            {scale.ticks.map((tick) => (
              <g key={tick}>
                <line
                  className={styles.gridline}
                  x1={PAD_LEFT}
                  x2={width - PAD_RIGHT}
                  y1={yAt(tick)}
                  y2={yAt(tick)}
                />
                <text
                  className={styles.axisText}
                  x={PAD_LEFT - 8}
                  y={yAt(tick) + 4}
                  textAnchor="end"
                >
                  {formatNumber(tick)}
                </text>
              </g>
            ))}

            {days.map((point, index) =>
              index % labelStep === 0 || index === lastIndex ? (
                <text
                  key={point.day}
                  className={styles.axisText}
                  x={xAt(index)}
                  y={HEIGHT - 10}
                  textAnchor="middle"
                >
                  {formatDayLabel(point.day)}
                </text>
              ) : null,
            )}

            <path className={styles.areaOne} d={areaPath} />
            <path className={styles.lineOne} d={linePath((point) => point.views)} />
            <path className={styles.lineTwo} d={linePath((point) => point.visitors)} />

            {hoverIndex !== null && hovered && (
              <>
                <line
                  className={styles.crosshair}
                  x1={xAt(hoverIndex)}
                  x2={xAt(hoverIndex)}
                  y1={PAD_TOP}
                  y2={PAD_TOP + plotHeight}
                />
                <circle
                  className={styles.markerOne}
                  cx={xAt(hoverIndex)}
                  cy={yAt(hovered.views)}
                  r={5}
                />
                <circle
                  className={styles.markerTwo}
                  cx={xAt(hoverIndex)}
                  cy={yAt(hovered.visitors)}
                  r={5}
                />
              </>
            )}

            {canLabelEnds && (
              <>
                <text
                  className={styles.endLabel}
                  x={xAt(lastIndex)}
                  y={yAt(lastPoint.views) - 10}
                  textAnchor="end"
                >
                  {formatNumber(lastPoint.views)}
                </text>
                <text
                  className={styles.endLabel}
                  x={xAt(lastIndex)}
                  y={yAt(lastPoint.visitors) - 10}
                  textAnchor="end"
                >
                  {formatNumber(lastPoint.visitors)}
                </text>
              </>
            )}
          </svg>
        )}

        {hovered && (
          <div
            className={styles.tooltip}
            style={{
              left: `${Math.min(Math.max(xAt(hoverIndex ?? 0), 70), width - 70)}px`,
            }}
          >
            <p className={styles.tooltipTitle}>
              {formatDayLabel(hovered.day)}（{WEEKDAY_LABELS[weekdayOf(hovered.day)]}）
            </p>
            <p>
              <span className={`${styles.legendSwatch} ${styles.swatchOne}`} aria-hidden="true" />
              表示回数 <strong>{formatNumber(hovered.views)}</strong>
            </p>
            <p>
              <span className={`${styles.legendSwatch} ${styles.swatchTwo}`} aria-hidden="true" />
              訪問者数 <strong>{formatNumber(hovered.visitors)}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
