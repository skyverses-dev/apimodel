'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CheckCircle, XCircle, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const PER_PAGE = 20

interface TopupRequest {
  id: string
  user_id: string
  vnd_amount: number
  usd_amount: number
  credit_amount: number
  transfer_content: string
  status: string
  type: string
  plan_name?: string
  admin_note?: string
  created_at: string
}

interface ApprovalDialogProps {
  topup: TopupRequest | null
  action: 'approve' | 'reject'
  onClose: () => void
  onSuccess: () => void
}

function ApprovalDialog({ topup, action, onClose, onSuccess }: ApprovalDialogProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!topup) return
    setLoading(true)
    try {
      const endpoint = action === 'approve' ? '/api/topup/approve' : '/api/topup/reject'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topup_id: topup.id, admin_note: note }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(action === 'approve' ? 'Đã duyệt thành công!' : 'Đã từ chối!')
      onSuccess()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xử lý')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!topup} onOpenChange={() => onClose()}>
      <DialogContent className="bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'approve' ? (
              <CheckCircle size={20} className="text-green-400" />
            ) : (
              <XCircle size={20} className="text-red-400" />
            )}
            {action === 'approve' ? 'Duyệt nạp tiền' : 'Từ chối nạp tiền'}
          </DialogTitle>
        </DialogHeader>

        {topup && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Nội dung CK:</span>
                <code className="text-purple-300">{topup.transfer_content}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tiền VND:</span>
                <span className="text-white font-medium">
                  {topup.vnd_amount.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">USD tương đương:</span>
                <span className="text-white">${topup.usd_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Credit thêm vào:</span>
                <span className="text-green-400 font-bold">+${topup.credit_amount.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Ghi chú (tuỳ chọn)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú cho người dùng..."
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/10 text-white hover:bg-white/10">
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {loading && <Loader2 size={14} className="mr-2 animate-spin" />}
            {action === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface TopupsTableProps {
  initialTopups: TopupRequest[]
  userMap: Record<string, { name: string; email: string; ezai_user_id: string | null }>
}

export default function TopupsTable({ initialTopups, userMap }: TopupsTableProps) {
  const { locale } = useParams<{ locale: string }>()
  const [topups, setTopups] = useState(initialTopups)
  const [selectedTopup, setSelectedTopup] = useState<TopupRequest | null>(null)
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject'>('approve')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  // Search & pagination
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  function openDialog(topup: TopupRequest, action: 'approve' | 'reject') {
    setSelectedTopup(topup)
    setDialogAction(action)
  }

  function handleSuccess() {
    setTopups(prev =>
      prev.map(t =>
        t.id === selectedTopup?.id
          ? { ...t, status: dialogAction === 'approve' ? 'approved' : 'rejected' }
          : t
      )
    )
    setSelectedTopup(null)
  }

  // Filter + search
  const filtered = useMemo(() => {
    let result = topups.filter(t => filter === 'all' || t.status === filter)

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t => {
        const user = userMap[t.user_id]
        return (
          (user?.name || '').toLowerCase().includes(q) ||
          (user?.email || '').toLowerCase().includes(q) ||
          (user?.ezai_user_id || '').toLowerCase().includes(q) ||
          t.transfer_content.toLowerCase().includes(q) ||
          (t.admin_note || '').toLowerCase().includes(q) ||
          t.user_id.toLowerCase().includes(q) ||
          (t.plan_name || '').toLowerCase().includes(q)
        )
      })
    }

    return result
  }, [topups, filter, search, userMap])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  // Count per status for badges
  const counts = useMemo(() => ({
    pending: topups.filter(t => t.status === 'pending').length,
    approved: topups.filter(t => t.status === 'approved').length,
    rejected: topups.filter(t => t.status === 'rejected').length,
    all: topups.length,
  }), [topups])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <>
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${filter === f
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
            >
              {f === 'pending' ? 'Chờ duyệt' :
                f === 'approved' ? 'Đã duyệt' :
                  f === 'rejected' ? 'Đã từ chối' : 'Tất cả'}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-white/20' : 'bg-white/10'}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 sm:ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Tìm user, mã CK, ghi chú..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-8 text-xs w-56"
            />
          </div>
          <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 text-xs">
            Tìm
          </Button>
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
              className="text-slate-400 hover:text-white h-8 text-xs"
            >
              Xoá
            </Button>
          )}
        </form>
      </div>

      {/* Result info */}
      {search && (
        <p className="text-xs text-slate-500 mb-3">
          Tìm thấy {filtered.length} kết quả cho &quot;{search}&quot;
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {['Thời gian', 'User', 'Email', 'EzAI ID', 'Loại', 'VND', 'USD', 'Credit', 'Nội dung CK', 'Trạng thái', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-slate-500">
                  {search ? 'Không tìm thấy kết quả' : 'Không có yêu cầu nào'}
                </td>
              </tr>
            ) : (
              pageItems.map((topup) => (
                <tr key={topup.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4 text-sm text-slate-300 whitespace-nowrap">
                    {new Date(topup.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-4 text-sm text-white">
                    {userMap[topup.user_id]?.name || topup.user_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-4 text-xs max-w-[180px] truncate" title={userMap[topup.user_id]?.email || ''}>
                    {userMap[topup.user_id]?.email ? (
                      <Link
                        href={`/${locale}/admin/users?search=${encodeURIComponent(userMap[topup.user_id].email)}`}
                        className="text-slate-400 hover:text-purple-300 underline underline-offset-2 decoration-slate-600 hover:decoration-purple-400 transition-colors"
                      >
                        {userMap[topup.user_id].email}
                      </Link>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {userMap[topup.user_id]?.ezai_user_id ? (
                      <Link
                        href={`/${locale}/admin/ezai-users?search=${encodeURIComponent(userMap[topup.user_id].ezai_user_id!)}`}
                        className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-200 transition-colors inline-block"
                        title={`Xem trên EzAI: ${userMap[topup.user_id].ezai_user_id}`}
                      >
                        {userMap[topup.user_id].ezai_user_id!.slice(0, 10)}…
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {topup.type === 'plan' ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-pink-500/20 text-pink-300">Gói {topup.plan_name?.toUpperCase()}</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">Credit</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-white font-medium whitespace-nowrap">
                    {topup.vnd_amount.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">
                    ${topup.usd_amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-sm text-green-400 font-medium">
                    +${topup.credit_amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <code className="text-xs text-purple-300 bg-purple-900/20 px-2 py-1 rounded">
                      {topup.transfer_content}
                    </code>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      {topup.status === 'approved' && topup.admin_note?.includes('EzAI FAILED') ? (
                        <>
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 inline-block w-fit">⚠ EzAI Failed</span>
                          <span className="text-[10px] text-red-400/80 max-w-[200px] truncate" title={topup.admin_note}>
                            {topup.admin_note?.match(/\[EzAI FAILED: (.+?)\]/)?.[1] || 'Credit chưa được cộng'}
                          </span>
                        </>
                      ) : topup.status === 'approved' && topup.admin_note?.includes('webhook') ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 inline-block w-fit">Auto ✓ Webhook</span>
                      ) : topup.status === 'approved' ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300 inline-block w-fit">Admin duyệt</span>
                      ) : topup.status === 'rejected' ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 inline-block w-fit">Từ chối</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 inline-block w-fit">Chờ duyệt</span>
                      )}
                      {topup.admin_note && !topup.admin_note.includes('EzAI FAILED') && (
                        <span className="text-[10px] text-slate-500 max-w-[200px] truncate" title={topup.admin_note}>
                          {topup.admin_note}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {topup.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => openDialog(topup, 'approve')}
                          className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs px-3"
                        >
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(topup, 'reject')}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-7 text-xs px-3"
                        >
                          Từ chối
                        </Button>
                      </div>
                    )}
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
            Trang {safePage} / {totalPages} · {filtered.length} yêu cầu
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

      <ApprovalDialog
        topup={selectedTopup}
        action={dialogAction}
        onClose={() => setSelectedTopup(null)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
