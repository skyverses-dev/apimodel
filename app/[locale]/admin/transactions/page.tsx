import connectDB from '@/lib/db/mongodb'
import { TopupRequest, User } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { formatVND, formatUSD } from '@/lib/utils/currency'
import { getLocale } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default async function AdminTransactionsPage() {
  const locale = await getLocale()
  const session = await getSession()
  if (!session) return null

  await connectDB()

  const [topups, users] = await Promise.all([
    TopupRequest.find().sort({ created_at: -1 }).lean(),
    User.find({ role: 'user' }).select('_id name').lean(),
  ])

  const userMap: Record<string, string> = {}
  users.forEach(u => { userMap[u._id.toString()] = u.name || u._id.toString().slice(0, 8) })

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Lịch sử giao dịch</h1>
      <p className="text-slate-400 text-sm mb-8">Tất cả giao dịch nạp tiền trong hệ thống</p>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          {topups.length === 0 ? (
            <div className="text-center py-16 text-slate-400">Chưa có giao dịch nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Thời gian', 'User', 'Loại', 'VND', 'USD', 'Credit', 'Nội dung CK', 'Trạng thái'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topups.map((row) => (
                    <tr key={row._id.toString()} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 text-sm text-slate-300 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString(locale)}
                      </td>
                      <td className="px-5 py-4 text-sm text-white">
                        {userMap[row.user_id.toString()] || row.user_id.toString().slice(0, 8)}
                      </td>
                      <td className="px-5 py-4">
                        {row.type === 'plan' ? (
                          <Badge className="bg-pink-600/20 text-pink-300 border-pink-500/30">
                            Gói {row.plan_name?.toUpperCase()}
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                            Credit
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-white font-medium">{formatVND(row.vnd_amount)}</td>
                      <td className="px-5 py-4 text-sm text-slate-300">{formatUSD(row.usd_amount)}</td>
                      <td className="px-5 py-4 text-sm text-green-400 font-medium">
                        {row.type === 'plan' ? `Gói ${row.plan_name}` : `+${formatUSD(row.credit_amount)}`}
                      </td>
                      <td className="px-5 py-4">
                        <code className="text-xs text-purple-300 bg-purple-900/20 px-2 py-1 rounded">
                          {row.transfer_content}
                        </code>
                      </td>
                      <td className="px-5 py-4">
                        {row.status === 'approved' && <Badge className="bg-green-600/20 text-green-300 border-green-500/30">Đã duyệt</Badge>}
                        {row.status === 'rejected' && <Badge className="bg-red-600/20 text-red-300 border-red-500/30">Từ chối</Badge>}
                        {row.status === 'pending' && <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/30">Chờ duyệt</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
