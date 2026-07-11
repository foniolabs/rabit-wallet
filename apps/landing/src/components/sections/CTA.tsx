import { ArrowRight } from 'lucide-react'
import { Container, Section } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { ButtonLink } from '@/components/ui/Button'
import { siteConfig } from '@/lib/site'

export function CTA() {
  return (
    <Section>
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-5xl bg-ink px-6 py-16 text-center shadow-lifted sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="absolute inset-0 -z-0 opacity-60"
              style={{
                background:
                  'radial-gradient(50% 60% at 20% 0%, rgba(41,91,79,0.35), transparent 60%), radial-gradient(50% 60% at 90% 100%, rgba(86,159,140,0.30), transparent 60%)',
              }}
            />
            <div className="relative">
              <h2 className="serif mx-auto max-w-2xl text-display-lg text-balance text-paper">
                Ship a wallet, not a wallet team.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[16px] text-paper/70">
                Free for your first 1,000 monthly active wallets. Add auth,
                multi-chain, and on-ramp today.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ButtonLink
                  href={siteConfig.docs}
                  size="lg"
                  className="group bg-paper text-ink hover:bg-paper/90"
                >
                  Read the docs
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </ButtonLink>
                <ButtonLink
                  href={siteConfig.github}
                  size="lg"
                  variant="ghost"
                  className="border border-white/15 bg-white/5 text-paper/85 hover:bg-white/10 hover:text-paper"
                >
                  Star on GitHub
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  )
}
