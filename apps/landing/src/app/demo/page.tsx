import type { Metadata } from 'next'
import { Playground } from '@/components/demo/Playground'

export const metadata: Metadata = {
  title: 'Playground',
  description: 'Test and design the Rabit embedded wallet — toggle sign-in methods, chains, and theme, and see the UI update live.',
}

export default function DemoPage() {
  return <Playground />
}
