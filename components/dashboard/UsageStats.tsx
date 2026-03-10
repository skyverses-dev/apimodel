'use client'

import { useEffect, useState } from 'react'
import { UsageData, EzaiTransaction } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Wallet, Zap, TrendingUp, Calendar, Timer } from 'lucide-react'
import { formatUSD, formatVND } from '@/lib/utils/currency'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Tính thời điểm reset 5h tiếp theo (UTC: 00, 05, 10, 15, 20) */
function getNextResetMs(): number {
  const now = new Date()
  const utcHour = now.getUTCHours()
  const nextSlot = Math.ceil((utcHour + 1) / 5) * 5 // 0→5, 1-5→5, 6-10→10, ...
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    nextSlot % 24,
  ))
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
  return next.getTime() - now.getTime()
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

function usageBarColor(pct: number) {
  if (pct >= 90) return '[&>div]:bg-red-500'
  if (pct >= 70) return '[&>div]:bg-yellow-500'
  return '[&>div]:bg-purple-500'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, { label: string; className: string }> = {
    starter:  { label: 'Starter',  className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    pro:      { label: 'Pro',      className: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    max:      { label: 'Max',      className: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
    ultra:    { label: 'Ultra',    className: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
    one_time: { label: 'One-time', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    none:     { label: 'No Plan',  className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  }
  const cfg = map[plan] ?? map['none']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return <span className="text-slate-500 text-sm">—</span>
  const diff = new Date(expiresAt).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0)  return <span className="text-red-400 text-sm font-medium">Đã hết hạn</span>
  if (days === 0) return <span className="text-red-400 text-sm font-medium">Hết hạn hôm nay</span>
  if (days <= 3)  return <span className="text-yellow-400 text-sm font-medium">Còn {days} ngày</span>
  return <span className="text-green-400 text-sm font-medium">Còn {days} ngày</span>
}

/** Đồng hồ đếm ngược reset cycle — tick mỗi giây */
function CycleCountdown({ dailyLimit }: { dailyLimit: number }) {
  const [msLeft, setMsLeft] = useState(() => getNextResetMs())

  useEffect(() => {
    const tick = () => setMsLeft(getNextResetMs())
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (dailyLimit === 0) return null

  const isAlmostDone = msLeft < 10 * 60 * 1000 // < 10 min

  return (
    <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${isAlmostDone ? 'text-green-400' : 'text-slate-400'}`}>
      <Timer size={12} />
      <span>Reset sau {formatCountdown(msLeft)}</span>
    </div>
  )
}

function TxTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    topup:           { label: 'Nạp tiền',   className: 'bg-green-500/20 text-green-300' },
    plan_activate:   { label: 'Kích hoạt',  className: 'bg-purple-500/20 text-purple-300' },
    user_create:     { label: 'Tài khoản',  className: 'bg-blue-500/20 text-blue-300' },
    user_deactivate: { label: 'Tắt TK',     className: 'bg-red-500/20 text-red-300' },
    plan_deactivate: { label: 'Huỷ gói',    className: 'bg-orange-500/20 text-orange-300' },
  }
  const cfg = map[type] ?? { label: type, className: 'bg-slate-500/20 text-slate-400' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'success' || status === 'completed') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300">Thành công</span>
  }
  if (status === 'failed' || status === 'error') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300">Thất bại</span>
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">{status}</span>
}

// ── Main component ────────────────────────────────────────────────────────────

interface UsageStatsProps {
  data: UsageData
  compact?: boolean
}

export function UsageStats({ data, compact = false }: UsageStatsProps) {
  const {
    balance, plan_type, daily_limit, daily_used, plan_expires_at,
    transactions, monthly_topup_vnd, monthly_topup_credit,
  } = data

  const pct = daily_limit > 0 ? Math.min(100, Math.round((daily_used / daily_limit) * 100)) : 0
  const remaining = Math.max(0, daily_limit - daily_used)
  const isFull = daily_limit > 0 && daily_used >= daily_limit

  return (
    <div className="space-y-4">
      {/* Cards row */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>

        {/* Balance & Plan */}
        <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Số dư & Gói</CardTitle>
            <Wallet className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-white">{formatUSD(balance)}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <PlanBadge plan={plan_type} />
              <ExpiryCountdown expiresAt={plan_expires_at} />
            </div>
          </CardContent>
        </Card>

        {/* Cycle Usage */}
        <Card className={`bg-gradient-to-br border ${
          isFull
            ? 'from-red-900/40 to-red-800/20 border-red-500/30'
            : 'from-slate-800/60 to-slate-700/30 border-white/10'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Credit chu kỳ 5h
            </CardTitle>
            <Zap className={`h-4 w-4 ${isFull ? 'text-red-400' : 'text-yellow-400'}`} />
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Used / Limit */}
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold text-white">
                  {daily_used.toFixed(2)}
                </span>
                <span className="text-slate-400 text-sm ml-1">
                  / {daily_limit > 0 ? daily_limit : '∞'}
                </span>
              </div>
              {daily_limit > 0 && (
                <span className={`text-xs font-medium ${isFull ? 'text-red-400' : 'text-slate-400'}`}>
                  {isFull ? 'Đã hết' : `còn ${remaining.toFixed(2)}`}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {daily_limit > 0 && (
              <Progress
                value={pct}
                className={`h-2 bg-white/10 ${usageBarColor(pct)}`}
              />
            )}

            {/* Reset countdown + pct */}
            <div className="flex items-center justify-between">
              <CycleCountdown dailyLimit={daily_limit} />
              {daily_limit > 0 && (
                <span className="text-xs text-slate-500">{pct}%</span>
              )}
            </div>

            {/* Full warning */}
            {isFull && (
              <p className="text-xs text-red-400 font-medium">
                ⏳ Chờ reset để tiếp tục sử dụng
              </p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Top-ups (full mode only) */}
        {!compact && (
          <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Nạp tiền tháng này</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold text-white">{formatVND(monthly_topup_vnd)}</div>
              <p className="text-xs text-slate-400">= {formatUSD(monthly_topup_credit)} credit</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transactions table (full mode only) */}
      {!compact && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Calendar size={16} className="text-purple-400" />
              Lịch sử giao dịch EzAI
            </CardTitle>
            <span className="text-xs text-slate-500">{transactions.length} gần nhất</span>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">Chưa có giao dịch nào</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-slate-400 font-medium pb-2 pr-4">Ngày</th>
                      <th className="text-left text-slate-400 font-medium pb-2 pr-4">Loại</th>
                      <th className="text-right text-slate-400 font-medium pb-2 pr-4">Số tiền</th>
                      <th className="text-left text-slate-400 font-medium pb-2 pr-4">Mô tả</th>
                      <th className="text-left text-slate-400 font-medium pb-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((tx: EzaiTransaction) => (
                      <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 pr-4 text-slate-400 whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-2.5 pr-4">
                          <TxTypeBadge type={tx.type} />
                        </td>
                        <td className="py-2.5 pr-4 text-right font-medium text-white">
                          {tx.amount > 0 ? '+' : ''}{formatUSD(tx.amount)}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-300 max-w-[200px] truncate" title={tx.description || undefined}>
                          {tx.failure_reason
                            ? <span className="text-red-400 text-xs">{tx.failure_reason.replace(/_/g, ' ')}</span>
                            : (tx.description || '—')
                          }
                        </td>
                        <td className="py-2.5">
                          <StatusBadge status={tx.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
