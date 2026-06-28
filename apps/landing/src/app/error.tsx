'use client'

import { useEffect } from 'react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="grid min-h-screen place-items-center">
      <Container className="text-center">
        <h1 className="text-display-lg font-semibold tracking-tight gradient-text">
          Something broke.
        </h1>
        <p className="mt-4 text-lg text-fg-muted">
          We logged it. Try again — or reload the page.
        </p>
        <Button className="mt-8" onClick={reset}>
          Try again
        </Button>
      </Container>
    </main>
  )
}
