'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Zap, DollarSign, X, Pencil } from 'lucide-react'

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

export default function UsersTable({ initialUsers, exchangeRate }: { initialUsers: UserRow[]; exchangeRate: number }) {
  const [users, setUsers] = useState(initialUsers)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [topupUserId, setTopupUserId] = useState<string | null>(null)
  const [topupAmount, setTopupAmount] = useState('')
  const [topupLoading, setTopupLoading] = useState(false)
  const [leverageEditId, setLeverageEditId] = useState<string | null>(null)
  const [leverageValue, setLeverageValue] = useState('')
  const [leverageLoading, setLeverageLoading] = useState(false)

  const vndValue = parseFloat(topupAmount) || 0
  const usdPreview = vndValue > 0 ? (vndValue / exchangeRate).toFixed(2) : null

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

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            {['User', 'Email', 'Mã user', '2BRAIN', 'Đòn bẩy', 'Ngày tạo', ''].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-slate-500">
                Chưa có người dùng nào
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
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
                <td className="px-4 py-4">
                  {user.ezai_user_id ? (
                    <Badge className="bg-green-600/20 text-green-300 border-green-500/30 text-xs">
                      Đã kích hoạt
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-600/20 text-slate-400 border-slate-500/30 text-xs">
                      Chưa kích hoạt
                    </Badge>
                  )}
                </td>
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
                <td className="px-4 py-4 text-sm text-slate-400">
                  {new Date(user.created_at).toLocaleDateString('vi-VN')}
                </td>
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
  )
}
