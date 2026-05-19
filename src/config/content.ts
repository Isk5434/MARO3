export const SITE_CONTENT = {
  title: 'maro',
  hero: {
    heading: 'maro',
    subtitle: '名古屋市博物館サポーターMARO',
    cta: 'View Works',
  },
  about: {
    heading: 'About',
    body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation.`,
    links: [
      { label: 'Twitter / X', href: '#' },
      { label: 'GitHub', href: '#' },
    ],
  },
  footer: {
    links: [
      { label: 'Works', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  sections: [
    {
      id: 'intro',
      heading: 'Nagoya City Museum Supporter.',
      body: '',
    },
  ],
  selectionCards: [
    { id: 'about',    category: 'ABOUT',   label: 'MAROとは',    sub: 'About MARO',   href: 'https://museumsupporter-maro.wixsite.com/maro/about' },
    { id: 'news',     category: 'ACTIVITY',label: '活動内容',    sub: 'Activities',   href: 'https://museumsupporter-maro.wixsite.com/maro/news' },
    { id: 'contact',  category: 'CONTACT', label: 'お問い合わせ', sub: 'Get in touch', href: 'https://museumsupporter-maro.wixsite.com/maro/contact' },
    { id: 'facebook', category: 'SOCIAL',  label: 'Facebook',    sub: 'Follow us',    href: 'https://www.facebook.com/museumsupportermaro/' },
    { id: 'twitter',  category: 'SOCIAL',  label: 'Twitter / X', sub: 'Follow us',    href: 'https://twitter.com/maro_museum' },
    { id: 'instagram',category: 'SOCIAL',  label: 'Instagram',   sub: 'Follow us',    href: 'https://www.instagram.com/maro_museum/' },
  ],
} as const
