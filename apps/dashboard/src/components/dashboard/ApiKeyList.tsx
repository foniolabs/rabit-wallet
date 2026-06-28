'use client'

import { Check, Copy, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export type ApiKey = {
  id: string
  name: string
  value: string
  created: string
  lastUsed: string
}

export function ApiKeyList({ keys }: { keys: ApiKey[] }) {
  const [reveal, setReveal] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(id)
      setTimeout(() => setCopied(null), 1500)
    } catch {}
  }

  return (
    <div className="surface divide-y divide-border">
      {keys.map((k) => (
        <div key={k.id} className="flex items-center justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-fg">{k.name}</p>
            <p className="text-xs text-fg-subtle">
              Created {k.created} · Last used {k.lastUsed}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="rounded-md border border-border bg-bg-raised px-3 py-1.5 font-mono text-xs text-fg-muted">
              {reveal[k.id] ? k.value : k.value.slice(0, 8) + '••••••••••••••'}
            </code>
            <button
              onClick={() => setReveal((s) => ({ ...s, [k.id]: !s[k.id] }))}
              aria-label="Reveal"
              className="grid h-8 w-8 place-items-center rounded-md text-fg-muted transition-colors hover:bg-bg-raised hover:text-fg"
            >
              {reveal[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={() => copy(k.id, k.value)}
              aria-label="Copy"
              className="grid h-8 w-8 place-items-center rounded-md text-fg-muted transition-colors hover:bg-bg-raised hover:text-fg"
            >
              {copied === k.id ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
