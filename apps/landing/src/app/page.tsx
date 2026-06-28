import { Navbar } from '@/components/sections/Navbar'
import { Hero } from '@/components/sections/Hero'
import { Frameworks } from '@/components/sections/Frameworks'
import { Features } from '@/components/sections/Features'
import { CodeShowcase } from '@/components/sections/CodeShowcase'
import { CTA } from '@/components/sections/CTA'
import { Footer } from '@/components/sections/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Frameworks />
        <Features />
        <CodeShowcase />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
