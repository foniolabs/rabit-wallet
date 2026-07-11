'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'

export function CopyableCommand({
  command,
  className,
}: {
  command: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable — silently no-op */
    }
  }

  return (
    <button
      onClick={copy}
      aria-label={`Copy command: ${command}`}
      className={cn(
        'group inline-flex h-[52px] items-center gap-3 rounded-full border border-line-strong bg-card pl-5 pr-2 font-mono text-[13.5px] text-ink-muted shadow-soft transition-all hover:border-accent/40',
        className,
      )}
    >
      <span className="select-none text-accent">$</span>
      <span className="text-ink">{command}</span>
      <span
        className={cn(
          'ml-1 grid h-9 w-9 place-items-center rounded-full bg-paper transition-colors',
          copied ? 'text-accent' : 'text-ink-subtle group-hover:text-ink',
        )}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </span>
    </button>
  )
}
