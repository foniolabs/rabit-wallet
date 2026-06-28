export const siteConfig = {
  name: 'Rabit',
  title: 'Rabit — The embedded wallet SDK for modern apps',
  description:
    'Drop-in auth, smart accounts, and on-ramp for Vite and Next.js. Ship a production wallet in minutes — not weeks.',
  url: 'https://rabit.dev',
  ogImage: '/opengraph-image',
  twitter: '@rabit_dev',
  github: 'https://github.com/foniolabs/rabit-wallet',
  docs: 'https://docs.rabit.dev',
  npm: {
    react: '@rabit/react',
    core: '@rabit/core',
    create: 'create-rabit-app',
  },
}

export type SiteConfig = typeof siteConfig
