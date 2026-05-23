import type { MetadataRoute } from 'next'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MARO | 名古屋市博物館サポーター',
    short_name: 'MARO',
    description:
      '名古屋市博物館サポーター団体MAROの公式サイト。名古屋市立大学から始まった学生主体の活動として、若い世代と博物館をつなぎます。',
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: 'standalone',
    background_color: '#fffdf0',
    theme_color: '#5c4534',
    lang: 'ja',
    icons: [
      {
        src: `${basePath}/favicon.svg`,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: `${basePath}/favicon.jpg`,
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: `${basePath}/favicon.jpg`,
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  }
}
