'use client'
import styles from '../../styles/Stats.module.css'

const WIDTH = 120
const HEIGHT = 32
const PAD = 3

// 統計タイルの補助。値は本文の数字が担うので、ここでは形だけを見せる。
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null

  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1

  const xAt = (index: number) => PAD + ((WIDTH - PAD * 2) * index) / (values.length - 1)
  const yAt = (value: number) => HEIGHT - PAD - ((value - min) / span) * (HEIGHT - PAD * 2)

  const path = values.map((value, index) => `${index === 0 ? 'M' : 'L'}${xAt(index)} ${yAt(value)}`)

  return (
    <svg
      className={styles.sparkline}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path className={styles.sparklinePath} d={path.join(' ')} vectorEffect="non-scaling-stroke" />
      <circle
        className={styles.sparklineTip}
        cx={xAt(values.length - 1)}
        cy={yAt(values[values.length - 1])}
        r={2.5}
      />
    </svg>
  )
}
