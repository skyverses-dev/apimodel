'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, UserPlus, Zap } from 'lucide-react'

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

export default function UsersTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [loadingId, setLoadingId] = useState<string | null>(null)

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
                <td className="px-4 py-4 text-sm text-slate-300">
                  x{user.leverage || 30}
                </td>
                <td className="px-4 py-4 text-sm text-slate-400">
                  {new Date(user.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-4">
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
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
