'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { EzaiUser, EzaiUsageLog } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Search, ChevronLeft, ChevronRight, RefreshCw,
    ChevronDown, ChevronUp, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const PLAN_BADGE: Record<string, string> = {
    starter: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    pro: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    max: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    ultra: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    one_time: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    none: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

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

// ── Usage row (expandable) ────────────────────────────────────────────────

function UsagePanel({ ezaiUserId }: { ezaiUserId: string }) {
    const { data, isLoading, error } = useSWR<{ usage: EzaiUsageLog[] }>(
        `/api/admin/ezai-users/usage?user_id=${ezaiUserId}&limit=50`,
        fetcher
    )

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 py-6 justify-center text-slate-500 text-sm">
                <Loader2 size={14} className="animate-spin" /> Đang tải...
            </div>
        )
    }

    if (error || !data) {
        return <p className="text-red-400 text-sm py-4 text-center">Không thể tải usage logs</p>
    }

    const usage = data.usage || []

    if (usage.length === 0) {
        return <p className="text-slate-500 text-sm py-6 text-center">Chưa có request nào</p>
    }

    const totalCost = usage.reduce((s, u) => s + (u.cost || 0), 0)
    const totalInput = usage.reduce((s, u) => s + (u.input_tokens || 0), 0)
    const totalOutput = usage.reduce((s, u) => s + (u.output_tokens || 0), 0)

    return (
        <div className="space-y-3">
            {/* Summary */}
            <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{usage.length} requests</span>
                <span>·</span>
                <span>In: {formatTokens(totalInput)}</span>
                <span>·</span>
                <span>Out: {formatTokens(totalOutput)}</span>
                <span>·</span>
                <span className="text-green-400">${totalCost.toFixed(4)}</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left text-slate-500 font-medium py-2 pr-3">Thời gian</th>
                            <th className="text-left text-slate-500 font-medium py-2 pr-3">Model</th>
                            <th className="text-left text-slate-500 font-medium py-2 pr-3">Path</th>
                            <th className="text-right text-slate-500 font-medium py-2 pr-3">Input</th>
                            <th className="text-right text-slate-500 font-medium py-2 pr-3">Output</th>
                            <th className="text-right text-slate-500 font-medium py-2 pr-3">Cache R/W</th>
                            <th className="text-right text-slate-500 font-medium py-2 pr-3">Cost</th>
                            <th className="text-center text-slate-500 font-medium py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {usage.map(log => (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-2 pr-3 text-slate-400 whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleString('vi-VN', {
                                        day: '2-digit', month: '2-digit',
                                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                                    })}
                                </td>
                                <td className="py-2 pr-3">
                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium ${getModelColor(log.model)}`}>
                                        {log.model}
                                    </span>
                                </td>
                                <td className="py-2 pr-3 text-slate-500 font-mono text-[11px]">
                                    {log.request_path}
                                </td>
                                <td className="py-2 pr-3 text-right text-slate-300 font-mono">
                                    {formatTokens(log.input_tokens)}
                                </td>
                                <td className="py-2 pr-3 text-right text-slate-300 font-mono">
                                    {formatTokens(log.output_tokens)}
                                </td>
                                <td className="py-2 pr-3 text-right text-slate-500 font-mono">
                                    {log.cache_read_tokens > 0 || log.cache_write_tokens > 0
                                        ? `${formatTokens(log.cache_read_tokens)}/${formatTokens(log.cache_write_tokens)}`
                                        : '—'}
                                </td>
                                <td className="py-2 pr-3 text-right text-green-400 font-mono font-medium">
                                    ${log.cost.toFixed(6)}
                                </td>
                                <td className="py-2 text-center">
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
        </div>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function EzaiUsersPage() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const limit = 20

    const { data, error, isLoading, isValidating, mutate } = useSWR<{
        users: EzaiUser[]
        total: number
        page: number
        limit: number
    }>(`/api/admin/ezai-users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, fetcher, {
        refreshInterval: 60_000,
    })

    const users = data?.users || []
    const total = data?.total || 0
    const totalPages = Math.max(1, Math.ceil(total / limit))

    function toggleExpand(userId: string) {
        setExpanded(prev => ({ ...prev, [userId]: !prev[userId] }))
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        setSearch(searchInput)
        setPage(1)
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Người dùng Ezapi</h1>
                    <p className="text-slate-400 mt-1">
                        Danh sách người dùng đã đăng ký trên EzAI
                        {total > 0 && <span className="ml-2 text-slate-500">· {total} users</span>}
                    </p>
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

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                        placeholder="Tìm email, tên, ID..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                </div>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    Tìm kiếm
                </Button>
                {search && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
                        className="text-slate-400 hover:text-white"
                    >
                        Xoá
                    </Button>
                )}
            </form>

            {/* Loading */}
            {isLoading && (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 bg-white/5 rounded-xl" />
                    ))}
                </div>
            )}

            {error && !isLoading && (
                <p className="text-red-400">Không thể tải danh sách. Vui lòng thử lại.</p>
            )}

            {/* Table */}
            {!isLoading && data && (
                <Card className="bg-[#0d1117] border-white/10">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left text-slate-400 font-medium py-3 px-4">User</th>
                                        <th className="text-left text-slate-400 font-medium py-3 px-4">Email</th>
                                        <th className="text-left text-slate-400 font-medium py-3 px-4">Plan</th>
                                        <th className="text-right text-slate-400 font-medium py-3 px-4">Balance</th>
                                        <th className="text-right text-slate-400 font-medium py-3 px-4">Daily Used</th>
                                        <th className="text-right text-slate-400 font-medium py-3 px-4">Daily Limit</th>
                                        <th className="text-left text-slate-400 font-medium py-3 px-4">Ngày tạo</th>
                                        <th className="text-center text-slate-400 font-medium py-3 px-4">Usage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-12 text-slate-500">
                                                {search ? 'Không tìm thấy kết quả' : 'Chưa có người dùng'}
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map(user => (
                                            <>
                                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                                                {(user.name || user.email)?.[0]?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-white text-sm font-medium truncate max-w-[150px]">
                                                                    {user.name || '—'}
                                                                </p>
                                                                <p className="text-slate-500 text-xs font-mono truncate max-w-[150px]">
                                                                    {user.id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-300 text-sm">{user.email}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${PLAN_BADGE[user.plan_type] || PLAN_BADGE['none']}`}>
                                                            {user.plan_type === 'none' ? 'Free' : user.plan_type.charAt(0).toUpperCase() + user.plan_type.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className={`py-3 px-4 text-right font-mono text-sm font-medium ${user.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        ${user.balance.toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono text-sm text-slate-300">
                                                        {user.daily_used.toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono text-sm text-slate-300">
                                                        {user.daily_limit > 0 ? user.daily_limit : '∞'}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                                                        {new Date(user.created_at).toLocaleDateString('vi-VN')}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => toggleExpand(user.id)}
                                                            className="h-7 px-2 text-slate-400 hover:text-white hover:bg-white/10"
                                                        >
                                                            {expanded[user.id] ? (
                                                                <ChevronUp size={14} />
                                                            ) : (
                                                                <ChevronDown size={14} />
                                                            )}
                                                        </Button>
                                                    </td>
                                                </tr>

                                                {/* Expanded usage panel */}
                                                {expanded[user.id] && (
                                                    <tr key={`${user.id}-usage`}>
                                                        <td colSpan={8} className="px-4 py-4 bg-[#161b22] border-b border-white/5">
                                                            <UsagePanel ezaiUserId={user.id} />
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                                <p className="text-xs text-slate-500">
                                    Trang {page} / {totalPages} · {total} users
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="h-8 border-white/10 text-slate-300 hover:bg-white/10"
                                    >
                                        <ChevronLeft size={14} />
                                    </Button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                                        const p = start + i
                                        if (p > totalPages) return null
                                        return (
                                            <Button
                                                key={p}
                                                size="sm"
                                                variant={p === page ? 'default' : 'outline'}
                                                onClick={() => setPage(p)}
                                                className={cn(
                                                    'h-8 w-8 p-0',
                                                    p === page
                                                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                                        : 'border-white/10 text-slate-300 hover:bg-white/10'
                                                )}
                                            >
                                                {p}
                                            </Button>
                                        )
                                    })}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="h-8 border-white/10 text-slate-300 hover:bg-white/10"
                                    >
                                        <ChevronRight size={14} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
