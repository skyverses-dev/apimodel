'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

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
  userMap: Record<string, string>
}

export default function TopupsTable({ initialTopups, userMap }: TopupsTableProps) {
  const [topups, setTopups] = useState(initialTopups)
  const [selectedTopup, setSelectedTopup] = useState<TopupRequest | null>(null)
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject'>('approve')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

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

  const filtered = topups.filter(t => filter === 'all' || t.status === filter)

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${filter === f
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
          >
            {f === 'pending' ? 'Chờ duyệt' :
              f === 'approved' ? 'Đã duyệt' :
                f === 'rejected' ? 'Đã từ chối' : 'Tất cả'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {['Thời gian', 'User', 'Loại', 'VND', 'USD', 'Credit', 'Nội dung CK', 'Trạng thái', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-500">
                  Không có yêu cầu nào
                </td>
              </tr>
            ) : (
              filtered.map((topup) => (
                <tr key={topup.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4 text-sm text-slate-300 whitespace-nowrap">
                    {new Date(topup.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-4 text-sm text-white">
                    {userMap[topup.user_id] || topup.user_id.slice(0, 8)}
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
                    <span className={`text-xs px-2 py-1 rounded-full ${topup.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                        topup.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                          'bg-yellow-500/20 text-yellow-300'
                      }`}>
                      {topup.status === 'approved' ? 'Đã duyệt' :
                        topup.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    </span>
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

      <ApprovalDialog
        topup={selectedTopup}
        action={dialogAction}
        onClose={() => setSelectedTopup(null)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
