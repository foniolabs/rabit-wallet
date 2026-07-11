import { Navbar } from '@/components/sections/Navbar'
import { Hero } from '@/components/sections/Hero'
import { Chains } from '@/components/sections/Chains'
import { Pillars } from '@/components/sections/Pillars'
import { Showcase } from '@/components/sections/Showcase'
import { Features } from '@/components/sections/Features'
import { CodeShowcase } from '@/components/sections/CodeShowcase'
import { Frameworks } from '@/components/sections/Frameworks'
import { FAQ } from '@/components/sections/FAQ'
import { CTA } from '@/components/sections/CTA'
import { Footer } from '@/components/sections/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Chains />
        <Pillars />
        <Showcase />
        <Features />
        <CodeShowcase />
        <Frameworks />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
