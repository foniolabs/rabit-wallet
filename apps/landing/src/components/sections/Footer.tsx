import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/ui/Logo'
import { siteConfig } from '@/lib/site'

const groups = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Developers', href: '#code' },
      { label: 'Docs', href: siteConfig.docs },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'npm', href: siteConfig.npm },
      { label: 'GitHub', href: siteConfig.github },
      { label: 'Quickstart', href: siteConfig.docs },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-line">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-[14.5px] leading-relaxed text-ink-muted">
              The embedded, non-custodial wallet SDK with built-in fiat on-ramp.
              Email login, EVM + Solana, one install.
            </p>
            <p className="mt-6 font-mono text-[13px] text-ink-subtle">{siteConfig.install}</p>
          </div>

          {groups.map((g) => (
            <div key={g.title}>
              <h4 className="text-[13px] font-semibold uppercase tracking-wider text-ink-subtle">
                {g.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-[14.5px] text-ink-muted transition-colors hover:text-ink"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
          <p className="text-[13.5px] text-ink-subtle">
            © {new Date().getFullYear()} Rabit. MIT licensed.
          </p>
          <p className="text-[13.5px] text-ink-subtle">
            رابط — the connector
          </p>
        </div>
      </Container>
    </footer>
  )
}
