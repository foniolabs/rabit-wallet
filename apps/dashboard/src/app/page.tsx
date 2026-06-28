import Link from 'next/link'
import { ArrowUpRight, FolderKanban, KeyRound, Users, Wallet } from 'lucide-react'
import { format } from 'date-fns'
import { Shell } from '@/components/dashboard/Shell'
import { StatCard } from '@/components/dashboard/StatCard'
import { listProjects } from '@/app/admin-actions'

export default async function Overview() {
  const projects = await listProjects()
  const totalWallets = projects.reduce((sum, p) => sum + p.userCount, 0)
  const totalActiveKeys = projects.reduce((sum, p) => sum + p.keyCount, 0)
  const recent = projects.slice(0, 5)

  return (
    <Shell title="Overview">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Projects"
            value={projects.length.toLocaleString()}
            icon={FolderKanban}
          />
          <StatCard
            label="Wallets"
            value={totalWallets.toLocaleString()}
            icon={Wallet}
          />
          <StatCard
            label="Active keys"
            value={totalActiveKeys.toLocaleString()}
            icon={KeyRound}
          />
          <StatCard label="Plan" value="Free" icon={Users} />
        </div>

        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="surface p-5">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Recent projects</h3>
                <p className="text-xs text-fg-subtle">Your most recently updated projects</p>
              </div>
              <Link
                href="/projects"
                className="inline-flex items-center gap-1 text-xs text-fg-muted transition-colors hover:text-fg"
              >
                View all <ArrowUpRight size={12} />
              </Link>
            </header>
            <ul className="divide-y divide-border">
              {recent.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{p.name}</p>
                    <p className="truncate text-xs text-fg-subtle">
                      {p.userCount.toLocaleString()} wallet{p.userCount === 1 ? '' : 's'} ·{' '}
                      {p.keyCount} active key{p.keyCount === 1 ? '' : 's'} · created{' '}
                      {format(new Date(p.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Link
                    href={`/api-keys?projectId=${p.id}`}
                    className="ml-4 shrink-0 rounded-md border border-border bg-bg-subtle px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                  >
                    Manage
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Shell>
  )
}

function EmptyState() {
  return (
    <div className="surface grid place-items-center px-6 py-16 text-center">
      <FolderKanban size={28} className="text-fg-subtle" />
      <p className="mt-4 text-sm font-medium text-fg">No projects yet.</p>
      <p className="mt-1 text-xs text-fg-subtle">
        <Link href="/projects" className="underline hover:text-fg">
          Create your first project
        </Link>{' '}
        to get an API key and start building.
      </p>
    </div>
  )
}
