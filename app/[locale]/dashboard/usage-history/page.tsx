'use client'

import useSWR from 'swr'
import { EzaiUsageLog } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Activity, Zap, Clock, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// Model short names + colors
const MODEL_COLORS: Record<string, string> = {
    'claude-3-5-sonnet': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    'claude-3-5-haiku': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    'claude-3-opus': 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    'claude-3-haiku': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    'claude-3-sonnet': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    'claude-sonnet-4': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    'claude-haiku-4': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
}

function getModelColor(model: string) {
    for (const [key, cls] of Object.entries(MODEL_COLORS)) {
        if (model.includes(key)) return cls
    }
    return 'bg-slate-500/15 text-slate-400 border-slate-500/30'
}

function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
}

export default function UsageHistoryPage() {
    const { data, error, isLoading, isValidating, mutate } = useSWR<{ usage: EzaiUsageLog[] }>(
        '/api/usage/history',
        fetcher,
        { refreshInterval: 60_000 }
    )

    const usage = data?.usage || []

    // Stats
    const totalCost = usage.reduce((s, u) => s + (u.cost || 0), 0)
    const totalTokens = usage.reduce((s, u) => s + (u.total_tokens || 0), 0)
    const totalRequests = usage.length

    // Group by model
    const modelStats = usage.reduce<Record<string, { count: number; cost: number; tokens: number }>>((acc, u) => {
        const m = u.model || 'unknown'
        if (!acc[m]) acc[m] = { count: 0, cost: 0, tokens: 0 }
        acc[m].count++
        acc[m].cost += u.cost || 0
        acc[m].tokens += u.total_tokens || 0
        return acc
    }, {})

    return (
        <div className="p-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Usage History</h1>
                    <p className="text-slate-400 mt-1">Chi tiết sử dụng API theo từng request</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mutate()}
                    disabled={isValidating}
                    className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                >
                    <RefreshCw size={14} className={cn('mr-2', isValidating && 'animate-spin')} />
                    Làm mới
                </Button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="h-24 bg-white/5 rounded-xl" />
                        <Skeleton className="h-24 bg-white/5 rounded-xl" />
                        <Skeleton className="h-24 bg-white/5 rounded-xl" />
                    </div>
                    <Skeleton className="h-96 bg-white/5 rounded-xl" />
                </div>
            )}

            {error && !isLoading && (
                <p className="text-red-400 text-sm">Không thể tải dữ liệu. Vui lòng thử lại.</p>
            )}

            {!isLoading && data && (
                <>
                    {/* Summary stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-[#0d1117] border-white/10">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity size={14} className="text-purple-400" />
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total Requests</p>
                                </div>
                                <p className="text-2xl font-bold text-white">{totalRequests}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#0d1117] border-white/10">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap size={14} className="text-yellow-400" />
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total Tokens</p>
                                </div>
                                <p className="text-2xl font-bold text-white">{formatTokens(totalTokens)}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#0d1117] border-white/10">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Coins size={14} className="text-green-400" />
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total Cost</p>
                                </div>
                                <p className="text-2xl font-bold text-green-400">${totalCost.toFixed(4)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Model breakdown */}
                    {Object.keys(modelStats).length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-6">
                            {Object.entries(modelStats)
                                .sort((a, b) => b[1].cost - a[1].cost)
                                .map(([model, stats]) => (
                                    <div
                                        key={model}
                                        className={`px-3 py-2 rounded-lg border text-xs ${getModelColor(model)}`}
                                    >
                                        <span className="font-medium">{model}</span>
                                        <span className="ml-2 opacity-70">
                                            {stats.count} req · ${stats.cost.toFixed(4)} · {formatTokens(stats.tokens)} tok
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}

                    {/* Usage table */}
                    <Card className="bg-[#0d1117] border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white text-base flex items-center gap-2">
                                <Clock size={16} className="text-purple-400" />
                                Request Logs
                                <span className="text-xs text-slate-500 font-normal ml-2">
                                    {usage.length} gần nhất
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {usage.length === 0 ? (
                                <p className="text-center text-slate-500 py-12 text-sm">
                                    Chưa có request nào. Bắt đầu sử dụng API để thấy usage logs.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left text-slate-400 font-medium pb-3 pr-4">Thời gian</th>
                                                <th className="text-left text-slate-400 font-medium pb-3 pr-4">Model</th>
                                                <th className="text-right text-slate-400 font-medium pb-3 pr-4">Prompt</th>
                                                <th className="text-right text-slate-400 font-medium pb-3 pr-4">Completion</th>
                                                <th className="text-right text-slate-400 font-medium pb-3 pr-4">Total</th>
                                                <th className="text-right text-slate-400 font-medium pb-3">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {usage.map((log) => (
                                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-3 pr-4 text-slate-400 whitespace-nowrap text-xs">
                                                        {new Date(log.created_at).toLocaleString('vi-VN', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                        })}
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getModelColor(log.model)}`}>
                                                            {log.model}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-4 text-right text-slate-300 font-mono text-xs">
                                                        {formatTokens(log.prompt_tokens)}
                                                    </td>
                                                    <td className="py-3 pr-4 text-right text-slate-300 font-mono text-xs">
                                                        {formatTokens(log.completion_tokens)}
                                                    </td>
                                                    <td className="py-3 pr-4 text-right text-white font-mono text-xs font-medium">
                                                        {formatTokens(log.total_tokens)}
                                                    </td>
                                                    <td className="py-3 text-right text-green-400 font-mono text-xs font-medium">
                                                        ${log.cost.toFixed(6)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <p className="text-xs text-slate-600 mt-6 text-center">
                        Tự động làm mới sau mỗi 60 giây
                    </p>
                </>
            )}
        </div>
    )
}
