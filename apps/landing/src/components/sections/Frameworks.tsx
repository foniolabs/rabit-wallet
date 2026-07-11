import { Container, Section } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'

const frameworks = [
  { name: 'Next.js', note: 'App Router ready', glyph: 'N' },
  { name: 'Vite', note: 'React SPA', glyph: 'V' },
  { name: 'React', note: '18+', glyph: 'R' },
]

export function Frameworks() {
  return (
    <Section className="pt-4">
      <Container>
        <Reveal>
          <div className="card overflow-hidden">
            <div className="grid gap-px bg-line sm:grid-cols-3">
              {frameworks.map((f) => (
                <div key={f.name} className="flex items-center gap-4 bg-card px-7 py-8">
                  <span className="serif grid h-12 w-12 place-items-center rounded-2xl bg-paper text-2xl text-ink">
                    {f.glyph}
                  </span>
                  <div>
                    <div className="text-[16px] font-semibold text-ink">{f.name}</div>
                    <div className="text-[13.5px] text-ink-subtle">{f.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  )
}
