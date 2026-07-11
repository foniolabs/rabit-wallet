'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, Plus, Mail } from 'lucide-react'

function TokenRow({
  glyph,
  name,
  chain,
  amount,
  fiat,
  tint,
}: {
  glyph: string
  name: string
  chain: string
  amount: string
  fiat: string
  tint: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper/60 px-3 py-2.5">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
        style={{ background: tint }}
      >
        {glyph}
      </span>
      <div className="min-w-0">
        <div className="text-[14px] font-medium leading-tight text-ink">{name}</div>
        <div className="text-[12px] text-ink-subtle">{chain}</div>
      </div>
      <div className="ml-auto text-right">
        <div className="text-[14px] font-medium leading-tight text-ink">{amount}</div>
        <div className="text-[12px] text-ink-subtle">{fiat}</div>
      </div>
    </div>
  )
}

function FloatBadge({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={`absolute hidden items-center gap-2 rounded-full border border-line bg-card px-3.5 py-2 text-[13px] font-medium text-ink shadow-lifted sm:flex ${className}`}
      animate={{ y: [0, -9, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  )
}

export function WalletVisual() {
  return (
    <div className="relative">
      {/* glow */}
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-[3rem] opacity-70 blur-2xl"
        style={{
          background:
            'radial-gradient(50% 50% at 50% 40%, rgba(41,91,79,0.18), transparent 70%), radial-gradient(40% 40% at 80% 80%, rgba(86,159,140,0.16), transparent 70%)',
        }}
      />

      {/* app window */}
      <div className="mx-auto max-w-md overflow-hidden rounded-[1.75rem] border border-line bg-card shadow-lifted">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="ml-3 rounded-md bg-paper px-2.5 py-1 font-mono text-[11px] text-ink-subtle">
            yourdapp.xyz
          </span>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-accent to-peach text-lg font-semibold text-white">
              E
            </span>
            <div>
              <div className="text-[15px] font-semibold text-ink">gm, emmanuel</div>
              <div className="font-mono text-[12px] text-ink-subtle">0x8f2c…a91e</div>
            </div>
            <span className="ml-auto rounded-full bg-mint/15 px-2.5 py-1 text-[12px] font-medium text-mint">
              ● Connected
            </span>
          </div>

          <div className="rounded-2xl bg-ink p-4 text-paper">
            <div className="text-[12px] text-paper/60">Portfolio</div>
            <div className="serif mt-0.5 text-3xl tracking-tight">$4,182.90</div>
          </div>

          <div className="space-y-2">
            <TokenRow glyph="Ξ" name="Ethereum" chain="Ethereum" amount="1.24 ETH" fiat="$3,910" tint="#627EEA" />
            <TokenRow glyph="◎" name="Solana" chain="Solana" amount="1.9 SOL" fiat="$272" tint="#9945FF" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink py-2.5 text-[14px] font-medium text-paper">
              <ArrowUpRight size={15} /> Send
            </button>
            <button className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line-strong bg-card py-2.5 text-[14px] font-medium text-ink">
              <Plus size={15} /> Buy
            </button>
          </div>
        </div>
      </div>

      <FloatBadge className="-left-2 top-16 sm:left-6 lg:-left-4" delay={0.4}>
        <Mail size={15} className="text-accent" /> Sign in with email
      </FloatBadge>
      <FloatBadge className="-right-1 top-28 sm:right-4 lg:-right-2" delay={1.2}>
        <span className="h-2 w-2 rounded-full bg-iris" /> No seed phrase
      </FloatBadge>
      <FloatBadge className="bottom-10 right-6 lg:-right-6" delay={2}>
        <span className="h-2 w-2 rounded-full bg-mint" /> 2-of-3 split key
      </FloatBadge>
    </div>
  )
}
