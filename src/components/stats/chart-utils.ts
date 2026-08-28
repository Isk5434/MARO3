'use client'
import { useEffect, useState, type RefObject } from 'react'

export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export function formatNumber(value: number) {
  return value.toLocaleString('ja-JP')
}

// 桁数が伸びてもタイルの幅を壊さないよう、1万以上は「万」に丸める
export function formatCompact(value: number) {
  if (value < 10000) return value.toLocaleString('ja-JP')
  if (value < 100000000) return `${(value / 10000).toFixed(value < 100000 ? 1 : 0)}万`
  return `${(value / 100000000).toFixed(1)}億`
}

// 0秒は「まだ測れていない」を意味するので数字を出さない
export function formatDuration(seconds: number) {
  if (seconds <= 0) return '—'
  if (seconds < 60) return `${seconds}秒`

  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes}分` : `${minutes}分${rest}秒`
}

export function formatDayLabel(day: string) {
  const [, month, date] = day.split('-')
  return `${Number(month)}/${Number(date)}`
}

// 閲覧者のタイムゾーンに左右されないよう、日付文字列から曜日を算出する
export function weekdayOf(day: string) {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, date)).getUTCDay()
}

export function shiftDay(day: string, offset: number) {
  const [year, month, date] = day.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, date + offset))
  return shifted.toISOString().slice(0, 10)
}

export interface Scale {
  max: number
  ticks: number[]
}

// 軸の目盛りを 1 / 2 / 5 の倍数に寄せて、半端な数字が並ばないようにする
export function niceScale(maxValue: number, tickCount = 4): Scale {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return { max: 1, ticks: [0, 1] }

  const rawStep = maxValue / tickCount
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  const step = multiplier * magnitude
  const max = Math.ceil(maxValue / step) * step

  const ticks: number[] = []
  for (let value = 0; value <= max + step / 1000; value += step) {
    ticks.push(Math.round(value * 1000) / 1000)
  }

  return { max, ticks }
}

export function percentChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? null : 0
  return ((current - previous) / previous) * 100
}

// SVG内のテキストを潰さないため、viewBoxの拡大ではなく実ピクセルで描く。
// 初期値は0。仮の幅で描くとSVGが親を押し広げ、その広がった幅を測ってしまい元に戻らなくなる。
export function useChartWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width ?? 0
      if (measured > 0) setWidth(measured)
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return width
}
