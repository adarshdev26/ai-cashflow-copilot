export const SITE = {
  name: 'Cashflow Co', // TODO: real brand
  tagline: 'Money, habits and notes, in one shared workspace.',
  description:
    'Track income and expenses, keep family, business and side-project money in separate workspaces, and build better money habits, together.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  email: 'hello@cashflowcopilot.com', // TODO
};

export const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },   
  { href: '/security', label: 'Security' },
  { href: '/about', label: 'About' },
];

export const FOOTER_LINKS = {
  Product: [
    { href: '/features', label: 'Features' },
    { href: '/how-it-works', label: 'How it works' },
    { href: '/security', label: 'Security' },
     { href: '/pricing', label: 'Pricing' },
  ],
  Company: [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
  ],
  Account: [
    { href: '/signup', label: 'Get started' },
    { href: '/login', label: 'Log in' },
  ],
};

export const MARKETING_ROUTES = [
  '/',
  '/features',
  '/how-it-works',
  '/pricing',
  '/security',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
];