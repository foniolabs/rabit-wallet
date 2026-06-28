'use client'

import { Check, Copy } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CodeBlockProps {
  filename?: string
  language?: string
  children: ReactNode
  raw: string
  className?: string
}

export function CodeBlock({ filename, language = 'tsx', children, raw, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(raw)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {}
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-bg-subtle/80 shadow-2xl shadow-black/40 backdrop-blur',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-bg-raised/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-fg-subtle/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-fg-subtle/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-fg-subtle/30" />
          {filename && (
            <span className="ml-3 font-mono text-xs text-fg-muted">{filename}</span>
          )}
        </div>
        <button
          onClick={copy}
          aria-label="Copy code"
          className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-bg/60 hover:text-fg"
        >
          {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed">
        <code className={`language-${language} font-mono`}>{children}</code>
      </pre>
    </div>
  )
}
