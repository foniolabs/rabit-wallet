import { Check, X } from 'lucide-react'
import { Shell } from '@/components/dashboard/Shell'
import { getSession } from '@/lib/session'
import { updateProfileAction } from '@/app/auth-actions'

const ERRORS: Record<string, string> = {
  'invalid-name': 'Display name must be 1–80 characters.',
  'invalid-image': 'Profile image must be a valid http(s) URL.',
  'no-change': 'No changes to save.',
  'update-failed': 'Couldn’t save your changes. Please try again.',
}

export default function Settings({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string; reason?: string }
}) {
  const session = getSession()!
  const ok = searchParams.ok === '1'
  const error = searchParams.error
  const reason = searchParams.reason

  return (
    <Shell title="Settings">
      <div className="max-w-2xl space-y-6">
        {ok && <Banner tone="success">Profile updated.</Banner>}
        {error && (
          <Banner tone="error">
            {ERRORS[error] || 'Something went wrong.'}
            {reason && (
              <span className="mt-1 block text-xs opacity-70">{reason}</span>
            )}
          </Banner>
        )}

        <section className="surface p-6">
          <h2 className="text-sm font-medium">Profile</h2>
          <p className="mt-1 text-xs text-fg-subtle">
            How you appear in the dashboard. Email is set by your sign-in method
            and can&apos;t be changed here.
          </p>

          <form action={updateProfileAction} className="mt-6 space-y-4">
            <Field
              label="Email"
              name="email"
              defaultValue={session.email}
              type="email"
              disabled
            />
            <Field
              label="Display name"
              name="displayName"
              defaultValue={session.name}
              placeholder="Your name"
              required
              maxLength={80}
            />
            <Field
              label="Profile image URL"
              name="profileImage"
              defaultValue={session.profileImage || ''}
              placeholder="https://…"
              type="url"
              maxLength={500}
            />
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Save changes
              </button>
            </div>
          </form>
        </section>

        <section className="surface p-6">
          <h2 className="text-sm font-medium">Danger zone</h2>
          <p className="mt-1 text-xs text-fg-subtle">
            Deleting your organization is permanent and cannot be undone.
          </p>
          <button
            disabled
            className="mt-4 cursor-not-allowed rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-sm font-medium text-rose-400 opacity-60"
          >
            Delete organization
          </button>
          <p className="mt-2 text-xs text-fg-subtle">
            Not yet wired — contact support to delete an organization.
          </p>
        </section>
      </div>
    </Shell>
  )
}

function Field({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-subtle">
        {label}
      </span>
      <input
        className="w-full rounded-lg border border-border bg-bg-subtle px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
        {...rest}
      />
    </label>
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
