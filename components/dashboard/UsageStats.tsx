'use client'

import { useEffect, useState } from 'react'
import { UsageData, EzaiTransaction } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Wallet, Zap, TrendingUp, Calendar, Timer, Activity, BarChart3, Gauge } from 'lucide-react'
import { formatUSD } from '@/lib/utils/currency'

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
  if (ms <= 0) return '0h 0m 0s'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h}h ${m}m ${s}s`
}

function usageBarColor(pct: number) {
  if (pct >= 90) return '[&>div]:bg-red-500'
  if (pct >= 70) return '[&>div]:bg-yellow-500'
  if (pct >= 50) return '[&>div]:bg-gradient-to-r [&>div]:from-pink-500 [&>div]:to-purple-500'
  return '[&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-emerald-500'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, { label: string; dot: string; bg: string }> = {
    starter: { label: 'Starter', dot: 'bg-blue-400', bg: 'text-blue-300' },
    pro: { label: 'Pro', dot: 'bg-purple-400', bg: 'text-purple-300' },
    max: { label: 'Max', dot: 'bg-orange-400', bg: 'text-orange-300' },
    ultra: { label: 'Ultra', dot: 'bg-pink-400', bg: 'text-pink-300' },
    one_time: { label: 'One-time', dot: 'bg-slate-400', bg: 'text-slate-400' },
    none: { label: 'No Plan', dot: 'bg-slate-500', bg: 'text-slate-400' },
  }
  const cfg = map[plan] ?? map['none']
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse`} />
      <span className={`text-lg font-bold ${cfg.bg}`}>{cfg.label}</span>
    </div>
  )
}

function CycleCountdown({ dailyLimit }: { dailyLimit: number }) {
  const [msLeft, setMsLeft] = useState(() => getNextResetMs())

  useEffect(() => {
    const tick = () => setMsLeft(getNextResetMs())
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (dailyLimit === 0) return null

  return (
    <span className="text-xs text-green-400 font-mono">
      Next reset in {formatCountdown(msLeft)}
    </span>
  )
}

function TxTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    topup: { label: 'Nạp tiền', className: 'bg-green-500/20 text-green-300' },
    plan_activate: { label: 'Kích hoạt', className: 'bg-purple-500/20 text-purple-300' },
    user_create: { label: 'Tài khoản', className: 'bg-blue-500/20 text-blue-300' },
    user_deactivate: { label: 'Tắt TK', className: 'bg-red-500/20 text-red-300' },
    plan_deactivate: { label: 'Huỷ gói', className: 'bg-orange-500/20 text-orange-300' },
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

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, suffix, color }: {
  label: string
  value: string
  suffix?: string
  color: string
}) {
  return (
    <Card className="bg-[#0d1117] border-white/10 hover:border-white/20 transition-colors">
      <CardContent className="p-5">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
          {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Rate Limit Card ───────────────────────────────────────────────────────────

function RateLimitCard({ label, value, used, total, color }: {
  label: string
  value: string
  used?: string
  total?: string
  color: string
}) {
  const pct = total && used ? Math.min(100, Math.round((Number(used) / Number(total)) * 100)) : 0

  return (
    <Card className="bg-[#0d1117] border-white/10">
      <CardContent className="p-5">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-2xl font-bold text-white mb-2">{value}</p>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full transition-all`}
            style={{ width: `${pct || 10}%` }}
          />
        </div>
        {used && total && (
          <p className="text-xs text-slate-500 mt-1.5">{used} / {total}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface UsageStatsProps {
  data: UsageData
  compact?: boolean
}

export function UsageStats({ data, compact = false }: UsageStatsProps) {
  const {
    balance, plan_type, daily_limit, daily_used, plan_expires_at,
    transactions, spending_today, requests_today, spending_30d,
  } = data

  const pct = daily_limit > 0 ? Math.min(100, Math.round((daily_used / daily_limit) * 100)) : 0
  const remaining = Math.max(0, daily_limit - daily_used)
  const expiresDate = plan_expires_at
    ? new Date(plan_expires_at).toLocaleDateString('vi-VN')
    : null

  return (
    <div className="space-y-6">

      {/* ─── Plan Hero Card ───────────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-[#0d1117] to-[#161b22] border-white/10 overflow-hidden relative">
        <CardContent className="p-6">
          {/* Plan header */}
          <div className="flex items-center justify-between mb-5">
            <PlanBadge plan={plan_type} />
            {expiresDate && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                Valid until {expiresDate}
              </span>
            )}
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free credits box */}
            <div className="bg-[#0d1117] border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Free Credits (resets every 5h)</span>
                <span className="text-lg font-bold text-white">{daily_limit > 0 ? daily_limit : '∞'} <span className="text-xs text-slate-400 font-normal">credits</span></span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Used: {daily_used.toFixed(4)}</span>
                <span>Remaining: {remaining.toFixed(4)}</span>
              </div>
              {daily_limit > 0 && (
                <Progress
                  value={pct}
                  className={`h-2.5 bg-white/10 rounded-full ${usageBarColor(pct)}`}
                />
              )}
              <CycleCountdown dailyLimit={daily_limit} />
            </div>

            {/* Main balance box */}
            <div className="bg-[#0d1117] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Main Balance</span>
                <span className={`text-lg font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatUSD(balance)} <span className="text-xs text-slate-400 font-normal">credits</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">Deposited credits, used anytime</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── 4 Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Main Balance"
          value={formatUSD(balance)}
          suffix="credits"
          color={balance >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard
          label="Spending Today"
          value={spending_today.toFixed(4)}
          suffix="credits"
          color="text-yellow-400"
        />
        <StatCard
          label="Requests Today"
          value={String(requests_today)}
          color="text-white"
        />
        <StatCard
          label="Spending (30 days)"
          value={spending_30d.toFixed(2)}
          suffix="credits"
          color="text-emerald-400"
        />
      </div>

      {/* ─── Rate Limits ───────────────────────────────────────────────── */}
      {!compact && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Gauge size={16} className="text-purple-400" />
              Rate Limits
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
              {plan_type !== 'none' ? plan_type.charAt(0).toUpperCase() + plan_type.slice(1) : 'Free'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RateLimitCard label="Requests / Min" value="60" color="bg-blue-500" />
            <RateLimitCard label="Concurrent" value="10" color="bg-purple-500" />
            <RateLimitCard
              label="Daily Requests"
              value={daily_limit > 0 ? String(Math.round(daily_limit * 20)) : '∞'}
              used={String(requests_today)}
              total={daily_limit > 0 ? String(Math.round(daily_limit * 20)) : undefined}
              color="bg-green-500"
            />
          </div>
        </div>
      )}

      {/* ─── Transactions table (full mode only) ───────────────────────── */}
      {!compact && (
        <Card className="bg-[#0d1117] border-white/10">
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
