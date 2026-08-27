'use client'
import { useEffect, useState } from 'react'

// 記事パス -> 累計表示回数。取得前・取得失敗時は null のまま。
export function useArticleViews() {
  const [views, setViews] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/article-views')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.views) setViews(data.views as Record<string, number>)
      })
      .catch(() => {
        // 閲覧数が出ないだけで記事の表示は妨げない
      })

    return () => {
      cancelled = true
    }
  }, [])

  return views
}

export function formatViewCount(count: number) {
  return `${count.toLocaleString('ja-JP')}回閲覧`
}
