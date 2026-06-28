'use client'

import { Check, Copy, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export function CopyKeyOnce({ name, fullKey }: { name: string; fullKey: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-200">Copy your new key now</p>
          <p className="mt-1 text-xs text-amber-200/70">
            <span className="font-medium text-amber-200">{name}</span> — this is the
            only time we&apos;ll show the full secret. We store only a hash.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="flex-1 break-all rounded-md border border-amber-500/30 bg-bg-raised/60 px-3 py-2 font-mono text-xs text-fg">
              {fullKey}
            </code>
            <button
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
