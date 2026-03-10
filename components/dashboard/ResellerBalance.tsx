'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, BarChart3, Users, Zap, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react'
import type { EzaiStats } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ResellerBalance() {
  const { data, error, isLoading, mutate } = useSWR<EzaiStats>(
    '/api/admin/reseller',
    fetcher,
    { refreshInterval: 60_000 }
  )

  const stats: EzaiStats | null = data && !('error' in data) ? {
    reseller_balance: data.reseller_balance ?? 0,
    reseller_quota: data.reseller_quota ?? 0,
    bonus_multiplier: data.bonus_multiplier ?? 1,
    total_users: data.total_users ?? 0,
    total_transactions: data.total_transactions ?? 0,
    total_topups: data.total_topups ?? 0,
    total_plan_activations: data.total_plan_activations ?? 0,
  } : null

  return (
    <Card className="bg-white/5 border-white/10 mb-8">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Wallet size={20} className="text-emerald-400" />
          Tài khoản Reseller (Cổng AI)
        </CardTitle>
        <button
          onClick={() => mutate()}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded"
          title="Làm mới"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </CardHeader>

      <CardContent>
        {error || (data && 'error' in data) ? (
          <div className="flex items-center gap-2 text-red-400 text-sm py-2">
            <AlertCircle size={16} />
            Không thể tải dữ liệu reseller. Kiểm tra EZAI_RESELLER_KEY.
          </div>
        ) : isLoading || !stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <>
            {/* Balance bar */}
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Số dư hiện tại</span>
                <span className="text-emerald-400 font-bold text-xl">${fmt(stats.reseller_balance)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs">Hạn mức tổng (quota)</span>
                <span className="text-slate-300 text-sm">${fmt(stats.reseller_quota)}</span>
              </div>
              {stats.reseller_quota > 0 && (
                <>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (stats.reseller_balance / stats.reseller_quota) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {((stats.reseller_balance / stats.reseller_quota) * 100).toFixed(1)}% còn lại
                  </p>
                </>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 size={14} className="text-blue-400" />
                  <span className="text-slate-400 text-xs">Tổng nạp vào cổng</span>
                </div>
                <p className="text-white font-semibold text-lg">{stats.total_topups.toLocaleString()}</p>
                <p className="text-slate-500 text-xs">lần nạp</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-purple-400" />
                  <span className="text-slate-400 text-xs">Kích hoạt gói</span>
                </div>
                <p className="text-white font-semibold text-lg">{stats.total_plan_activations.toLocaleString()}</p>
                <p className="text-slate-500 text-xs">lần kích hoạt</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className="text-cyan-400" />
                  <span className="text-slate-400 text-xs">Users tại cổng</span>
                </div>
                <p className="text-white font-semibold text-lg">{stats.total_users.toLocaleString()}</p>
                <p className="text-slate-500 text-xs">end-users</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-orange-400" />
                  <span className="text-slate-400 text-xs">Nhân thưởng</span>
                </div>
                <p className="text-white font-semibold text-lg">x{stats.bonus_multiplier}</p>
                <p className="text-slate-500 text-xs">bonus multiplier</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
