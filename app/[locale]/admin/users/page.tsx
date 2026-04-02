import connectDB from '@/lib/db/mongodb'
import { User, Settings, TopupRequest, AuditLog } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { ezai } from '@/lib/ezai/client'
import UsersTable from './UsersTable'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session) return null

  await connectDB()

  const [profiles, settings] = await Promise.all([
    User.find({ role: 'user' }).sort({ created_at: -1 }).lean(),
    Settings.findOne().lean(),
  ])

  const usersWithEmail = profiles.map(p => ({
    ...p,
    id: p._id.toString(),
    email: p.email,
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
  }))

  // Fetch balances + plan_type from EzAPI for all activated users
  const balanceMap: Record<string, number> = {}
  const planMap: Record<string, string> = {}
  const activatedUsers = profiles.filter(p => p.ezai_user_id)
  await Promise.allSettled(
    activatedUsers.map(async (p) => {
      try {
        const ezUser = await ezai.getUser(p.ezai_user_id!)
        balanceMap[p._id.toString()] = ezUser.balance
        planMap[p._id.toString()] = ezUser.plan_type || 'none'
      } catch {
        // silently skip — user might not exist on EzAPI
      }
    })
  )

  // Aggregate total credits per user from approved topups + admin manual topups
  const totalCreditsMap: Record<string, number> = {}

  // 1) Sum credit_amount from approved TopupRequests
  const topupAgg = await TopupRequest.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: '$user_id', total: { $sum: '$credit_amount' } } },
  ])
  for (const row of topupAgg) {
    const uid = row._id.toString()
    totalCreditsMap[uid] = (totalCreditsMap[uid] || 0) + row.total
  }

  // 2) Sum credit_amount from AuditLog admin_manual_topup entries
  const auditAgg = await AuditLog.aggregate([
    { $match: { action: 'admin_manual_topup' } },
    { $group: { _id: '$details.target_user_id', total: { $sum: '$details.credit_amount' } } },
  ])
  for (const row of auditAgg) {
    const uid = String(row._id)
    totalCreditsMap[uid] = (totalCreditsMap[uid] || 0) + row.total
  }

  const exchangeRate = settings?.exchange_rate || 26000

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-2">Quản lý người dùng</h1>
      <p className="text-slate-400 mb-8">
        Danh sách người dùng và trạng thái tài khoản 2BRAIN
      </p>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          <UsersTable initialUsers={usersWithEmail} exchangeRate={exchangeRate} balanceMap={balanceMap} totalCreditsMap={totalCreditsMap} planMap={planMap} />
        </CardContent>
      </Card>
    </div>
  )
}
