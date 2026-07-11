'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Container, Section, Eyebrow } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/cn'

const faqs = [
  {
    q: 'Is it really non-custodial?',
    a: 'Yes. The master key is split 2-of-3 (Shamir) across the user’s device, your Rabit API, and a recovery share. No single party — not you, not Rabit — ever holds the full key. There’s no seed phrase for the user to lose.',
  },
  {
    q: 'Which chains are supported?',
    a: 'EVM chains (Ethereum, Base, Arbitrum, Optimism, Polygon, and their testnets) and Solana (mainnet, devnet, testnet) — all derived from a single seed, so users switch chains without switching wallets.',
  },
  {
    q: 'Does it work with React Native?',
    a: 'Web React apps (Next.js, Vite, Remix, CRA) are fully supported today. React Native and PWAs are on the roadmap — the goal is an embedded wallet you build around in web or native apps, with no deep-linking out to an external wallet. The core is already largely platform-agnostic; a native package is planned.',
  },
  {
    q: 'Do I need a backend?',
    a: 'Rabit talks to a Rabit API (Express + Postgres) that handles auth, encrypted share storage, and the on/off-ramp. You deploy it once (there’s a Cloud Run runbook), and the client only ever holds a publishable key.',
  },
  {
    q: 'How much does it cost?',
    a: 'Free for your first 1,000 monthly active wallets. Beyond that, on-ramp transaction fees and paid tiers for scale — you only pay as you grow.',
  },
  {
    q: 'Can I use my own UI?',
    a: 'Absolutely. Drop in <WalletButton /> for the fast path, or build entirely custom with the hooks — useWallet, useBalances, useSendToken, useSwap, useOnRamp, and more.',
  },
]

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[16.5px] font-medium text-ink">{q}</span>
        <Plus
          size={20}
          className={cn('shrink-0 text-ink-subtle transition-transform duration-300', open && 'rotate-45')}
        />
      </button>
      <div
        className={cn(
          'grid overflow-hidden transition-all duration-300',
          open ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]',
        )}
      >
        <p className="min-h-0 max-w-2xl text-[15px] leading-relaxed text-ink-muted">{a}</p>
      </div>
    </div>
  )
}

export function FAQ() {
  return (
    <Section id="faq" className="scroll-mt-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="serif mt-5 text-display-lg font-bold text-balance text-ink">
              Questions, answered.
            </h2>
          </Reveal>
        </div>
        <Reveal delay={0.05}>
          <div className="mx-auto mt-12 max-w-3xl">
            {faqs.map((f) => (
              <Item key={f.q} {...f} />
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  )
}
