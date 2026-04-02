'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ChevronLeft, ChevronRight, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatVND, formatUSD } from '@/lib/utils/currency'

const PER_PAGE = 10

interface Transaction {
  id: string
  vnd_amount: number
  credit_amount: number
  transfer_content: string
  status: string
  type: string
  plan_name?: string
  created_at: string
}

type SortField = 'created_at' | 'vnd_amount' | 'credit_amount'
type SortDir = 'asc' | 'desc'

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', bg: 'bg-yellow-600/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
  approved: { label: 'Đã duyệt', bg: 'bg-green-600/20', text: 'text-green-300', border: 'border-green-500/30' },
  rejected: { label: 'Từ chối', bg: 'bg-red-600/20', text: 'text-red-300', border: 'border-red-500/30' },
} as const

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
  return <Badge className={`${config.bg} ${config.text} ${config.border}`}>{config.label}</Badge>
}

function TypeBadge({ type, planName }: { type: string; planName?: string }) {
  if (type === 'plan') {
    return <Badge className="bg-pink-600/20 text-pink-300 border-pink-500/30">Gói {planName?.toUpperCase()}</Badge>
  }
  return <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">Nạp credit</Badge>
}

interface TransactionsTableProps {
  transactions: Transaction[]
  locale: string
}

export default function TransactionsTable({ transactions, locale }: TransactionsTableProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Counts per status
  const counts = useMemo(() => ({
    all: transactions.length,
    pending: transactions.filter(t => t.status === 'pending').length,
    approved: transactions.filter(t => t.status === 'approved').length,
    rejected: transactions.filter(t => t.status === 'rejected').length,
  }), [transactions])

  // Filter + Search + Sort
  const filtered = useMemo(() => {
    let result = transactions

    // Status filter
    if (filter !== 'all') {
      result = result.filter(t => t.status === filter)
    }

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.transfer_content.toLowerCase().includes(q) ||
        t.vnd_amount.toLocaleString('vi-VN').includes(q) ||
        (t.plan_name || '').toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
      )
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortField === 'created_at') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortField === 'vnd_amount') {
        cmp = a.vnd_amount - b.vnd_amount
      } else if (sortField === 'credit_amount') {
        cmp = a.credit_amount - b.credit_amount
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [transactions, filter, search, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  function clearSearch() {
    setSearch('')
    setSearchInput('')
    setPage(1)
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-slate-600" />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-purple-400" />
      : <ArrowDown size={12} className="text-purple-400" />
  }

  // Calculate total for filtered results
  const totalVND = useMemo(() =>
    filtered.reduce((sum, t) => t.status === 'approved' ? sum + t.vnd_amount : sum, 0),
    [filtered]
  )

  return (
    <div className="space-y-4">
      {/* Search & Filters Bar */}
      <div className="flex flex-col gap-4">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1) }}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5',
                filter === f
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
              )}
            >
              {f === 'all' ? 'Tất cả' :
                f === 'pending' ? '⏳ Chờ duyệt' :
                  f === 'approved' ? '✅ Đã duyệt' : '❌ Từ chối'}
              <span className={cn(
                'text-[10px] min-w-[18px] text-center px-1.5 py-0.5 rounded-full',
                filter === f ? 'bg-white/20' : 'bg-white/10'
              )}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Tìm mã CK, số tiền, gói..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm focus:border-purple-500/50 focus:ring-purple-500/20"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-500 h-9 px-4 text-sm">
            Tìm kiếm
          </Button>
        </form>
      </div>

      {/* Search result info */}
      {search && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">
            Tìm thấy <strong className="text-white">{filtered.length}</strong> kết quả cho &quot;{search}&quot;
          </span>
          <button onClick={clearSearch} className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
            Xoá tìm kiếm
          </button>
        </div>
      )}

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2.5 bg-white/[0.03] rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Tổng GD:</span>
            <span className="text-white font-medium">{filtered.length}</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Đã duyệt:</span>
            <span className="text-emerald-400 font-medium">{formatVND(totalVND)}</span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-slate-600 text-4xl mb-3">{search ? '🔍' : '📋'}</div>
            <p className="text-slate-400 text-sm">
              {search ? `Không tìm thấy kết quả cho "${search}"` : 'Chưa có giao dịch nào'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th
                      onClick={() => toggleSort('created_at')}
                      className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        Ngày <SortIcon field="created_at" />
                      </span>
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider">Loại</th>
                    <th
                      onClick={() => toggleSort('vnd_amount')}
                      className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        Số tiền <SortIcon field="vnd_amount" />
                      </span>
                    </th>
                    <th
                      onClick={() => toggleSort('credit_amount')}
                      className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        Credit <SortIcon field="credit_amount" />
                      </span>
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider">Nội dung CK</th>
                    <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map(row => (
                    <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                      <td className="px-5 py-4 text-sm text-slate-300 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString(locale)}
                      </td>
                      <td className="px-5 py-4">
                        <TypeBadge type={row.type} planName={row.plan_name} />
                      </td>
                      <td className="px-5 py-4 text-sm text-white font-medium whitespace-nowrap">
                        {formatVND(row.vnd_amount)}
                      </td>
                      <td className="px-5 py-4 text-sm text-green-400 font-medium">
                        {row.type === 'plan' ? `Gói ${row.plan_name}` : `+${formatUSD(row.credit_amount)}`}
                      </td>
                      <td className="px-5 py-4">
                        <code className="text-xs text-purple-300 bg-purple-900/20 px-2 py-1 rounded font-mono">
                          {row.transfer_content}
                        </code>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-white/[0.02]">
                <p className="text-xs text-slate-500">
                  Trang <strong className="text-slate-300">{safePage}</strong> / {totalPages} · {filtered.length} giao dịch
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="h-8 w-8 p-0 border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30"
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
                          'h-8 w-8 p-0 text-xs',
                          p === safePage
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
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
                    className="h-8 w-8 p-0 border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
