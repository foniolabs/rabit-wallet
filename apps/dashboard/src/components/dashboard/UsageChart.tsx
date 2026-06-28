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

const data = Array.from({ length: 14 }).map((_, i) => ({
  day: `D${i + 1}`,
  signups: Math.round(40 + Math.random() * 80 + i * 6),
}))

export function UsageChart() {
  return (
    <div className="surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Active wallets</h3>
          <p className="text-xs text-fg-subtle">Last 14 days</p>
        </div>
        <span className="rounded-full border border-border bg-bg-raised px-2.5 py-0.5 text-xs text-fg-muted">
          Live
        </span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF7A1A" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#FF7A1A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#71717A', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#71717A', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
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
              dataKey="signups"
              stroke="#FF7A1A"
              strokeWidth={2}
              fill="url(#g1)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
