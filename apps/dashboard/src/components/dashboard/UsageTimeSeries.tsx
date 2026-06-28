'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format } from 'date-fns'
import type { UsagePoint } from '@/app/admin-actions'

export function UsageTimeSeries({
  series,
  bucket,
}: {
  series: UsagePoint[]
  bucket: 'hour' | 'day'
}) {
  if (series.length === 0) {
    return (
      <div className="grid h-56 place-items-center text-sm text-fg-subtle">
        No traffic in this window yet.
      </div>
    )
  }

  const data = series.map((p) => ({
    label: format(new Date(p.bucket), bucket === 'hour' ? 'HH:mm' : 'MMM d'),
    requests: p.requests,
    errors: p.errors,
    avgMs: p.avgMs,
  }))

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF7A1A" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#FF7A1A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#71717A', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fill: '#71717A', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: '#0E0E12',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              color: '#FAFAFA',
              fontSize: 12,
            }}
            cursor={{ stroke: 'rgba(255,255,255,0.08)' }}
          />
          <Area
            type="monotone"
            dataKey="requests"
            stroke="#FF7A1A"
            strokeWidth={2}
            fill="url(#reqGrad)"
          />
          <Area
            type="monotone"
            dataKey="errors"
            stroke="#f43f5e"
            strokeWidth={1.5}
            fill="url(#errGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
