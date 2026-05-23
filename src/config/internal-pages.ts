import { BASE_PATH } from './base-path'

export type InternalPageId = 'activity' | 'contact' | 'link'

export interface InternalPageContent {
  id: InternalPageId
  label: string
  eyebrow: string
  title: string
  lead: string
  body: string[]
}

export const INTERNAL_PAGES: Record<InternalPageId, InternalPageContent> = {
  activity: {
    id: 'activity',
    label: '活動内容',
    eyebrow: 'ACTIVITY',
    title: '活動内容',
    lead: '名古屋市立大学（名市大）から始まった学生主体の活動として、名古屋市博物館と若者をつなぐ企画や発信に取り組んでいます。',
    body: [
      '毎週木曜日に大学や博物館で会議などの活動を行っています。',
      '名古屋市博物館でのイベントや、博物館の魅力発信のための取り組みを行ってきました。',
      '展示や地域の歴史に触れるきっかけをつくり、若い世代が博物館へ足を運びたくなるような活動を続けています。',
    ],
  },
  contact: {
    id: 'contact',
    label: 'お問い合わせ',
    eyebrow: 'CONTACT',
    title: 'お問い合わせ',
    lead: '活動見学、入部希望、取材、協働の相談などはこちらから。',
    body: [
      'MAROの活動に興味がある方、見学や入部を希望される方、取材やお問い合わせをご希望の方は、こちらのページから連絡ください。',
    ],
  },
  link: {
    id: 'link',
    label: 'リンク',
    eyebrow: 'LINK',
    title: 'リンク',
    lead: 'SNS、ブログ、各種リンク / サイトマップをひとつにまとめた案内ページです。',
    body: [],
  },
}

export function getAppPath(path: InternalPageId | '') {
  const base = BASE_PATH ? `${BASE_PATH}/` : '/'
  return path ? `${base}${path}/` : base
}

export function getCurrentInternalPage(): InternalPageId | null {
  if (typeof window === 'undefined') return null

  const base = BASE_PATH ? `${BASE_PATH}/` : '/'
  const pathname = window.location.pathname
  const relativePath = pathname.startsWith(base)
    ? pathname.slice(base.length)
    : pathname.replace(/^\/+/, '')
  const pageId = relativePath.replace(/\/+$/, '')

  if (pageId === 'activity' || pageId === 'contact' || pageId === 'link') return pageId
  return null
}
