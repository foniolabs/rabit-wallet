import type { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
      <span
        style={{
          display: 'inline-grid',
          placeItems: 'center',
          width: 22,
          height: 22,
          borderRadius: 6,
          background: 'linear-gradient(135deg, #FF7A1A, #FF8A33)',
          color: 'white',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        R
      </span>
      Rabit Docs
    </span>
  ),
  project: { link: 'https://github.com/foniolabs/rabit-wallet' },
  chat: { link: 'https://discord.gg/rabit' },
  docsRepositoryBase: 'https://github.com/foniolabs/rabit-wallet/tree/main/apps/docs',
  footer: {
    text: (
      <span>
        © {new Date().getFullYear()} Rabit · MIT licensed ·{' '}
        <a href="https://rabit.dev" target="_blank" rel="noreferrer">
          rabit.dev
        </a>
      </span>
    ),
  },
  primaryHue: { light: 22, dark: 25 },
  primarySaturation: { light: 95, dark: 90 },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s — Rabit Docs',
      description: 'Embedded wallet SDK for Vite and Next.js — official documentation.',
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:title" content="Rabit Docs" />
      <meta property="og:description" content="Embedded wallet SDK for Vite and Next.js" />
    </>
  ),
}

export default config
