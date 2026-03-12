'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { EzaiUser } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ChevronLeft, ChevronRight, RefreshCw, Users, Coins, Zap } from 'lucide-react'
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

export default function EzaiUsersPage() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [searchInput, setSearchInput] = useState('')
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

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        setSearch(searchInput)
        setPage(1)
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">2BRAIN Users (EzAI)</h1>
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
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-slate-500">
                                                {search ? 'Không tìm thấy kết quả' : 'Chưa có người dùng'}
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map(user => (
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
                                                    {user.plan_expires_at && (
                                                        <span className="text-xs text-slate-500 ml-2">
                                                            → {new Date(user.plan_expires_at).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    )}
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
                                            </tr>
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
