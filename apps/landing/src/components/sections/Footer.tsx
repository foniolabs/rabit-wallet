import { Github } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/ui/Logo'
import { siteConfig } from '@/lib/site'

const groups = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Install', href: '#install' },
      { label: 'Docs', href: siteConfig.docs },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'GitHub', href: siteConfig.github },
      { label: 'Changelog', href: `${siteConfig.github}/releases` },
      { label: 'Examples', href: `${siteConfig.github}/tree/main/examples` },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Contact', href: 'mailto:hello@rabit.dev' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-subtle/40 py-16">
      <Container>
        <div className="grid gap-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-fg-muted">
              The embedded wallet SDK that actually works. MIT licensed and built in
              the open.
            </p>
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub"
              className="mt-6 inline-grid h-9 w-9 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              <Github size={16} />
            </a>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                {g.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      {...(l.href.startsWith('http') && {
                        target: '_blank',
                        rel: 'noreferrer noopener',
                      })}
                      className="text-sm text-fg-muted transition-colors hover:text-fg"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-fg-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} Rabit. All rights reserved.</p>
          <p>Built with Next.js and Tailwind CSS.</p>
        </div>
      </Container>
    </footer>
  )
}
