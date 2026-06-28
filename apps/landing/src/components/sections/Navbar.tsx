'use client'

import Link from 'next/link'
import { Github, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { siteConfig } from '@/lib/site'
import { cn } from '@/lib/cn'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#install', label: 'Install' },
  { href: siteConfig.docs, label: 'Docs', external: true },
  { href: '#pricing', label: 'Pricing' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-border bg-bg/70 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link href="/" aria-label="Rabit home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) =>
            l.external ? (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-fg-muted transition-colors hover:text-fg"
              >
                {l.label}
              </a>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-fg-muted transition-colors hover:text-fg"
              >
                {l.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub"
            className="grid h-9 w-9 place-items-center rounded-full text-fg-muted transition-colors hover:bg-bg-raised hover:text-fg"
          >
            <Github size={18} />
          </a>
          <ButtonLink href={siteConfig.docs} variant="secondary" size="sm">
            Get started
          </ButtonLink>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-md text-fg-muted md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-bg/95 backdrop-blur-xl md:hidden">
          <div className="container mx-auto flex flex-col gap-1 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                {...(l.external && { target: '_blank', rel: 'noreferrer noopener' })}
                className="rounded-lg px-3 py-2.5 text-[15px] text-fg-muted hover:bg-bg-raised hover:text-fg"
              >
                {l.label}
              </a>
            ))}
            <ButtonLink href={siteConfig.docs} className="mt-3 w-full" size="md">
              Get started
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  )
}
