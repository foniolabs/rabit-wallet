import type { Metadata } from 'next'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Rabit Docs',
    template: '%s — Rabit Docs',
  },
  description: 'Embedded, non-custodial wallet SDK for Next.js and Vite — official documentation.',
}

const logo = (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontWeight: 600 }}>
    <span
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        width: 24,
        height: 24,
        borderRadius: 8,
        background: '#0A1512',
        color: '#F1F6F4',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      R
    </span>
    <span style={{ fontFamily: 'var(--font-serif, Georgia), serif', fontSize: 17 }}>Rabit Docs</span>
  </span>
)

const navbar = (
  <Navbar logo={logo} projectLink="https://github.com/foniolabs/rabit-wallet" />
)

const footer = (
  <Footer>
    © {new Date().getFullYear()} Rabit · MIT licensed ·{' '}
    <a href="https://rabitwallet.xyz" target="_blank" rel="noreferrer" style={{ color: '#295B4F' }}>
      rabitwallet.xyz
    </a>
  </Footer>
)

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head backgroundColor={{ light: '#F1F6F4', dark: '#0A1512' }} />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/foniolabs/rabit-wallet/tree/main/apps/docs"
          nextThemes={{ defaultTheme: 'light' }}
          sidebar={{ defaultMenuCollapseLevel: 1, toggleButton: true }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
