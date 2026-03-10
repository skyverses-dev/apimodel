import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TopupsTable from './TopupsTable'

export default async function AdminTopupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const [{ data: topups }, { data: users }] = await Promise.all([
    admin.from('rb_topup_requests').select('*').order('created_at', { ascending: false }),
    admin.from('rb_users').select('id, name').eq('role', 'user'),
  ])

  // Build user ID → name map
  const userMap: Record<string, string> = {}
  users?.forEach(u => { userMap[u.id] = u.name || u.id.slice(0, 8) })

  const pendingCount = topups?.filter(t => t.status === 'pending').length || 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">Duyệt nạp tiền</h1>
        {pendingCount > 0 && (
          <span className="bg-yellow-500/20 text-yellow-300 text-sm px-3 py-1 rounded-full">
            {pendingCount} đang chờ
          </span>
        )}
      </div>
      <p className="text-slate-400 mb-8">Xem xét và xác nhận các yêu cầu chuyển khoản</p>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0 pt-4 px-4">
          <TopupsTable
            initialTopups={topups || []}
            userMap={userMap}
          />
        </CardContent>
      </Card>
    </div>
  )
}
