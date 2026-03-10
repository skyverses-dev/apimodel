import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import UsersTable from './UsersTable'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session) return null

  await connectDB()

  const profiles = await User.find({ role: 'user' })
    .sort({ created_at: -1 })
    .lean()

  const usersWithEmail = profiles.map(p => ({
    ...p,
    id: p._id.toString(),
    email: p.email,
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
  }))

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-2">Quản lý người dùng</h1>
      <p className="text-slate-400 mb-8">
        Danh sách người dùng và trạng thái tài khoản EzAI
      </p>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          <UsersTable initialUsers={usersWithEmail} />
        </CardContent>
      </Card>
    </div>
  )
}
