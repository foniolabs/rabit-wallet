import { Container } from '@/components/ui/Container'

const chains = [
  'Ethereum',
  'Base',
  'Arbitrum',
  'Optimism',
  'Polygon',
  'Solana',
  'Sepolia',
  'Devnet',
]

export function Chains() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <p className="text-center text-[13px] font-medium uppercase tracking-[0.14em] text-ink-subtle">
          One seed, every chain — EVM &amp; Solana
        </p>
        <div className="mask-fade-r mt-8 overflow-hidden">
          <div className="flex w-max animate-marquee gap-3">
            {[...chains, ...chains].map((c, i) => (
              <span
                key={i}
                className="whitespace-nowrap rounded-full border border-line bg-card px-5 py-2.5 text-[15px] font-medium text-ink-muted shadow-soft"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
