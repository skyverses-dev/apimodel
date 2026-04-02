'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Zap, DollarSign, X, Pencil, Search, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  pro: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  max: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  ultra: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  one_time: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  none: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

const PER_PAGE = 15

interface UserRow {
  id: string
  name: string | null
  email: string
  role: string
  user_code: string | null
  ezai_user_id: string | null
  ezai_api_key: string | null
  leverage: number | null
  created_at: string
}

function planLabel(plan: string) {
  const p = plan.toLowerCase()
  if (p === 'none') return 'Free'
  if (p === 'one_time') return 'One-time'
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success('Đã sao chép!')
        setTimeout(() => setCopied(false), 1500)
      }}
      className="text-slate-500 hover:text-white transition-colors ml-1"
      title="Copy"
    >
      {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
    </button>
  )
}

export default function UsersTable({
  initialUsers, exchangeRate, balanceMap, totalCreditsMap, planMap,
}: {
  initialUsers: UserRow[]
  exchangeRate: number
  balanceMap: Record<string, number>
  totalCreditsMap: Record<string, number>
  planMap: Record<string, string>
}) {
  const [users, setUsers] = useState(initialUsers)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [topupUserId, setTopupUserId] = useState<string | null>(null)
  const [topupAmount, setTopupAmount] = useState('')
  const [topupLoading, setTopupLoading] = useState(false)
  const [leverageEditId, setLeverageEditId] = useState<string | null>(null)
  const [leverageValue, setLeverageValue] = useState('')
  const [leverageLoading, setLeverageLoading] = useState(false)

  // Search & pagination
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const vndValue = parseFloat(topupAmount) || 0
  const usdPreview = vndValue > 0 ? (vndValue / exchangeRate).toFixed(2) : null

  // Filter users
  const filtered = useMemo(() => {
    if (!search) return users
    const q = search.toLowerCase()
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.user_code || '').toLowerCase().includes(q) ||
      (u.ezai_user_id || '').toLowerCase().includes(q)
    )
  }, [users, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageUsers = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  async function provisionUser(userId: string) {
    setLoadingId(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u))
      toast.success('Đã tạo tài khoản 2BRAIN cho user!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tạo tài khoản')
    } finally {
      setLoadingId(null)
    }
  }

  async function manualTopup(userId: string) {
    if (vndValue <= 0) {
      toast.error('Số tiền phải lớn hơn 0')
      return
    }

    setTopupLoading(true)
    try {
      const res = await fetch('/api/admin/users/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, vnd_amount: vndValue }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(data.message || `Đã nạp ${vndValue.toLocaleString()}đ thành công!`)
      setTopupUserId(null)
      setTopupAmount('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi nạp credit')
    } finally {
      setTopupLoading(false)
    }
  }

  async function updateLeverage(userId: string) {
    const val = parseInt(leverageValue)
    if (!val || val < 1 || val > 200) {
      toast.error('Đòn bẩy phải từ 1 đến 200')
      return
    }

    setLeverageLoading(true)
    try {
      const res = await fetch('/api/admin/users/leverage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, leverage: val }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, leverage: val } : u))
      toast.success(data.message || `Đã cập nhật đòn bẩy x${val}`)
      setLeverageEditId(null)
      setLeverageValue('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật đòn bẩy')
    } finally {
      setLeverageLoading(false)
    }
  }

  const COLUMNS = ['User', 'Email', 'Mã user', 'EzAI ID', 'Plan', 'Credit', 'Tổng nạp', 'Đòn bẩy', 'Ngày tạo', '']

  return (
    <div>
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-white/10">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Tìm tên, email, mã user, EzAI ID..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9"
            />
          </div>
          <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 h-9">
            Tìm kiếm
          </Button>
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
              className="text-slate-400 hover:text-white h-9"
            >
              Xoá
            </Button>
          )}
          <div className="ml-auto text-xs text-slate-500 flex items-center gap-1">
            {filtered.length} / {users.length} users
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {COLUMNS.map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageUsers.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="text-center py-12 text-slate-500">
                  {search ? 'Không tìm thấy kết quả' : 'Chưa có người dùng nào'}
                </td>
              </tr>
            ) : (
              pageUsers.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {(user.name || user.email)?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{user.name || 'N/A'}</p>
                        <p className="text-slate-500 text-xs">{user.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">{user.email}</td>
                  <td className="px-4 py-4">
                    {user.user_code ? (
                      <code className="text-xs text-purple-300 bg-purple-900/20 px-2 py-1 rounded">
                        {user.user_code}
                      </code>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  {/* EzAI ID */}
                  <td className="px-4 py-4">
                    {user.ezai_user_id ? (
                      <div className="flex items-center gap-0.5">
                        <code className="text-[11px] text-cyan-300 bg-cyan-900/20 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]" title={user.ezai_user_id}>
                          {user.ezai_user_id}
                        </code>
                        <CopyButton text={user.ezai_user_id} />
                      </div>
                    ) : (
                      <Badge className="bg-slate-600/20 text-slate-400 border-slate-500/30 text-xs">
                        Chưa KH
                      </Badge>
                    )}
                  </td>
                  {/* Plan */}
                  <td className="px-4 py-4">
                    {(() => {
                      const plan = planMap[user.id] || ''
                      if (!plan || !user.ezai_user_id) return <span className="text-slate-600 text-xs">—</span>
                      const planLower = plan.toLowerCase()
                      const badgeClass = PLAN_BADGE[planLower] || PLAN_BADGE['none']
                      return (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
                          {planLabel(plan)}
                        </span>
                      )
                    })()}
                  </td>
                  {/* Credit */}
                  <td className="px-4 py-4">
                    {user.ezai_user_id && balanceMap[user.id] !== undefined ? (
                      <span className={`text-sm font-mono font-medium ${balanceMap[user.id] >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${balanceMap[user.id].toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  {/* Tổng nạp */}
                  <td className="px-4 py-4">
                    {totalCreditsMap[user.id] ? (
                      <span className="text-sm font-mono text-amber-400">${totalCreditsMap[user.id].toFixed(2)}</span>
                    ) : (
                      <span className="text-slate-600 text-xs">$0.00</span>
                    )}
                  </td>
                  {/* Đòn bẩy */}
                  <td className="px-4 py-4">
                    {leverageEditId === user.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-sm">x</span>
                        <input
                          type="number"
                          value={leverageValue}
                          onChange={(e) => setLeverageValue(e.target.value)}
                          min="1"
                          max="200"
                          className="w-14 h-6 px-1.5 text-xs rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:border-amber-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateLeverage(user.id)
                            if (e.key === 'Escape') { setLeverageEditId(null); setLeverageValue('') }
                          }}
                        />
                        {leverageLoading ? (
                          <Loader2 size={12} className="text-amber-400 animate-spin" />
                        ) : (
                          <button
                            onClick={() => { setLeverageEditId(null); setLeverageValue('') }}
                            className="text-slate-500 hover:text-white transition-colors"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => { setLeverageEditId(user.id); setLeverageValue(String(user.leverage || 30)) }}
                        className="group flex items-center gap-1 text-sm text-slate-300 hover:text-amber-300 transition-colors"
                      >
                        x{user.leverage || 30}
                        <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </td>
                  {/* Ngày tạo */}
                  <td className="px-4 py-4 text-sm text-slate-400">
                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {!user.ezai_user_id && user.role === 'user' && (
                        <Button
                          size="sm"
                          onClick={() => provisionUser(user.id)}
                          disabled={loadingId === user.id}
                          className="bg-purple-600 hover:bg-purple-700 h-7 text-xs px-3"
                        >
                          {loadingId === user.id ? (
                            <Loader2 size={12} className="mr-1 animate-spin" />
                          ) : (
                            <Zap size={12} className="mr-1" />
                          )}
                          Kích hoạt
                        </Button>
                      )}

                      {user.ezai_user_id && (
                        <>
                          {topupUserId === user.id ? (
                            <div className="flex items-center gap-1.5">
                              <div>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-amber-400 text-xs font-medium">₫</span>
                                  <input
                                    type="number"
                                    value={topupAmount}
                                    onChange={(e) => setTopupAmount(e.target.value)}
                                    placeholder="50,000"
                                    step="10000"
                                    min="10000"
                                    className="w-24 h-7 pl-5 pr-1 text-xs rounded bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') manualTopup(user.id)
                                      if (e.key === 'Escape') { setTopupUserId(null); setTopupAmount('') }
                                    }}
                                  />
                                </div>
                                {usdPreview && (
                                  <p className="text-[10px] text-emerald-400 mt-0.5 pl-1">
                                    ≈ ${usdPreview} USD
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => manualTopup(user.id)}
                                disabled={topupLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-2"
                              >
                                {topupLoading ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  'Nạp'
                                )}
                              </Button>
                              <button
                                onClick={() => { setTopupUserId(null); setTopupAmount('') }}
                                className="text-slate-500 hover:text-white transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => { setTopupUserId(user.id); setTopupAmount('') }}
                              className="bg-emerald-600/80 hover:bg-emerald-600 h-7 text-xs px-3"
                            >
                              <DollarSign size={12} className="mr-1" />
                              Nạp credit
                            </Button>
                          )}
                        </>
                      )}
                    </div>
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
            Trang {safePage} / {totalPages} · {filtered.length} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="h-8 border-white/10 text-slate-300 hover:bg-white/10"
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(safePage - 2, totalPages - 4))
              const p = start + i
              if (p > totalPages) return null
              return (
                <Button
                  key={p}
                  size="sm"
                  variant={p === safePage ? 'default' : 'outline'}
                  onClick={() => setPage(p)}
                  className={cn(
                    'h-8 w-8 p-0',
                    p === safePage
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
              disabled={safePage >= totalPages}
              className="h-8 border-white/10 text-slate-300 hover:bg-white/10"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
