import { cn } from '@/lib/cn'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-hover shadow-[0_4px_16px_-4px_rgba(255,122,26,0.5)]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 4c0 4 1.5 6 3 8s4 4 4 4-1-3-1-5 1-4 3-5 4-2 4-2-1 5-3 8-5 6-5 6-2-2-3-6-2-8-2-8z"
            fill="white"
            opacity="0.95"
          />
        </svg>
      </span>
      <span className="text-[17px] font-semibold tracking-tight">Rabit</span>
    </div>
  )
}
