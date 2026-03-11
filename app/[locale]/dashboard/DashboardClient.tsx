'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Copy, Check, Eye, EyeOff, Key } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface RateLimits {
    reqPerMin: number
    concurrent: number
    dailyRequests: number
}

const PLAN_LIMITS: Record<string, RateLimits> = {
    ultra: { reqPerMin: 120, concurrent: 20, dailyRequests: 5000 },
    max: { reqPerMin: 60, concurrent: 10, dailyRequests: 2050 },
    pro: { reqPerMin: 60, concurrent: 10, dailyRequests: 2050 },
    starter: { reqPerMin: 30, concurrent: 5, dailyRequests: 500 },
    one_time: { reqPerMin: 10, concurrent: 3, dailyRequests: 200 },
    none: { reqPerMin: 5, concurrent: 2, dailyRequests: 50 },
}

interface Props {
    apiKey: string | null
    isActive: boolean
    lastUsed: string | null
    balance: number
    planType: string
    dailyLimit: number
    dailyUsed: number
    baseUrl: string
    ezaiUserId: string
}

export function DashboardClient({
    apiKey, isActive, lastUsed,
    balance, planType, dailyLimit, dailyUsed,
    baseUrl, ezaiUserId,
}: Props) {
    const [showKey, setShowKey] = useState(false)
    const [copied, setCopied] = useState(false)

    // Live polling for usage stats
    const { data: usage } = useSWR('/api/usage', fetcher, { refreshInterval: 30_000 })

    const liveBalance = usage?.balance ?? balance
    const spendingToday = usage?.spending_today ?? 0
    const requestsToday = usage?.requests_today ?? 0
    const spending30d = usage?.spending_30d ?? 0

    const limits = PLAN_LIMITS[planType] || PLAN_LIMITS['none']
    const planLabel = planType !== 'none'
        ? planType.charAt(0).toUpperCase() + planType.slice(1)
        : 'Free'

    function handleCopy() {
        if (!apiKey) return
        navigator.clipboard.writeText(apiKey)
        setCopied(true)
        toast.success('Đã sao chép API Key!')
        setTimeout(() => setCopied(false), 2000)
    }

    const maskedKey = apiKey
        ? `${apiKey.slice(0, 8)}${'•'.repeat(32)}${apiKey.slice(-6)}`
        : '—'

    const lastUsedText = lastUsed
        ? `Last used: ${new Date(lastUsed).toLocaleString('vi-VN')}`
        : 'Never used'

    return (
        <div className="p-8 max-w-5xl space-y-6">

            {/* ─── 4 Stat Cards ──────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Main Balance"
                    value={liveBalance.toFixed(2)}
                    suffix="credits"
                    color="text-green-400"
                />
                <StatCard
                    label="Spending Today"
                    value={spendingToday.toFixed(4)}
                    suffix="credits"
                    color="text-orange-400"
                />
                <StatCard
                    label="Requests Today"
                    value={String(requestsToday)}
                    color="text-white"
                />
                <StatCard
                    label="Spending (30 days)"
                    value={spending30d.toFixed(2)}
                    suffix="credits"
                    color="text-orange-400"
                />
            </div>

            {/* ─── API Key Card ──────────────────────────────────── */}
            <Card className="bg-[#0d1117] border-white/10">
                <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Key size={16} className="text-yellow-400" />
                            <span className="text-white font-semibold">Your API Key</span>
                        </div>
                        {apiKey && (
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                                <span className={`text-xs ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                                    {isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        )}
                    </div>

                    {apiKey ? (
                        <>
                            {/* Key display */}
                            <div className="flex items-center justify-between gap-3">
                                <code className="flex-1 text-sm font-mono text-green-400 bg-transparent overflow-hidden text-ellipsis whitespace-nowrap">
                                    {showKey ? apiKey : maskedKey}
                                </code>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setShowKey(!showKey)}
                                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
                                    >
                                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={handleCopy}
                                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
                                    >
                                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    </Button>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-slate-500">{lastUsedText}</span>
                                <span className="text-xs text-slate-500">Default Key</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-slate-500 text-sm">Chưa có API Key. Liên hệ admin để kích hoạt.</p>
                    )}
                </CardContent>
            </Card>

            {/* ─── Rate Limits ───────────────────────────────────── */}
            <Card className="bg-[#0d1117] border-white/10">
                <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <span className="text-white font-semibold">Rate Limits</span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">
                            {planLabel}
                        </span>
                    </div>

                    {/* 3 limit cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <RateLimitBox
                            label="REQUESTS / MIN"
                            value={limits.reqPerMin}
                            used={0}
                            subText="0 used"
                        />
                        <RateLimitBox
                            label="CONCURRENT"
                            value={limits.concurrent}
                            used={0}
                            subText="0 in-flight"
                        />
                        <RateLimitBox
                            label="DAILY REQUESTS"
                            value={limits.dailyRequests}
                            used={requestsToday}
                            subText={`${requestsToday} / ${limits.dailyRequests} today`}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ── Sub-components ─────────────────────────────────────────

function StatCard({ label, value, suffix, color }: {
    label: string; value: string; suffix?: string; color: string
}) {
    return (
        <Card className="bg-[#0d1117] border-white/10">
            <CardContent className="p-5">
                <p className="text-xs text-slate-500 mb-2">{label}</p>
                <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-bold ${color}`}>{value}</span>
                    {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
                </div>
            </CardContent>
        </Card>
    )
}

function RateLimitBox({ label, value, used, subText }: {
    label: string; value: number; used: number; subText: string
}) {
    const pct = value > 0 ? Math.min(100, Math.round((used / value) * 100)) : 0

    return (
        <div className="bg-[#161b22] border border-white/10 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">{label}</p>
            <p className="text-2xl font-bold text-white mb-3">{value}</p>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                    className="h-full bg-slate-400 rounded-full transition-all"
                    style={{ width: `${Math.max(pct, 1)}%` }}
                />
            </div>
            <p className="text-xs text-slate-500">{subText}</p>
        </div>
    )
}
