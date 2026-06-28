'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { ButtonLink } from '@/components/ui/Button'
import { CopyableCommand } from '@/components/ui/CopyableCommand'
import { siteConfig } from '@/lib/site'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Background grid + glow */}
      <div className="pointer-events-none absolute inset-0 grid-pattern mask-radial opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[1100px] -translate-x-1/2 bg-grid-fade" />

      <Container className="relative">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer noopener"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-bg-subtle/60 px-3 py-1.5 text-xs text-fg-muted backdrop-blur transition-colors hover:border-accent/40 hover:text-fg"
          >
            <Sparkles size={12} className="text-accent" />
            <span className="font-medium text-fg">v0.1</span>
            <span className="h-3 w-px bg-border" />
            <span>Embedded wallet SDK is now in public beta</span>
            <ArrowRight size={12} />
          </a>

          <h1 className="text-display-2xl font-semibold tracking-tight">
            <span className="gradient-text">The wallet SDK</span>
            <br />
            <span className="accent-text">that actually works.</span>
          </h1>

          <p className="mt-6 max-w-xl text-balance text-lg text-fg-muted sm:text-xl">
            Drop-in social login, smart accounts, and on-ramp for{' '}
            <span className="text-fg">Vite</span> and{' '}
            <span className="text-fg">Next.js</span>. Ship a production wallet in minutes — not weeks.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <ButtonLink href={siteConfig.docs} size="lg" className="group">
              Get started
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </ButtonLink>
            <CopyableCommand command={`npm i ${siteConfig.npm.react}`} />
          </div>

          <p className="mt-6 text-xs text-fg-subtle">
            MIT licensed · TypeScript-first · Tree-shakeable · Works in any React app
          </p>
        </motion.div>

        {/* Hero preview */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-20 max-w-4xl"
        >
          <div className="absolute inset-x-12 -top-8 h-32 bg-accent/20 blur-3xl" aria-hidden />
          <HeroPreview />
        </motion.div>
      </Container>
    </section>
  )
}

function HeroPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-subtle/80 p-2 shadow-2xl shadow-black/60 backdrop-blur">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-raised">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-fg-subtle/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-fg-subtle/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-fg-subtle/30" />
          <span className="ml-3 font-mono text-xs text-fg-muted">
            app.tsx — your-app
          </span>
        </div>

        <div className="grid gap-0 lg:grid-cols-2">
          {/* Code panel */}
          <div className="border-b border-border p-6 font-mono text-[13px] leading-relaxed lg:border-b-0 lg:border-r">
            <CodeLine>
              <span className="text-violet-300">import</span>{' '}
              <span className="text-fg">{'{ RabitProvider, ConnectButton }'}</span>{' '}
              <span className="text-violet-300">from</span>{' '}
              <span className="text-emerald-300">&apos;@rabit/react&apos;</span>
            </CodeLine>
            <CodeLine />
            <CodeLine>
              <span className="text-violet-300">export default function</span>{' '}
              <span className="text-sky-300">App</span>() {'{'}
            </CodeLine>
            <CodeLine indent={1}>
              <span className="text-violet-300">return</span> (
            </CodeLine>
            <CodeLine indent={2}>
              {'<'}
              <span className="text-pink-300">RabitProvider</span>{' '}
              <span className="text-amber-300">apiKey</span>=
              <span className="text-emerald-300">{'{process.env.RABIT_KEY}'}</span>
              {'>'}
            </CodeLine>
            <CodeLine indent={3}>
              {'<'}
              <span className="text-pink-300">ConnectButton</span> {'/>'}
            </CodeLine>
            <CodeLine indent={2}>
              {'</'}
              <span className="text-pink-300">RabitProvider</span>
              {'>'}
            </CodeLine>
            <CodeLine indent={1}>)</CodeLine>
            <CodeLine>{'}'}</CodeLine>
          </div>

          {/* Preview panel */}
          <div className="relative grid place-items-center bg-gradient-to-br from-bg-subtle via-bg-raised to-bg-subtle p-10">
            <div className="absolute inset-0 grid-pattern opacity-30" />
            <div className="relative flex flex-col items-center gap-5">
              <button className="group flex items-center gap-2.5 rounded-full bg-accent px-5 py-2.5 font-medium text-white shadow-[0_8px_24px_-8px_rgba(255,122,26,0.55)] transition-all hover:bg-accent-hover hover:shadow-[0_12px_32px_-8px_rgba(255,122,26,0.7)]">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-xs">
                  R
                </span>
                Connect wallet
              </button>
              <div className="flex items-center gap-2 text-xs text-fg-subtle">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Powered by Rabit
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CodeLine({
  children,
  indent = 0,
}: {
  children?: React.ReactNode
  indent?: number
}) {
  return (
    <div className="text-fg-muted" style={{ paddingLeft: `${indent * 1}rem` }}>
      {children ?? ' '}
    </div>
  )
}
