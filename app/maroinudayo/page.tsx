import type { Metadata } from 'next'
import { StatsDashboard } from '../../src/components/StatsDashboard'

export const metadata: Metadata = {
  title: 'アクセス統計',
  // 管理用ページなので検索結果には出さない
  robots: { index: false, follow: false },
}

export default function StatsPage() {
  return <StatsDashboard />
}
