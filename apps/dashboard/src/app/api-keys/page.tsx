import Link from 'next/link'
import { Check, KeyRound, Plus, X } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { Shell } from '@/components/dashboard/Shell'
import {
  createApiKeyAction,
  listApiKeys,
  listProjects,
  revokeApiKeyAction,
} from '@/app/admin-actions'
import { CopyKeyOnce } from '@/components/dashboard/CopyKeyOnce'

const ERRORS: Record<string, string> = {
  'invalid-input': 'Name is required.',
  'create-failed': 'Couldn’t create the key.',
  'revoke-failed': 'Couldn’t revoke the key.',
}

export default async function ApiKeys({
  searchParams,
}: {
  searchParams: {
    projectId?: string
    newKey?: string
    newKeyName?: string
    ok?: string
    error?: string
    reason?: string
  }
}) {
  const projects = await listProjects()
  const selectedProjectId =
    (searchParams.projectId &&
      projects.find((p) => p.id === searchParams.projectId)?.id) ||
    projects[0]?.id ||
    ''

  const keys = selectedProjectId ? await listApiKeys(selectedProjectId) : []
  const newKey = searchParams.newKey
  const newKeyName = searchParams.newKeyName
  const ok = searchParams.ok
  const error = searchParams.error
  const reason = searchParams.reason

  if (projects.length === 0) {
    return (
      <Shell title="API Keys">
        <div className="surface grid place-items-center px-6 py-16 text-center">
          <KeyRound size={28} className="text-fg-subtle" />
          <p className="mt-4 text-sm font-medium text-fg">No projects yet.</p>
          <p className="mt-1 text-xs text-fg-subtle">
            <Link href="/projects" className="underline hover:text-fg">
              Create a project
            </Link>{' '}
            first to mint API keys.
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title="API Keys">
      <div className="space-y-6">
        {newKey && newKeyName && <CopyKeyOnce name={newKeyName} fullKey={newKey} />}
        {ok === 'revoked' && <Banner tone="success">Key revoked.</Banner>}
        {error && (
          <Banner tone="error">
            {ERRORS[error] || 'Something went wrong.'}
            {reason && (
              <span className="mt-1 block text-xs opacity-70">{reason}</span>
            )}
          </Banner>
        )}

        <section className="surface p-6">
          <h2 className="text-sm font-medium">Project</h2>
          <p className="mt-1 text-xs text-fg-subtle">
            Keys are scoped to a single project.
          </p>
          <form className="mt-4 flex flex-wrap gap-2" method="get">
            {projects.map((p) => (
              <button
                key={p.id}
                type="submit"
                name="projectId"
                value={p.id}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  p.id === selectedProjectId
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border bg-bg-subtle text-fg-muted hover:border-border-strong hover:text-fg'
                }`}
              >
                {p.name}
              </button>
            ))}
          </form>
        </section>

        <section className="surface p-6">
          <h2 className="text-sm font-medium">Create key</h2>
          <p className="mt-1 text-xs text-fg-subtle">
            We&apos;ll show the secret once — copy it now, you won&apos;t see it again.
          </p>
          <form
            action={createApiKeyAction}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <input type="hidden" name="projectId" value={selectedProjectId} />
            <label className="block flex-1">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-subtle">
                Name
              </span>
              <input
                name="name"
                required
                maxLength={80}
                placeholder="Production"
                className="w-full rounded-lg border border-border bg-bg-subtle px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-subtle">
                Environment
              </span>
              <select
                name="environment"
                defaultValue="production"
                className="rounded-lg border border-border bg-bg-subtle px-3.5 py-2.5 text-sm text-fg focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus size={14} />
              Create key
            </button>
          </form>
        </section>

        <section className="surface overflow-hidden">
          <header className="flex items-center justify-between px-5 py-4">
            <h2 className="text-sm font-medium">Keys</h2>
            <span className="text-xs text-fg-subtle">{keys.length} total</span>
          </header>
          {keys.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-fg-subtle">No keys yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-bg-raised/40">
                <tr className="text-left text-xs uppercase tracking-wider text-fg-subtle">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Prefix</th>
                  <th className="px-5 py-3 font-medium">Env</th>
                  <th className="px-5 py-3 font-medium">Last used</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map((k) => (
                  <tr
                    key={k.id}
                    className={`transition-colors ${
                      k.revokedAt ? 'opacity-60' : 'hover:bg-bg-raised/30'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium text-fg">{k.name}</td>
                    <td className="px-5 py-3.5">
                      <code className="rounded-md border border-border bg-bg-raised px-2 py-0.5 font-mono text-xs text-fg-muted">
                        {k.prefix}…
                      </code>
                    </td>
                    <td className="px-5 py-3.5 text-fg-muted capitalize">{k.environment}</td>
                    <td className="px-5 py-3.5 text-fg-subtle">
                      {k.lastUsedAt
                        ? formatDistanceToNow(new Date(k.lastUsedAt), { addSuffix: true })
                        : 'Never'}
                    </td>
                    <td className="px-5 py-3.5 text-fg-subtle">
                      {format(new Date(k.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-3.5">
                      {k.revokedAt ? (
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-300">
                          Revoked
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {!k.revokedAt && (
                        <form action={revokeApiKeyAction}>
                          <input type="hidden" name="projectId" value={selectedProjectId} />
                          <input type="hidden" name="keyId" value={k.id} />
                          <button
                            type="submit"
                            aria-label={`Revoke ${k.name}`}
                            className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                          >
                            <X size={14} />
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </Shell>
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
