'use client'

import { useEffect, useState } from 'react'
import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/ui/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { siteConfig } from '@/lib/site'
import { cn } from '@/lib/cn'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Developers', href: '#code' },
  { label: 'Docs', href: siteConfig.docs },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <Container className="px-4 pt-3 sm:pt-4">
        <nav
          className={cn(
            'flex h-14 items-center justify-between rounded-full pl-5 pr-2 transition-all duration-300',
            scrolled
              ? 'border border-line bg-card/80 shadow-soft backdrop-blur-xl'
              : 'border border-transparent',
          )}
        >
          <a href="#top" aria-label="Rabit home">
            <Logo />
          </a>
          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-full px-4 py-2 text-[14.5px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noreferrer noopener"
              className="hidden rounded-full px-4 py-2 text-[14.5px] font-medium text-ink-muted transition-colors hover:text-ink sm:block"
            >
              GitHub
            </a>
            <ButtonLink href={siteConfig.docs} size="sm">
              Get started
            </ButtonLink>
          </div>
        </nav>
      </Container>
    </header>
  )
}
