'use client'

import { motion } from 'framer-motion'
import {
  Boxes,
  Fingerprint,
  Globe2,
  KeyRound,
  Wallet,
  Zap,
} from 'lucide-react'
import { Container, Section, SectionLabel } from '@/components/ui/Container'

const features = [
  {
    icon: Fingerprint,
    title: 'Embedded auth',
    description:
      'Email, social, passkey, and wallet login — all in one drop-in component. No redirect loops, no popup hell.',
  },
  {
    icon: Wallet,
    title: 'Smart accounts, built in',
    description:
      'ERC-4337 account abstraction shipped by default. Sponsor gas, batch transactions, recover keys.',
  },
  {
    icon: Globe2,
    title: 'Multi-chain ready',
    description:
      'EVM and Solana out of the box. Switch networks, sign messages, send transactions — one consistent API.',
  },
  {
    icon: KeyRound,
    title: 'Non-custodial keys',
    description:
      'TSS / MPC key management. Users own their keys. You never see them. SOC 2-aligned key infra.',
  },
  {
    icon: Zap,
    title: 'On-ramp on tap',
    description:
      'Built-in fiat-to-crypto with sensible defaults. Configure providers, fees, and supported regions.',
  },
  {
    icon: Boxes,
    title: 'Framework-agnostic core',
    description:
      'React today; Vue, Svelte, and vanilla planned. The core is a tiny, tree-shakeable TypeScript package.',
  },
]

export function Features() {
  return (
    <Section id="features" className="relative">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Features</SectionLabel>
          <h2 className="mt-5 text-display-lg font-semibold tracking-tight gradient-text">
            Everything you need.
            <br />
            Nothing you don&apos;t.
          </h2>
          <p className="mt-5 text-lg text-fg-muted">
            Rabit gives you a wallet, an auth flow, and an on-ramp — wired together,
            tested, and built for production.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group relative bg-bg p-7 transition-colors hover:bg-bg-subtle"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-bg-raised text-accent transition-colors group-hover:border-accent/40">
                <f.icon size={20} strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 text-lg font-medium text-fg">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  )
}
