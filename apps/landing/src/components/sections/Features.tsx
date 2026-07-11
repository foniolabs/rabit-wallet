import { Mail, ShieldCheck, Layers, CreditCard, Code2, Fingerprint } from 'lucide-react'
import { Container, Section, Eyebrow } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'

const features = [
  {
    icon: Mail,
    title: 'Web2 sign-in',
    body: 'Email OTP or Google — users are in with an address in seconds. No extensions, no seed phrases, no popups.',
    tint: '#295B4F',
  },
  {
    icon: ShieldCheck,
    title: 'Non-custodial by design',
    body: '2-of-3 Shamir split key across device, server, and recovery. You never hold the full key, and neither do we.',
    tint: '#569F8C',
  },
  {
    icon: Layers,
    title: 'EVM + Solana, one seed',
    body: 'BIP-44 derivation gives every user an Ethereum and a Solana account from the same login. Switch chains freely.',
    tint: '#3E7D6E',
  },
  {
    icon: CreditCard,
    title: 'On-ramp built in',
    body: 'Card, bank transfer, and mobile-money fiat rails ship with the SDK — no third-party widget to bolt on.',
    tint: '#7FB8A8',
  },
  {
    icon: Fingerprint,
    title: 'EOA or smart account',
    body: 'Start with an EOA, upgrade to a smart account (Kernel, Safe, Light) for gas sponsorship and batching.',
    tint: '#627EEA',
  },
  {
    icon: Code2,
    title: 'Hooks for everything',
    body: 'useWallet, useBalances, useSendToken, useContractWrite, useSwap… a wagmi-style API, purpose-built.',
    tint: '#0A1512',
  },
]

export function Features() {
  return (
    <Section id="features" className="scroll-mt-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <Eyebrow>Why Rabit</Eyebrow>
            <h2 className="serif mt-5 text-display-lg text-balance text-ink">
              Everything a wallet needs.
              <br className="hidden sm:block" /> None of the friction.
            </h2>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <div className="card h-full p-6 transition-shadow duration-300 hover:shadow-lifted">
                <span
                  className="grid h-11 w-11 place-items-center rounded-2xl text-white"
                  style={{ background: f.tint }}
                >
                  <f.icon size={20} />
                </span>
                <h3 className="mt-5 text-[17px] font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-muted">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  )
}
