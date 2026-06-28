'use client'

import { motion } from 'framer-motion'
import { Container, Section } from '@/components/ui/Container'

const frameworks = [
  { name: 'Next.js', glyph: <NextGlyph /> },
  { name: 'Vite', glyph: <ViteGlyph /> },
  { name: 'React', glyph: <ReactGlyph /> },
  { name: 'TypeScript', glyph: <TsGlyph /> },
  { name: 'viem', glyph: <Mono>viem</Mono> },
  { name: 'wagmi', glyph: <Mono>wagmi</Mono> },
  { name: 'Solana', glyph: <Mono>solana/web3</Mono> },
]

export function Frameworks() {
  return (
    <Section className="border-y border-border bg-bg-subtle/40 py-16 sm:py-20">
      <Container>
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-fg-subtle">
          Built for the modern stack
        </p>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6"
        >
          {frameworks.map((f) => (
            <div
              key={f.name}
              className="flex items-center gap-2.5 text-fg-muted transition-colors hover:text-fg"
              aria-label={f.name}
            >
              {f.glyph}
              <span className="text-sm font-medium">{f.name}</span>
            </div>
          ))}
        </motion.div>
      </Container>
    </Section>
  )
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-base">{children}</span>
}
function NextGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 7h1.5l5 7.5V7H17v10h-1.5l-5-7.5V17H9V7z" />
    </svg>
  )
}
function ViteGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 4l10 16L22 4 12 9 2 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
function ReactGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.2" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.2" transform="rotate(120 12 12)" />
    </svg>
  )
}
function TsGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <text x="12" y="16" textAnchor="middle" fontFamily="monospace" fontSize="9" fontWeight="700" fill="#08080A">TS</text>
    </svg>
  )
}
