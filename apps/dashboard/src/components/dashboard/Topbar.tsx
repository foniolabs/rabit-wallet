import { Bell, Search } from 'lucide-react'
import { getSession } from '@/lib/session'
import { UserMenu } from './UserMenu'

export function Topbar({ title }: { title: string }) {
  const session = getSession()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-bg/60 px-6 backdrop-blur">
      <h1 className="text-[15px] font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 py-1.5 text-sm text-fg-muted md:flex">
          <Search size={14} />
          <span>Search…</span>
          <kbd className="ml-2 rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">
            ⌘K
          </kbd>
        </div>
        <button
          aria-label="Notifications"
          className="grid h-9 w-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-bg-raised hover:text-fg"
        >
          <Bell size={16} />
        </button>
        {session && <UserMenu name={session.name} email={session.email} />}
      </div>
    </header>
  )
}
