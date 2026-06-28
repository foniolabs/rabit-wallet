import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('container mx-auto', className)} {...props} />
}

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('py-20 sm:py-28', className)} {...props} />
}

export function SectionLabel({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-bg-subtle/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-fg-muted',
        className,
      )}
      {...props}
    />
  )
}
