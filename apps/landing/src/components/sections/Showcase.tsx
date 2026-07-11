'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Container, Section } from '@/components/ui/Container'
import { cn } from '@/lib/cn'

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function Row({
  eyebrow,
  title,
  body,
  points,
  media,
  flip,
}: {
  eyebrow: string
  title: string
  body: string
  points: string[]
  media: ReactNode
  flip?: boolean
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal className={cn(flip && 'lg:order-2')}>
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</span>
        <h3 className="serif mt-3 text-display-lg font-bold text-balance text-ink">{title}</h3>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink-muted">{body}</p>
        <ul className="mt-6 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
                <Check size={13} />
              </span>
              <span className="text-[15px] text-ink-muted">{p}</span>
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={0.1} className={cn(flip && 'lg:order-1')}>
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-[3rem] opacity-70 blur-2xl"
            style={{ background: 'radial-gradient(50% 50% at 50% 40%, rgba(86,159,140,0.22), transparent 70%)' }}
          />
          {media}
        </div>
      </Reveal>
    </div>
  )
}

/* ---- mock UI panels ---- */

function AuthMock() {
  return (
    <div className="mx-auto max-w-sm card p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-[13px] font-bold text-paper">R</span>
        <span className="text-[15px] font-semibold text-ink">Sign in to My dApp</span>
      </div>
      <label className="text-[13px] font-medium text-ink-muted">Email</label>
      <div className="mt-1.5 flex h-11 items-center rounded-xl border border-line-strong bg-paper px-3.5 text-[14px] text-ink">
        emmanuel@example.com
      </div>
      <button className="mt-3 h-11 w-full rounded-xl bg-ink text-[14px] font-medium text-paper">Continue with email</button>
      <div className="my-4 flex items-center gap-3 text-[12px] text-ink-subtle">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <button className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-card text-[14px] font-medium text-ink">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-mint/20 text-[10px] text-mint">G</span>
        Continue with Google
      </button>
    </div>
  )
}

function ChainsMock() {
  const rows = [
    { g: 'Ξ', n: 'Ethereum', a: '1.24 ETH', f: '$3,910', c: '#627EEA' },
    { g: '◎', n: 'Solana', a: '18.5 SOL', f: '$2,640', c: '#9945FF' },
    { g: '$', n: 'USDC · Base', a: '540.00', f: '$540', c: '#295B4F' },
  ]
  return (
    <div className="mx-auto max-w-sm card p-5">
      <div className="text-[12px] text-ink-subtle">Total balance</div>
      <div className="serif text-3xl font-bold tracking-tight text-ink">$7,090.00</div>
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div key={r.n} className="flex items-center gap-3 rounded-2xl border border-line bg-paper/60 px-3 py-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: r.c }}>
              {r.g}
            </span>
            <span className="text-[14px] font-medium text-ink">{r.n}</span>
            <span className="ml-auto text-right">
              <span className="block text-[14px] font-medium text-ink">{r.a}</span>
              <span className="block text-[12px] text-ink-subtle">{r.f}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BuyMock() {
  return (
    <div className="mx-auto max-w-sm card p-5">
      <div className="mb-3 flex gap-2">
        <span className="rounded-full bg-accent px-3 py-1.5 text-[13px] font-medium text-paper">Buy</span>
        <span className="rounded-full border border-line px-3 py-1.5 text-[13px] font-medium text-ink-muted">Sell</span>
      </div>
      <div className="rounded-2xl bg-paper p-4">
        <div className="text-[12px] text-ink-subtle">You pay</div>
        <div className="serif text-2xl font-bold text-ink">$50.00</div>
      </div>
      <div className="my-1 text-center text-ink-subtle">↓</div>
      <div className="rounded-2xl border border-line bg-card p-4">
        <div className="text-[12px] text-ink-subtle">You get</div>
        <div className="serif text-2xl font-bold text-ink">≈ 49.6 USDC</div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px] text-ink-subtle">
        <span>Pay with card</span><span>Fee $0.40</span>
      </div>
      <button className="mt-3 h-11 w-full rounded-xl bg-ink text-[14px] font-medium text-paper">Buy USDC</button>
    </div>
  )
}

export function Showcase() {
  return (
    <Section className="space-y-24 sm:space-y-32">
      <Container>
        <Row
          eyebrow="Sign in"
          title="A wallet from just an email."
          body="Users sign in the way they already know — email OTP or Google. Rabit derives a non-custodial wallet behind the scenes. No extensions, no seed phrases, no drop-off."
          points={['Email OTP & Google out of the box', 'Wallet ready in seconds', 'Drop-in <WalletButton /> or bring your own UI']}
          media={<AuthMock />}
        />
      </Container>
      <Container>
        <Row
          flip
          eyebrow="Multi-chain"
          title="One login, every chain."
          body="A single BIP-44 seed gives every user an Ethereum and a Solana account. Read balances, send, and swap across EVM and Solana from the same session."
          points={['EVM + Solana from one seed', 'Unified balances & activity', 'LiFi + Jupiter swaps built in']}
          media={<ChainsMock />}
        />
      </Container>
      <Container>
        <Row
          eyebrow="On-ramp"
          title="Cash in, cash out."
          body="Fiat rails ship with the SDK. Users buy crypto with card, bank transfer, or mobile money — and cash back out — without a third-party widget bolted on."
          points={['Card, bank & mobile-money', 'On-ramp and off-ramp', 'Funds settle straight to the wallet']}
          media={<BuyMock />}
        />
      </Container>
    </Section>
  )
}
