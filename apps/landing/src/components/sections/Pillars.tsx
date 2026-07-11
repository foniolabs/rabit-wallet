import { Container, Section } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'

const pillars = [
  { word: 'Effortless', body: 'Email or Google sign-in. A wallet in seconds — no extension, no seed phrase.' },
  { word: 'Non-custodial', body: '2-of-3 Shamir split key. Users own their keys; you never hold the full one.' },
  { word: 'Multi-chain', body: 'EVM and Solana from one seed. Switch chains without switching wallets.' },
  { word: 'Complete', body: 'Auth, smart accounts, swaps, and fiat on-ramp — all in one install.' },
]

export function Pillars() {
  return (
    <Section className="py-16 sm:py-20">
      <Container>
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <Reveal key={p.word} delay={i * 0.07}>
              <div>
                <h3 className="serif text-2xl font-bold text-accent">{p.word}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  )
}
