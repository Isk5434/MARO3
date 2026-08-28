'use client'
import { useRef, useState } from 'react'
import styles from '../../styles/Stats.module.css'
import { formatNumber, niceScale, useChartWidth } from './chart-utils'

export interface ColumnItem {
  key: string
  label: string
  value: number
}

interface Props {
  items: ColumnItem[]
  ariaLabel: string
  valueLabel: string
  /** ラベルが多いときに何本おきに出すか */
  labelStep?: number
  formatValue?: (value: number) => string
}

const HEIGHT = 200
const PAD_TOP = 14
const PAD_RIGHT = 10
const PAD_BOTTOM = 26
const PAD_LEFT = 42
const MAX_BAR_WIDTH = 24
// 隣り合う棒は線で囲わず、地の色の隙間で分ける
const SURFACE_GAP = 2
const CORNER_RADIUS = 4

// 上端だけ丸め、ベースラインは角のままにする
function columnPath(x: number, y: number, barWidth: number, baseY: number) {
  const height = baseY - y
  if (height <= CORNER_RADIUS) return `M${x} ${baseY} H${x + barWidth} V${y} H${x} Z`

  const radius = Math.min(CORNER_RADIUS, barWidth / 2)
  return [
    `M${x} ${baseY}`,
    `V${y + radius}`,
    `Q${x} ${y} ${x + radius} ${y}`,
    `H${x + barWidth - radius}`,
    `Q${x + barWidth} ${y} ${x + barWidth} ${y + radius}`,
    `V${baseY}`,
    'Z',
  ].join(' ')
}

export function ColumnChart({
  items,
  ariaLabel,
  valueLabel,
  labelStep = 1,
  formatValue = formatNumber,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const width = useChartWidth(containerRef)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  if (items.length === 0) return <p className={styles.empty}>まだ記録がありません。</p>

  const plotWidth = Math.max(width - PAD_LEFT - PAD_RIGHT, 10)
  const baseY = HEIGHT - PAD_BOTTOM
  const plotHeight = baseY - PAD_TOP
  const scale = niceScale(Math.max(...items.map((item) => item.value), 1), 3)

  const slotWidth = plotWidth / items.length
  const barWidth = Math.min(Math.max(slotWidth - SURFACE_GAP, 2), MAX_BAR_WIDTH)
  const slotX = (index: number) => PAD_LEFT + slotWidth * index
  const barX = (index: number) => slotX(index) + (slotWidth - barWidth) / 2
  const yAt = (value: number) => baseY - (value / scale.max) * plotHeight

  const hovered = items.find((item) => item.key === hoveredKey) ?? null
  const hoveredIndex = hovered ? items.indexOf(hovered) : 0

  return (
    <div className={styles.chartFrame}>
      <div ref={containerRef} className={styles.chartSurface} style={{ height: HEIGHT }}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label={ariaLabel}>
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

            {items.map((item, index) => (
              <g
                key={item.key}
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                {/* 棒が細くても掴めるよう、スロット全体を当たり判定にする */}
                <rect
                  className={styles.hitArea}
                  x={slotX(index)}
                  y={PAD_TOP}
                  width={slotWidth}
                  height={plotHeight}
                />
                <path
                  className={hoveredKey === item.key ? styles.columnActive : styles.column}
                  d={columnPath(barX(index), yAt(item.value), barWidth, baseY)}
                />
                {index % labelStep === 0 && (
                  <text
                    className={styles.axisText}
                    x={barX(index) + barWidth / 2}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                  >
                    {item.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
        )}

        {hovered && (
          <div
            className={styles.tooltip}
            style={{
              left: `${Math.min(Math.max(barX(hoveredIndex) + barWidth / 2, 70), width - 70)}px`,
            }}
          >
            <p className={styles.tooltipTitle}>{hovered.label}</p>
            <p>
              {valueLabel} <strong>{formatValue(hovered.value)}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
