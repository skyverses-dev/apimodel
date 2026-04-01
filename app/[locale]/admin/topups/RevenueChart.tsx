'use client'

import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts'

interface ChartDataPoint {
  date: string
  vnd: number
  count: number
}

interface RevenueChartProps {
  /** All approved topups with date + vnd_amount + admin_note */
  topups: {
    vnd_amount: number
    credit_amount: number
    admin_note?: string
    created_at: string
    status: string
  }[]
}

type Period = '7d' | '30d' | '3m'

const periodConfig: Record<Period, { label: string; days: number }> = {
  '7d': { label: '7 ngày', days: 7 },
  '30d': { label: '30 ngày', days: 30 },
  '3m': { label: '3 tháng', days: 90 },
}

function formatVND(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toString()
}

function formatDate(dateStr: string, period: Period): string {
  const d = new Date(dateStr)
  if (period === '7d') return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' })
  if (period === '30d') return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-medium text-emerald-400">
        {payload[0].value.toLocaleString('vi-VN')}đ
      </p>
      <p className="text-xs text-slate-500">
        {payload[1]?.value || 0} giao dịch
      </p>
    </div>
  )
}

export default function RevenueChart({ topups }: RevenueChartProps) {
  const [period, setPeriod] = useState<Period>('7d')

  const { chartData, totalVnd, totalCount, autoCount } = useMemo(() => {
    const { days } = periodConfig[period]
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Filter approved topups within period
    const filtered = topups.filter(t => {
      const d = new Date(t.created_at)
      return t.status === 'approved' && d >= startDate && d <= now
    })

    // Group by date
    const dateMap = new Map<string, { vnd: number; count: number }>()

    // Pre-fill all dates
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().split('T')[0]
      dateMap.set(key, { vnd: 0, count: 0 })
    }

    filtered.forEach(t => {
      const key = new Date(t.created_at).toISOString().split('T')[0]
      const existing = dateMap.get(key) || { vnd: 0, count: 0 }
      dateMap.set(key, {
        vnd: existing.vnd + t.vnd_amount,
        count: existing.count + 1,
      })
    })

    const data: ChartDataPoint[] = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: formatDate(date, period),
        vnd: vals.vnd,
        count: vals.count,
      }))

    const autoFiltered = filtered.filter(t => t.admin_note?.includes('webhook'))

    return {
      chartData: data,
      totalVnd: filtered.reduce((sum, t) => sum + t.vnd_amount, 0),
      totalCount: filtered.length,
      autoCount: autoFiltered.length,
    }
  }, [topups, period])

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-semibold text-lg">Thống kê doanh thu</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Doanh thu từ topup đã duyệt
          </p>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {(Object.entries(periodConfig) as [Period, { label: string }][]).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                period === key
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-slate-500">Tổng doanh thu</p>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">
            {totalVnd.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-slate-500">Giao dịch</p>
          <p className="text-lg font-bold text-white mt-0.5">{totalCount}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-slate-500">Auto webhook</p>
          <p className="text-lg font-bold text-cyan-400 mt-0.5">
            {autoCount}
            {totalCount > 0 && (
              <span className="text-xs text-slate-500 font-normal ml-1">
                ({Math.round((autoCount / totalCount) * 100)}%)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVnd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              interval={period === '3m' ? 6 : period === '30d' ? 2 : 0}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatVND}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="vnd"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorVnd)"
              dot={period === '7d' ? { r: 4, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 } : false}
              activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="transparent"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
