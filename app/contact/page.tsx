import type { Metadata } from 'next'
import App from '../../src/App'
import { breadcrumbSchema, faqSchema, webPageSchema } from '../../src/lib/structured-data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maroinu.pages.dev'

export const metadata: Metadata = {
  title: 'お問い合わせ',
  description:
    'MAROへの活動見学・入部希望・取材・お問い合わせはこちらから。活動に興味がある方、協働のご相談をしたい方はお気軽にどうぞ。',
  alternates: { canonical: '/contact/' },
}

export default function ContactPage() {
  const breadcrumb = breadcrumbSchema([
    { name: 'ホーム', url: `${siteUrl}/` },
    { name: 'お問い合わせ', url: `${siteUrl}/contact/` },
  ])

  const page = webPageSchema({
    name: 'お問い合わせ | MARO',
    description:
      'MAROへの活動見学・入部希望・取材・お問い合わせはこちらから。活動に興味がある方、協働のご相談をしたい方はお気軽にどうぞ。',
    url: `${siteUrl}/contact/`,
    type: 'ContactPage',
    keywords: ['MARO 問い合わせ', 'MARO 入部', 'MARO 見学', '名市大 MARO', '博物館サポーター 参加'],
  })

  const faq = faqSchema([
    {
      question: 'MAROとはどんな団体ですか？',
      answer:
        'MAROは名古屋市博物館のサポーター団体です。名古屋市立大学（名市大）から始まった学生主体の活動として、若い世代と博物館をつなぐ企画・運営・発信を行っています。',
    },
    {
      question: 'MAROの活動に参加・見学するにはどうすればいいですか？',
      answer:
        'お問い合わせページのフォームからご連絡いただくか、Facebook・Twitter・InstagramのSNSのDMからご連絡ください。活動見学や入部希望など、どなたでもお気軽にどうぞ。',
    },
    {
      question: 'MAROはどこで活動していますか？',
      answer: '主に名古屋市博物館と大学で活動しています。毎週木曜日に定例活動を行っています。',
    },
    {
      question: 'MAROに入部するための条件はありますか？',
      answer:
        '博物館や文化活動に興味がある方であればどなたでも歓迎です。詳細はお問い合わせフォームまたはSNSよりご連絡ください。',
    },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(page) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <App initialPageId="contact" />
    </>
  )
}
