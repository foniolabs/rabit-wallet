'use client'

import { useState, type CSSProperties } from 'react'
import { Mail, ArrowUpRight, Repeat, Clock, Plus, Power, Check } from 'lucide-react'
import { ChainIcon, GoogleIcon } from './ChainIcon'

type Auth = { email: boolean; google: boolean }
type State = 'signin' | 'wallet'

const ACCENTS = ['#295B4F', '#569F8C', '#E85D04', '#7A6CF0', '#2775CA', '#111111']
const RADII = { small: 10, medium: 16, large: 24 } as const
type Radius = keyof typeof RADII

// The networks the SDK actually ships (PRESET_EVM_CHAINS + Solana).
const NETWORKS = [
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'base', label: 'Base' },
  { id: 'arbitrum', label: 'Arbitrum' },
  { id: 'optimism', label: 'Optimism' },
  { id: 'polygon', label: 'Polygon' },
  { id: 'solana', label: 'Solana' },
]

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
      style={{ background: on ? 'var(--acc)' : 'rgba(255,255,255,0.14)' }}
      aria-pressed={on}
    >
      <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: on ? 22 : 2 }} />
    </button>
  )
}

function AuthRow({ icon, label, on, onToggle }: { icon: React.ReactNode; label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="grid h-7 w-7 place-items-center">{icon}</span>
      <span className="text-[14.5px] text-white/90">{label}</span>
      <span className="ml-auto">
        <Toggle on={on} onClick={onToggle} />
      </span>
    </div>
  )
}

/* ---------- preview: the embedded wallet as it appears in a dApp ---------- */

function SignInPreview({ auth, radius, accent }: { auth: Auth; radius: number; accent: string }) {
  return (
    <div className="w-full max-w-[360px] bg-[#101614] p-6 shadow-2xl" style={{ borderRadius: radius + 6 }}>
      <div className="mb-5 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-[10px] text-[13px] font-bold text-white" style={{ background: accent }}>R</span>
        <span className="text-[15px] font-semibold text-white">Sign in to My dApp</span>
      </div>
      {auth.email && (
        <>
          <div className="mb-1.5 text-[13px] text-white/50">Email</div>
          <div className="flex h-11 items-center rounded-xl border border-white/12 bg-black/30 px-3.5 text-[14px] text-white/85" style={{ borderRadius: radius }}>
            you@example.com
          </div>
          <button className="mt-3 flex h-11 w-full items-center justify-center gap-2 text-[14px] font-medium text-white" style={{ background: accent, borderRadius: radius }}>
            <Mail size={16} /> Continue with email
          </button>
        </>
      )}
      {auth.email && auth.google && (
        <div className="my-4 flex items-center gap-3 text-[12px] text-white/40">
          <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
        </div>
      )}
      {auth.google && (
        <button className="flex h-11 w-full items-center justify-center gap-2.5 border border-white/12 bg-white/[0.04] text-[14px] font-medium text-white/90" style={{ borderRadius: radius }}>
          <GoogleIcon size={17} /> Continue with Google
        </button>
      )}
      <p className="mt-5 text-center text-[11.5px] text-white/30">Non-custodial · no seed phrase · secured by Rabit</p>
    </div>
  )
}

