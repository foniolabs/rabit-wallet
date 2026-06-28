'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { Container, Section, SectionLabel } from '@/components/ui/Container'
import { cn } from '@/lib/cn'

type Tab = 'install' | 'provider' | 'connect' | 'send'

const tabs: { id: Tab; label: string; filename: string }[] = [
  { id: 'install', label: 'Install', filename: 'terminal' },
  { id: 'provider', label: 'Wrap your app', filename: 'app/layout.tsx' },
  { id: 'connect', label: 'Connect a wallet', filename: 'app/page.tsx' },
  { id: 'send', label: 'Send a tx', filename: 'components/send.tsx' },
]

const snippets: Record<Tab, { language: string; raw: string; node: React.ReactNode }> = {
  install: {
    language: 'bash',
    raw: `# Add to an existing app
npm i @rabit/react @rabit/core

# Or scaffold a new one
npm create rabit-app@latest my-app`,
    node: (
      <>
        <div className="text-fg-subtle"># Add to an existing app</div>
        <div>
          <span className="text-violet-300">npm</span>{' '}
          <span className="text-fg">i @rabit/react @rabit/core</span>
        </div>
        <div>&nbsp;</div>
        <div className="text-fg-subtle"># Or scaffold a new one</div>
        <div>
          <span className="text-violet-300">npm</span>{' '}
          <span className="text-fg">create rabit-app@latest my-app</span>
        </div>
      </>
    ),
  },
  provider: {
    language: 'tsx',
    raw: `import { RabitProvider } from '@rabit/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RabitProvider apiKey={process.env.NEXT_PUBLIC_RABIT_KEY!}>
          {children}
        </RabitProvider>
      </body>
    </html>
  )
}`,
    node: (
      <>
        <Line>
          <K>import</K> {'{ RabitProvider }'} <K>from</K> <S>&apos;@rabit/react&apos;</S>
        </Line>
        <Line />
        <Line>
          <K>export default function</K> <Fn>RootLayout</Fn>({'{ children }'}: {'{ children: React.ReactNode }'})
          {' {'}
        </Line>
        <Line indent={1}><K>return</K> (</Line>
        <Line indent={2}>{'<'}<T>html</T> <Attr>lang</Attr>=<S>&quot;en&quot;</S>{'>'}</Line>
        <Line indent={3}>{'<'}<T>body</T>{'>'}</Line>
        <Line indent={4}>
          {'<'}<T>RabitProvider</T> <Attr>apiKey</Attr>={'{'}<span className="text-fg">process.env.NEXT_PUBLIC_RABIT_KEY!</span>{'}'}{'>'}
        </Line>
        <Line indent={5}>{'{'}<span className="text-fg">children</span>{'}'}</Line>
        <Line indent={4}>{'</'}<T>RabitProvider</T>{'>'}</Line>
        <Line indent={3}>{'</'}<T>body</T>{'>'}</Line>
        <Line indent={2}>{'</'}<T>html</T>{'>'}</Line>
        <Line indent={1}>)</Line>
        <Line>{'}'}</Line>
      </>
    ),
  },
  connect: {
    language: 'tsx',
    raw: `'use client'
import { ConnectButton, useAccount } from '@rabit/react'

export default function Home() {
  const { address, isConnected } = useAccount()

  return (
    <main>
      <ConnectButton />
      {isConnected && <p>Connected as {address}</p>}
    </main>
  )
}`,
    node: (
      <>
        <Line><S>&apos;use client&apos;</S></Line>
        <Line>
          <K>import</K> {'{ ConnectButton, useAccount }'} <K>from</K> <S>&apos;@rabit/react&apos;</S>
        </Line>
        <Line />
        <Line><K>export default function</K> <Fn>Home</Fn>() {'{'}</Line>
        <Line indent={1}>
          <K>const</K> {'{ address, isConnected }'} = <Fn>useAccount</Fn>()
        </Line>
        <Line />
        <Line indent={1}><K>return</K> (</Line>
        <Line indent={2}>{'<'}<T>main</T>{'>'}</Line>
        <Line indent={3}>{'<'}<T>ConnectButton</T> {'/>'}</Line>
        <Line indent={3}>
          {'{'}<span className="text-fg">isConnected</span> &amp;&amp; {'<'}<T>p</T>{'>'}Connected as {'{'}<span className="text-fg">address</span>{'}'}{'</'}<T>p</T>{'>'}{'}'}
        </Line>
        <Line indent={2}>{'</'}<T>main</T>{'>'}</Line>
        <Line indent={1}>)</Line>
        <Line>{'}'}</Line>
      </>
    ),
  },
  send: {
    language: 'tsx',
    raw: `'use client'
import { useSendTransaction } from '@rabit/react'
import { parseEther } from 'viem'

export function Send() {
  const { sendTransaction, isPending } = useSendTransaction()

  return (
    <button
      onClick={() =>
        sendTransaction({
          to: '0x…',
          value: parseEther('0.01'),
        })
      }
      disabled={isPending}
    >
      Send 0.01 ETH
    </button>
  )
}`,
    node: (
      <>
        <Line><S>&apos;use client&apos;</S></Line>
        <Line>
          <K>import</K> {'{ useSendTransaction }'} <K>from</K> <S>&apos;@rabit/react&apos;</S>
        </Line>
        <Line>
          <K>import</K> {'{ parseEther }'} <K>from</K> <S>&apos;viem&apos;</S>
        </Line>
        <Line />
        <Line><K>export function</K> <Fn>Send</Fn>() {'{'}</Line>
        <Line indent={1}>
          <K>const</K> {'{ sendTransaction, isPending }'} = <Fn>useSendTransaction</Fn>()
        </Line>
        <Line />
        <Line indent={1}><K>return</K> (</Line>
        <Line indent={2}>{'<'}<T>button</T></Line>
        <Line indent={3}><Attr>onClick</Attr>={'{() =>'}</Line>
        <Line indent={4}><Fn>sendTransaction</Fn>({'{'}</Line>
        <Line indent={5}><Attr>to</Attr>: <S>&apos;0x…&apos;</S>,</Line>
        <Line indent={5}><Attr>value</Attr>: <Fn>parseEther</Fn>(<S>&apos;0.01&apos;</S>),</Line>
        <Line indent={4}>{'})'}</Line>
        <Line indent={3}>{'}'}</Line>
        <Line indent={3}><Attr>disabled</Attr>={'{'}<span className="text-fg">isPending</span>{'}'}</Line>
        <Line indent={2}>{'>'}</Line>
        <Line indent={3}>Send 0.01 ETH</Line>
        <Line indent={2}>{'</'}<T>button</T>{'>'}</Line>
        <Line indent={1}>)</Line>
        <Line>{'}'}</Line>
      </>
    ),
  },
}

export function CodeShowcase() {
  const [active, setActive] = useState<Tab>('provider')
  const current = snippets[active]
  const filename = tabs.find((t) => t.id === active)?.filename

  return (
    <Section id="install" className="relative">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Developer experience</SectionLabel>
          <h2 className="mt-5 text-display-lg font-semibold tracking-tight gradient-text">
            Four lines to a working wallet.
          </h2>
          <p className="mt-5 text-lg text-fg-muted">
            A first-class TypeScript API. Hooks for state, components for UI, primitives
            when you need them.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-12 max-w-3xl"
        >
          <div className="mb-3 flex flex-wrap gap-1.5 rounded-full border border-border bg-bg-subtle/60 p-1 backdrop-blur w-fit mx-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all',
                  active === t.id
                    ? 'bg-bg-raised text-fg shadow-sm'
                    : 'text-fg-muted hover:text-fg',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <CodeBlock filename={filename} language={current.language} raw={current.raw}>
            {current.node}
          </CodeBlock>
        </motion.div>
      </Container>
    </Section>
  )
}

/* tiny syntax helpers — keeps the JSX above readable */
function K({ children }: { children: React.ReactNode }) {
  return <span className="text-violet-300">{children}</span>
}
function S({ children }: { children: React.ReactNode }) {
  return <span className="text-emerald-300">{children}</span>
}
function T({ children }: { children: React.ReactNode }) {
  return <span className="text-pink-300">{children}</span>
}
function Attr({ children }: { children: React.ReactNode }) {
  return <span className="text-amber-300">{children}</span>
}
function Fn({ children }: { children: React.ReactNode }) {
  return <span className="text-sky-300">{children}</span>
}
function Line({ children, indent = 0 }: { children?: React.ReactNode; indent?: number }) {
  return (
    <div className="text-fg-muted" style={{ paddingLeft: `${indent * 0.9}rem` }}>
      {children ?? ' '}
    </div>
  )
}
