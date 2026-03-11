import connectDB from '@/lib/db/mongodb'
import { TopupRequest, User } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import TopupsTable from './TopupsTable'

export default async function AdminTopupsPage() {
  const session = await getSession()
  if (!session) return null

  await connectDB()

  const [topups, users] = await Promise.all([
    TopupRequest.find().sort({ created_at: -1 }).lean(),
    User.find({ role: 'user' }).select('_id name').lean(),
  ])

  const userMap: Record<string, string> = {}
  users.forEach(u => { userMap[u._id.toString()] = u.name || u._id.toString().slice(0, 8) })

  const serializedTopups = topups.map(t => ({
    id: t._id.toString(),
    user_id: t.user_id.toString(),
    vnd_amount: t.vnd_amount,
    usd_amount: t.usd_amount,
    credit_amount: t.credit_amount,
    transfer_content: t.transfer_content,
    status: t.status,
    type: t.type || 'credit',
    plan_name: t.plan_name || undefined,
    created_at: t.created_at.toISOString(),
  }))

  const pendingCount = topups.filter(t => t.status === 'pending').length

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
            initialTopups={serializedTopups}
            userMap={userMap}
          />
        </CardContent>
      </Card>
    </div>
  )
}
