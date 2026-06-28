import Link from 'next/link'
import { Check, KeyRound, Plus, Users, X } from 'lucide-react'
import { Shell } from '@/components/dashboard/Shell'
import { format } from 'date-fns'
import {
  createProjectAction,
  deleteProjectAction,
  listProjects,
} from '@/app/admin-actions'

const ERRORS: Record<string, string> = {
  'name-required': 'Project name is required.',
  'create-failed': 'Couldn’t create the project.',
  'delete-failed': 'Couldn’t delete the project.',
}

export default async function Projects({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string; reason?: string }
}) {
  const projects = await listProjects()
  const ok = searchParams.ok
  const error = searchParams.error
  const reason = searchParams.reason

  return (
    <Shell title="Projects">
      <div className="space-y-6">
        {ok === 'deleted' && <Banner tone="success">Project deleted.</Banner>}
        {error && (
          <Banner tone="error">
            {ERRORS[error] || 'Something went wrong.'}
            {reason && (
              <span className="mt-1 block text-xs opacity-70">{reason}</span>
            )}
          </Banner>
        )}

        <section className="surface p-6">
          <h2 className="text-sm font-medium">Create project</h2>
          <p className="mt-1 text-xs text-fg-subtle">
            We’ll mint a default API key alongside your new project.
          </p>
          <form
            action={createProjectAction}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <label className="block flex-1">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-subtle">
                Name
              </span>
              <input
                name="name"
                required
                maxLength={80}
                placeholder="my-app"
                className="w-full rounded-lg border border-border bg-bg-subtle px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus size={14} />
              Create project
            </button>
          </form>
        </section>

        {projects.length === 0 ? (
          <EmptyProjects />
        ) : (
          <section className="surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-raised/40">
                <tr className="text-left text-xs uppercase tracking-wider text-fg-subtle">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Tier</th>
                  <th className="px-5 py-3 font-medium">Wallets</th>
                  <th className="px-5 py-3 font-medium">Keys</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-bg-raised/30">
                    <td className="px-5 py-4 font-medium text-fg">{p.name}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-border bg-bg-raised px-2 py-0.5 text-xs text-fg-muted">
                        {p.tier}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-fg-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Users size={12} className="text-fg-subtle" />
                        {p.userCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-fg-muted">
                      <Link
                        href={`/api-keys?projectId=${p.id}`}
                        className="inline-flex items-center gap-1.5 hover:text-fg"
                      >
                        <KeyRound size={12} className="text-fg-subtle" />
                        {p.keyCount}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-fg-subtle">
                      {format(new Date(p.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <form action={deleteProjectAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          aria-label={`Delete ${p.name}`}
                          className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </Shell>
  )
}

function EmptyProjects() {
  return (
    <div className="surface grid place-items-center px-6 py-16 text-center">
      <KeyRound size={28} className="text-fg-subtle" />
      <p className="mt-4 text-sm font-medium text-fg">No projects yet.</p>
      <p className="mt-1 text-xs text-fg-subtle">
        Create a project above to get your first API key.
      </p>
    </div>
  )
}

function Banner({
  tone,
  children,
}: {
  tone: 'success' | 'error'
  children: React.ReactNode
}) {
  const palette =
    tone === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
  const Icon = tone === 'success' ? Check : X
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm ${palette}`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
