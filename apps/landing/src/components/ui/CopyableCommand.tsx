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
        'group inline-flex h-11 items-center gap-3 rounded-full border border-border-strong bg-bg-raised/70 pl-5 pr-2 font-mono text-[13px] text-fg-muted backdrop-blur transition-all hover:border-accent/40 hover:text-fg',
        className,
      )}
    >
      <span className="text-fg-subtle select-none">$</span>
      <span className="text-fg">{command}</span>
      <span
        className={cn(
          'ml-2 grid h-7 w-7 place-items-center rounded-full bg-bg/80 transition-colors',
          copied ? 'text-accent' : 'text-fg-muted group-hover:text-fg',
        )}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </span>
    </button>
  )
}
