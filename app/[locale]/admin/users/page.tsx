import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import UsersTable from './UsersTable'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  // Get all users + their emails from auth
  const { data: profiles } = await admin
    .from('rb_users')
    .select('*')
    .eq('role', 'user')
    .order('created_at', { ascending: false })

  // Get emails from auth.users
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers()
  const emailMap: Record<string, string> = {}
  authUsers?.forEach(u => { emailMap[u.id] = u.email || '' })

  const usersWithEmail = (profiles || []).map(p => ({
    ...p,
    email: emailMap[p.id] || '',
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
