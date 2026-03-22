'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { EzaiUsageLog } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const MODEL_COLORS: Record<string, string> = {
    'claude-3-5-sonnet': 'bg-purple-500/15 text-purple-300',
    'claude-3-5-haiku': 'bg-blue-500/15 text-blue-300',
    'claude-3-opus': 'bg-pink-500/15 text-pink-300',
    'claude-sonnet-4': 'bg-purple-500/15 text-purple-300',
    'claude-haiku-4': 'bg-blue-500/15 text-blue-300',
    'gpt-4': 'bg-green-500/15 text-green-300',
    'gpt-3.5': 'bg-teal-500/15 text-teal-300',
}

function getModelColor(model: string) {
    for (const [key, cls] of Object.entries(MODEL_COLORS)) {
        if (model.includes(key)) return cls
    }
    return 'bg-slate-500/15 text-slate-400'
}

function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

interface UsageHistoryResponse {
    usage: EzaiUsageLog[]
    total: number
    page: number
    limit: number
}

export function UsageHistory() {
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)

    const { data, isLoading, error } = useSWR<UsageHistoryResponse>(
        `/api/usage/history?page=${page}&limit=${limit}`,
        fetcher,
        { refreshInterval: 60_000, keepPreviousData: true }
    )

    if (isLoading && !data) {
        return <Skeleton className="h-64 rounded-xl bg-white/5" />
    }

    if (error || !data) {
        return null
    }

    const usage = data.usage || []
    const total = data.total || 0
    const totalPages = Math.max(1, Math.ceil(total / limit))

    if (total === 0) {
        return (
            <Card className="bg-[#0d1117] border-white/10">
                <CardHeader>
                    <CardTitle className="text-white text-base flex items-center gap-2">
                        <Clock size={16} className="text-purple-400" />
                        Usage History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-slate-500 py-8 text-sm">
                        Chưa có request nào. Sử dụng API để thấy usage logs tại đây.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const totalCost = usage.reduce((s, u) => s + (u.cost || 0), 0)
    const totalInput = usage.reduce((s, u) => s + (u.input_tokens || 0), 0)
    const totalOutput = usage.reduce((s, u) => s + (u.output_tokens || 0), 0)

    return (
        <Card className="bg-[#0d1117] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white text-base flex items-center gap-2">
                    <Clock size={16} className="text-purple-400" />
                    Usage History
                    <span className="text-xs text-slate-500 font-normal ml-1">
                        ({total} total)
                    </span>
                </CardTitle>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{usage.length} requests</span>
                    <span>In: {formatTokens(totalInput)}</span>
                    <span>Out: {formatTokens(totalOutput)}</span>
                    <span className="text-green-400">${totalCost.toFixed(4)}</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left text-slate-400 font-medium pb-3 pr-4">Thời gian</th>
                                <th className="text-left text-slate-400 font-medium pb-3 pr-4">Model</th>
                                <th className="text-left text-slate-400 font-medium pb-3 pr-4">Path</th>
                                <th className="text-right text-slate-400 font-medium pb-3 pr-4">Input</th>
                                <th className="text-right text-slate-400 font-medium pb-3 pr-4">Output</th>
                                <th className="text-right text-slate-400 font-medium pb-3 pr-4">Cache R/W</th>
                                <th className="text-right text-slate-400 font-medium pb-3 pr-4">Cost</th>
                                <th className="text-center text-slate-400 font-medium pb-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {usage.map(log => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-2.5 pr-4 text-slate-400 whitespace-nowrap text-xs">
                                        {new Date(log.created_at).toLocaleString('vi-VN', {
                                            day: '2-digit', month: '2-digit',
                                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                                        })}
                                    </td>
                                    <td className="py-2.5 pr-4">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getModelColor(log.model)}`}>
                                            {log.model}
                                        </span>
                                    </td>
                                    <td className="py-2.5 pr-4 text-slate-500 font-mono text-xs">
                                        {log.request_path}
                                    </td>
                                    <td className="py-2.5 pr-4 text-right text-slate-300 font-mono text-xs">
                                        {formatTokens(log.input_tokens)}
                                    </td>
                                    <td className="py-2.5 pr-4 text-right text-slate-300 font-mono text-xs">
                                        {formatTokens(log.output_tokens)}
                                    </td>
                                    <td className="py-2.5 pr-4 text-right text-slate-500 font-mono text-xs">
                                        {log.cache_read_tokens > 0 || log.cache_write_tokens > 0
                                            ? `${formatTokens(log.cache_read_tokens)}/${formatTokens(log.cache_write_tokens)}`
                                            : '—'}
                                    </td>
                                    <td className="py-2.5 pr-4 text-right text-green-400 font-mono text-xs font-medium">
                                        ${log.cost.toFixed(6)}
                                    </td>
                                    <td className="py-2.5 text-center">
                                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium ${log.status_code === 200
                                            ? 'bg-green-500/15 text-green-300'
                                            : 'bg-red-500/15 text-red-300'
                                            }`}>
                                            {log.status_code}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    {/* Page size selector */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Hiển thị</span>
                        <select
                            value={limit}
                            onChange={e => { setLimit(Number(e.target.value)); setPage(1) }}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-slate-300 text-xs outline-none focus:border-purple-500/50 cursor-pointer"
                        >
                            {PAGE_SIZE_OPTIONS.map(size => (
                                <option key={size} value={size} className="bg-[#0d1117]">
                                    {size}
                                </option>
                            ))}
                        </select>
                        <span>/ trang</span>
                    </div>

                    {/* Page info & navigation */}
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500 mr-2">
                            Trang {page} / {totalPages}
                        </span>

                        <button
                            onClick={() => setPage(1)}
                            disabled={page <= 1}
                            className="p-1.5 rounded hover:bg-white/10 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Trang đầu"
                        >
                            <ChevronsLeft size={14} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-1.5 rounded hover:bg-white/10 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Trang trước"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-1.5 rounded hover:bg-white/10 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Trang sau"
                        >
                            <ChevronRight size={14} />
                        </button>
                        <button
                            onClick={() => setPage(totalPages)}
                            disabled={page >= totalPages}
                            className="p-1.5 rounded hover:bg-white/10 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Trang cuối"
                        >
                            <ChevronsRight size={14} />
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
