import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center">
      <Container className="text-center">
        <Link href="/" aria-label="Home" className="inline-block">
          <Logo />
        </Link>
        <h1 className="mt-12 text-display-xl font-semibold tracking-tight gradient-text">
          404
        </h1>
        <p className="mt-4 text-lg text-fg-muted">
          That page hopped away. Let&apos;s get you back home.
        </p>
        <ButtonLink href="/" className="mt-8">
          Back to home
        </ButtonLink>
      </Container>
    </main>
  )
}