function WalletPreview({ networks, radius, accent }: { networks: Record<string, boolean>; radius: number; accent: string }) {
  const rows = [
    { icon: <Plus size={17} />, label: 'Fund wallet' },
    { icon: <Repeat size={17} />, label: 'Swap' },
    { icon: <ArrowUpRight size={17} />, label: 'Send' },
    { icon: <Clock size={17} />, label: 'Activity' },
  ]
  const active = NETWORKS.filter((n) => networks[n.id])
  return (
    <div className="w-full max-w-[360px] bg-[#101614] p-6 shadow-2xl" style={{ borderRadius: radius + 6 }}>
      <div className="flex flex-col items-center">
        <div className="relative h-20 w-20 rounded-full" style={{ background: accent, boxShadow: `0 0 40px -6px ${accent}` }}>
          <span className="absolute left-3 top-2.5 h-7 w-7 rounded-full bg-white/45" />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-[#4FD1A6]" />
          <span className="font-mono text-[13px] text-white/70">0x8f2c…a91e</span>
        </div>
        <div className="mt-4 text-[40px] font-extrabold tracking-tight text-white">$4,182<span className="text-white/40">.90</span></div>
      </div>
      <div className="mt-5 space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 px-2 py-2.5" style={{ borderRadius: radius }}>
            <span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${accent} 22%, transparent)`, color: accent }}>{r.icon}</span>
            <span className="text-[15px] font-medium text-white/90">{r.label}</span>
            <span className="ml-auto text-white/25">›</span>
          </div>
        ))}
        <div className="flex items-center gap-3 px-2 py-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FF6B6B]/15 text-[#FF6B6B]"><Power size={17} /></span>
          <span className="text-[15px] font-medium text-[#FF6B6B]">Disconnect</span>
        </div>
      </div>
      {active.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {active.map((n) => (
            <ChainIcon key={n.id} id={n.id} size={26} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- the playground ---------- */

export function Playground() {
  const [auth, setAuth] = useState<Auth>({ email: true, google: true })
  const [networks, setNetworks] = useState<Record<string, boolean>>({ ethereum: true, base: true, solana: true, arbitrum: false, optimism: false, polygon: false })
  const [accent, setAccent] = useState(ACCENTS[1])
  const [radius, setRadius] = useState<Radius>('medium')
  const [state, setState] = useState<State>('signin')

  return (
    <div className="min-h-screen bg-[#0A0F0D] text-white" style={{ '--acc': accent } as CSSProperties}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 lg:flex-row lg:py-14">
        {/* config panel */}
        <aside className="w-full shrink-0 lg:w-[340px]">
          <div className="mb-1 text-[22px] font-bold tracking-tight">Rabit Playground</div>
          <p className="mb-6 text-[14px] text-white/50">See how the embedded wallet looks in your dApp — tweak the sign-in, networks, and theme live.</p>

          <div className="mb-6">
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/40">Sign-in methods</div>
            <div className="space-y-2">
              <AuthRow icon={<Mail size={17} className="text-white/70" />} label="Email" on={auth.email} onToggle={() => setAuth((a) => ({ ...a, email: !a.email }))} />
              <AuthRow icon={<GoogleIcon size={18} />} label="Google" on={auth.google} onToggle={() => setAuth((a) => ({ ...a, google: !a.google }))} />
            </div>
            <p className="mt-2 text-[12px] text-white/30">Embedded &amp; non-custodial — no browser extension or external wallet.</p>
          </div>

          <div className="mb-6">
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/40">Networks</div>
            <div className="grid grid-cols-2 gap-2">
              {NETWORKS.map((n) => {
                const on = networks[n.id]
                return (
                  <button
                    key={n.id}
                    onClick={() => setNetworks((s) => ({ ...s, [n.id]: !s[n.id] }))}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[14px] transition-colors"
                    style={{ borderColor: on ? 'var(--acc)' : 'rgba(255,255,255,0.1)', background: on ? 'color-mix(in srgb, var(--acc) 12%, transparent)' : 'rgba(255,255,255,0.03)' }}
                  >
                    <ChainIcon id={n.id} size={22} />
                    <span className="text-white/85">{n.label}</span>
                    {on && <Check size={14} className="ml-auto" style={{ color: 'var(--acc)' }} />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/40">Accent</div>
            <div className="flex gap-2.5">
              {ACCENTS.map((c) => (
                <button key={c} onClick={() => setAccent(c)} className="h-8 w-8 rounded-full" style={{ background: c, boxShadow: accent === c ? `0 0 0 2px ${c}, 0 0 0 4px rgba(255,255,255,0.15)` : 'none' }} />
              ))}
            </div>
          </div>

          <div className="mb-2">
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/40">Corner radius</div>
            <div className="flex gap-2">
              {(Object.keys(RADII) as Radius[]).map((r) => (
                <button key={r} onClick={() => setRadius(r)} className="flex-1 rounded-lg border px-3 py-2 text-[13px] capitalize transition-colors" style={{ borderColor: radius === r ? 'var(--acc)' : 'rgba(255,255,255,0.1)', color: radius === r ? '#fff' : 'rgba(255,255,255,0.6)' }}>{r}</button>
              ))}
            </div>
          </div>
        </aside>

        {/* preview stage */}
        <main className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-[radial-gradient(circle_at_50%_0%,rgba(86,159,140,0.08),transparent_60%)] p-6 py-14">
          <div className="mb-8 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
            {(['signin', 'wallet'] as State[]).map((v) => (
              <button key={v} onClick={() => setState(v)} className="rounded-full px-4 py-1.5 text-[13.5px] font-medium capitalize transition-colors" style={{ background: state === v ? 'var(--acc)' : 'transparent', color: state === v ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                {v === 'signin' ? 'Sign in' : 'Wallet'}
              </button>
            ))}
          </div>
          {state === 'signin' ? <SignInPreview auth={auth} radius={RADII[radius]} accent={accent} /> : <WalletPreview networks={networks} radius={RADII[radius]} accent={accent} />}
        </main>
      </div>
    </div>
  )
}
