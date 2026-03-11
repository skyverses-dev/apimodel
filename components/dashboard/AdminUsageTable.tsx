'use client'

import useSWR from 'swr'
import { AdminUserStat } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, BarChart2 } from 'lucide-react'
import { formatUSD } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, { label: string; className: string }> = {
    starter: { label: 'Starter', className: 'bg-blue-500/20 text-blue-300' },
    pro: { label: 'Pro', className: 'bg-purple-500/20 text-purple-300' },
    max: { label: 'Max', className: 'bg-orange-500/20 text-orange-300' },
    ultra: { label: 'Ultra', className: 'bg-pink-500/20 text-pink-300' },
    none: { label: 'No Plan', className: 'bg-slate-500/20 text-slate-400' },
  }
  const cfg = map[plan] ?? map['none']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return <span className="text-slate-500 text-xs">—</span>
  const diff = new Date(expiresAt).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return <span className="text-red-400 text-xs">Hết hạn</span>
  if (days <= 3) return <span className="text-yellow-400 text-xs">{days} ngày</span>
  return <span className="text-green-400 text-xs">{days} ngày</span>
}

function usageColor(pct: number) {
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 70) return 'bg-yellow-500'
  return 'bg-purple-500'
}

export function AdminUsageTable() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{ stats: AdminUserStat[]; total: number }>(
    '/api/admin/stats',
    fetcher,
    { refreshInterval: 30_000 }
  )

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <BarChart2 size={18} className="text-purple-400" />
          Thống kê sử dụng AI — tất cả user
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => mutate()}
          disabled={isValidating}
          className="text-slate-400 hover:text-white"
        >
          <RefreshCw size={14} className={cn(isValidating && 'animate-spin')} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 bg-white/5 rounded-lg" />
            ))}
          </div>
        )}

        {error && !isLoading && (
          <p className="text-red-400 text-sm text-center py-4">Không thể tải dữ liệu</p>
        )}

        {data && !isLoading && (
          <>
            {data.stats.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">Chưa có user nào được kích hoạt 2BRAIN</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-slate-400 font-medium pb-3 pr-4">Người dùng</th>
                      <th className="text-right text-slate-400 font-medium pb-3 pr-4">Số dư</th>
                      <th className="text-left text-slate-400 font-medium pb-3 pr-4">Gói</th>
                      <th className="text-left text-slate-400 font-medium pb-3 pr-4 min-w-[160px]">Hôm nay</th>
                      <th className="text-left text-slate-400 font-medium pb-3">Hết hạn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.stats.map((stat) => {
                      const pct = stat.daily_limit > 0
                        ? Math.min(100, Math.round((stat.daily_used / stat.daily_limit) * 100))
                        : 0
                      return (
                        <tr key={stat.rb_user_id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 pr-4">
                            <p className="text-white font-medium">{stat.name || 'N/A'}</p>
                            <p className="text-slate-500 text-xs truncate max-w-[180px]">{stat.email}</p>
                          </td>
                          <td className="py-3 pr-4 text-right text-white font-medium">
                            {formatUSD(stat.balance)}
                          </td>
                          <td className="py-3 pr-4">
                            <PlanBadge plan={stat.plan_type} />
                          </td>
                          <td className="py-3 pr-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-300">{formatUSD(stat.daily_used)}</span>
                                <span className="text-slate-500">/ {stat.daily_limit > 0 ? formatUSD(stat.daily_limit) : '∞'}</span>
                              </div>
                              {stat.daily_limit > 0 && (
                                <Progress
                                  value={pct}
                                  className={`h-1.5 bg-white/10 [&>div]:${usageColor(pct)}`}
                                />
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <ExpiryCountdown expiresAt={stat.plan_expires_at} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-slate-600 mt-3 text-right">
              {data.total} user đã kích hoạt · tự động làm mới sau 30s
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
