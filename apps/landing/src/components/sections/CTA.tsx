'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Container, Section } from '@/components/ui/Container'
import { ButtonLink } from '@/components/ui/Button'
import { CopyableCommand } from '@/components/ui/CopyableCommand'
import { siteConfig } from '@/lib/site'

export function CTA() {
  return (
    <Section id="get-started">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-bg-subtle/60 px-8 py-16 text-center sm:px-16 sm:py-24"
        >
          <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[100px]"
            aria-hidden
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-display-lg font-semibold tracking-tight gradient-text">
              Start shipping in 30 seconds.
            </h2>
            <p className="mt-5 text-lg text-fg-muted">
              No setup. No SDK gymnastics. Install, wrap, ship.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <CopyableCommand command={`npm create rabit-app@latest`} />
              <ButtonLink href={siteConfig.docs} size="lg" className="group">
                Read the docs
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </ButtonLink>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}
