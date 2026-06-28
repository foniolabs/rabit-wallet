import { cn } from '@/lib/cn'

export function Logo({ className, label = 'Rabit' }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-hover text-white text-xs font-bold">
        R
      </span>
      <span className="text-[15px] font-semibold tracking-tight">{label}</span>
    </div>
  )
}
