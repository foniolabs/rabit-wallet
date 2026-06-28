import Link from 'next/link'
import { Activity, AlertTriangle, BarChart3, Clock } from 'lucide-react'
import { Shell } from '@/components/dashboard/Shell'
import { StatCard } from '@/components/dashboard/StatCard'
import { UsageTimeSeries } from '@/components/dashboard/UsageTimeSeries'
import { getUsageReport } from '@/app/admin-actions'

const WINDOWS = [
  { key: '24h', label: 'Last 24h' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
] as const

type WindowKey = (typeof WINDOWS)[number]['key']

export default async function Usage({
  searchParams,
}: {
  searchParams: { window?: string }
}) {
  const windowKey: WindowKey = (() => {
    const w = searchParams.window
    return w === '24h' || w === '7d' || w === '30d' ? w : '7d'
  })()

  const report = await getUsageReport(windowKey)
  const errorRate =
    report.totals.requests > 0
      ? ((report.totals.errors / report.totals.requests) * 100).toFixed(2) + '%'
      : '—'

  return (
    <Shell title="Usage">
      <div className="space-y-6">
        <nav className="flex flex-wrap gap-1.5 rounded-full border border-border bg-bg-subtle/60 p-1 w-fit">
          {WINDOWS.map((w) => (
            <Link
              key={w.key}
              href={`/usage?window=${w.key}`}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                w.key === windowKey
                  ? 'bg-bg-raised text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              {w.label}
            </Link>
          ))}
        </nav>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Requests"
            value={report.totals.requests.toLocaleString()}
            icon={Activity}
          />
          <StatCard label="Error rate" value={errorRate} icon={AlertTriangle} />
          <StatCard
            label="Avg latency"
            value={report.totals.requests > 0 ? `${report.totals.avgMs} ms` : '—'}
            icon={Clock}
          />
          <StatCard
            label="Errors (4xx/5xx)"
            value={report.totals.errors.toLocaleString()}
            icon={BarChart3}
          />
        </div>

        <section className="surface p-5">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Requests over time</h3>
              <p className="text-xs text-fg-subtle">
                Bucketed by {report.bucket} · since{' '}
                {new Date(report.since).toLocaleString()}
              </p>
            </div>
            <span className="rounded-full border border-border bg-bg-raised px-2.5 py-0.5 text-xs text-fg-muted">
              Live
            </span>
          </header>
          <UsageTimeSeries series={report.series} bucket={report.bucket} />
        </section>

        <section className="surface p-5">
          <header className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium">Top routes</h3>
            <span className="text-xs text-fg-subtle">{report.topRoutes.length} of 6</span>
          </header>
          {report.topRoutes.length === 0 ? (
            <p className="text-sm text-fg-subtle">No requests in this window.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-fg-subtle">
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium">Route</th>
                  <th className="pb-2 text-right font-medium">Requests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.topRoutes.map((r) => (
                  <tr key={`${r.method} ${r.route}`}>
                    <td className="py-3">
                      <span className="rounded-md border border-border bg-bg-raised px-2 py-0.5 font-mono text-xs text-fg-muted">
                        {r.method}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-xs text-fg">{r.route}</td>
                    <td className="py-3 text-right font-mono text-fg-muted">
                      {r.requests.toLocaleString()}
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
