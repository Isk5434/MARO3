import { describe, expect, it } from 'vitest'
import { articleSchema, breadcrumbSchema, faqSchema } from './structured-data'

describe('breadcrumbSchema', () => {
  it('正しいSchema.org構造を返す', () => {
    const result = breadcrumbSchema([
      { name: 'TOP', url: 'https://example.com/' },
      { name: '活動内容', url: 'https://example.com/activity' },
    ])
    expect(result['@type']).toBe('BreadcrumbList')
    expect(result.itemListElement).toHaveLength(2)
    expect(result.itemListElement[0].position).toBe(1)
    expect(result.itemListElement[0].name).toBe('TOP')
    expect(result.itemListElement[1].position).toBe(2)
    expect(result.itemListElement[1].name).toBe('活動内容')
  })

  it('空配列のとき itemListElement が空になる', () => {
    const result = breadcrumbSchema([])
    expect(result.itemListElement).toHaveLength(0)
  })
})

describe('articleSchema', () => {
  const base = {
    title: 'テスト記事',
    description: '説明文',
    url: 'https://example.com/activity/1',
    publishedAt: '2026-05-01',
  }

  it('必須フィールドを含む', () => {
    const result = articleSchema(base)
    expect(result['@type']).toBe('Article')
    expect(result.headline).toBe('テスト記事')
    expect(result.datePublished).toBe('2026-05-01')
  })

  it('imageUrlなしのとき image フィールドが存在しない', () => {
    const result = articleSchema(base)
    expect(result).not.toHaveProperty('image')
  })

  it('imageUrlありのとき image フィールドが含まれる', () => {
    const result = articleSchema({ ...base, imageUrl: 'https://example.com/img.jpg' })
    expect(result.image).toEqual({
      '@type': 'ImageObject',
      url: 'https://example.com/img.jpg',
    })
  })
})

describe('faqSchema', () => {
  it('Question/Answer 構造を返す', () => {
    const result = faqSchema([{ question: 'MAROとは？', answer: '学生団体です。' }])
    expect(result['@type']).toBe('FAQPage')
    expect(result.mainEntity[0]['@type']).toBe('Question')
    expect(result.mainEntity[0].name).toBe('MAROとは？')
    expect(result.mainEntity[0].acceptedAnswer.text).toBe('学生団体です。')
  })
})
