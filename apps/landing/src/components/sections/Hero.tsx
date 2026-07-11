'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { ButtonLink } from '@/components/ui/Button'
import { CopyableCommand } from '@/components/ui/CopyableCommand'
import { siteConfig } from '@/lib/site'
import { WalletVisual } from './WalletVisual'
import { HeroArtLeft, HeroArtRight } from './HeroArt'

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 sm:pt-40">
      <HeroArtLeft />
      <HeroArtRight />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            className="serif mt-2 text-display-2xl font-bold text-balance text-ink"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease }}
          >
            A wallet your users{' '}
            <span className="whitespace-nowrap rounded-2xl bg-mint/25 box-decoration-clone px-2 text-accent">
              never have to
            </span>{' '}
            think about.
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-ink-muted"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.14, ease }}
          >
            Rabit gives every user a non-custodial wallet from just an email —
            no extensions, no seed phrases. EVM&nbsp;+&nbsp;Solana, split-key
            security, and fiat on-ramp, in one <code className="font-mono text-[0.9em] text-ink">npm install</code>.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22, ease }}
          >
            <ButtonLink href={siteConfig.docs} size="lg" className="group">
              Start building
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </ButtonLink>
            <CopyableCommand command={siteConfig.install} />
          </motion.div>
        </div>

        <motion.div
          className="relative mx-auto mt-16 max-w-4xl sm:mt-20"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease }}
        >
          <WalletVisual />
        </motion.div>
      </Container>
    </section>
  )
}
