import { cn } from '@/lib/cn'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-ink text-paper shadow-soft">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 4c0 4 1.5 6 3 8s4 4 4 4-1-3-1-5 1-4 3-5 4-2 4-2-1 5-3 8-5 6-5 6-2-2-3-6-2-8-2-8z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="text-[18px] font-semibold tracking-tight text-ink">Rabit</span>
    </div>
  )
}
