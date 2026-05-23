import { describe, expect, it } from 'vitest'
import { formatDate } from './format'

describe('formatDate', () => {
  it('undefinedを渡すと空文字を返す', () => {
    expect(formatDate(undefined)).toBe('')
  })

  it('空文字を渡すと空文字を返す', () => {
    expect(formatDate('')).toBe('')
  })

  it('ISO日付文字列を日本語形式に変換する', () => {
    const result = formatDate('2026-01-05')
    // ja-JP ロケールで YYYY/MM/DD 形式になる
    expect(result).toMatch(/2026/)
    expect(result).toMatch(/01/)
    expect(result).toMatch(/05/)
  })

  it('月と日がゼロ埋めされる', () => {
    const result = formatDate('2026-03-07')
    expect(result).toMatch(/03/)
    expect(result).toMatch(/07/)
  })
})
