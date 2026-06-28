'use client'

import { ChevronDown, LogOut, Settings as SettingsIcon, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { signOutAction } from '@/app/auth-actions'

export function UserMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const initial = name.charAt(0).toUpperCase()

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-border bg-bg-subtle px-2.5 py-1.5 text-sm text-fg-muted transition-colors hover:bg-bg-raised hover:text-fg"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs font-bold text-white">
          {initial}
        </span>
        <span className="max-w-[120px] truncate">{name}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-bg-raised shadow-2xl shadow-black/40"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium text-fg">{name}</p>
            <p className="truncate text-xs text-fg-subtle">{email}</p>
          </div>
          <div className="p-1">
            <MenuLink href="/settings" icon={<User size={14} />} onClick={() => setOpen(false)}>
              Account
            </MenuLink>
            <MenuLink href="/settings" icon={<SettingsIcon size={14} />} onClick={() => setOpen(false)}>
              Settings
            </MenuLink>
          </div>
          <form action={signOutAction} className="border-t border-border p-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
    >
      {icon}
      {children}
    </Link>
  )
}
