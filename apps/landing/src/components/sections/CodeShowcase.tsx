import { Check } from 'lucide-react'
import { Container, Section, Eyebrow } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { CopyableCommand } from '@/components/ui/CopyableCommand'
import { siteConfig } from '@/lib/site'

const points = [
  'One package, one import — no provider soup',
  'Drop-in <WalletButton /> handles the whole auth + wallet flow',
  'Typed hooks for balances, sends, contracts, swaps, on-ramp',
  'Works in Next.js, Vite, and plain React',
]

// Tiny hand-rolled highlighter for a premium code card.
const c = {
  kw: 'text-[#E5A3FF]',
  fn: 'text-[#7FC6FF]',
  str: 'text-[#9EE6A6]',
  cmt: 'text-paper/40',
  tag: 'text-[#7FB8A8]',
  punc: 'text-paper/55',
}

export function CodeShowcase() {
  return (
    <Section id="code" className="scroll-mt-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>Developer experience</Eyebrow>
            <h2 className="serif mt-5 text-display-lg text-balance text-ink">
              From zero to a live wallet in a coffee break.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-muted">
              Install the package, wrap your app, drop in a button. That&apos;s a
              production, non-custodial wallet — email login, multi-chain, and
              on-ramp included.
            </p>

            <ul className="mt-7 space-y-3">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
                    <Check size={13} />
                  </span>
                  <span className="text-[15px] text-ink-muted">{p}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <CopyableCommand command={siteConfig.install} />
              <CopyableCommand command={siteConfig.scaffold} />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-4xl border border-line bg-ink shadow-lifted">
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
                <span className="h-3 w-3 rounded-full bg-white/15" />
                <span className="h-3 w-3 rounded-full bg-white/15" />
                <span className="h-3 w-3 rounded-full bg-white/15" />
                <span className="ml-3 font-mono text-[12px] text-paper/40">app.tsx</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-[1.75] text-paper">
                <code>
                  <span className={c.kw}>import</span> <span className={c.punc}>{'{'}</span>{' '}
                  RabitProvider<span className={c.punc}>,</span> WalletButton
                  <span className={c.punc}>,</span> useWallet <span className={c.punc}>{'}'}</span>{' '}
                  <span className={c.kw}>from</span> <span className={c.str}>&apos;rabitwallet&apos;</span>
                  {'\n\n'}
                  <span className={c.kw}>export function</span> <span className={c.fn}>App</span>
                  <span className={c.punc}>() {'{'}</span>
                  {'\n'}  <span className={c.kw}>return</span> <span className={c.punc}>(</span>
                  {'\n'}    <span className={c.punc}>&lt;</span><span className={c.tag}>RabitProvider</span>{' '}
                  config<span className={c.punc}>={'{{'}</span> projectId<span className={c.punc}>,</span> apiKey <span className={c.punc}>{'}}'}</span><span className={c.punc}>&gt;</span>
                  {'\n'}      <span className={c.punc}>&lt;</span><span className={c.tag}>WalletButton</span> <span className={c.punc}>/&gt;</span>
                  {'\n'}    <span className={c.punc}>&lt;/</span><span className={c.tag}>RabitProvider</span><span className={c.punc}>&gt;</span>
                  {'\n'}  <span className={c.punc}>)</span>
                  {'\n'}<span className={c.punc}>{'}'}</span>
                  {'\n\n'}
                  <span className={c.cmt}>// anywhere inside the provider</span>
                  {'\n'}<span className={c.kw}>const</span> <span className={c.punc}>{'{'}</span> address<span className={c.punc}>,</span> balances <span className={c.punc}>{'}'}</span> <span className={c.punc}>=</span>{' '}
                  <span className={c.fn}>useWallet</span><span className={c.punc}>()</span>
                </code>
              </pre>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  )
}
