import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  className,
}: {
  label: string
  value: string
  delta?: { value: string; positive?: boolean }
  icon?: LucideIcon
  className?: string
}) {
  return (
    <div className={cn('surface p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">{label}</p>
        {Icon && (
          <span className="grid h-7 w-7 place-items-center rounded-md bg-bg-raised text-fg-muted">
            <Icon size={14} />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      {delta && (
        <p
          className={cn(
            'mt-1 text-xs font-medium',
            delta.positive ? 'text-emerald-400' : 'text-rose-400',
          )}
        >
          {delta.positive ? '↑' : '↓'} {delta.value}
        </p>
      )}
    </div>
  )
}
