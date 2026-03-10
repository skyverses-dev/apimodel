import connectDB from '@/lib/db/mongodb'
import { TopupRequest } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { formatVND, formatUSD } from '@/lib/utils/currency'
import { getTranslations, getLocale } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default async function TransactionsPage() {
  const t = await getTranslations()
  const locale = await getLocale()
  const session = await getSession()
  if (!session) return null

  await connectDB()
  const topups = await TopupRequest.find({ user_id: session.userId })
    .sort({ created_at: -1 })
    .lean()

  const statusBadge = (status: string) => {
    if (status === 'approved') return <Badge className="bg-green-600/20 text-green-300 border-green-500/30">{t('topup.approved')}</Badge>
    if (status === 'rejected') return <Badge className="bg-red-600/20 text-red-300 border-red-500/30">{t('topup.rejected')}</Badge>
    return <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/30">{t('topup.pending')}</Badge>
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-2">{t('transactions.title')}</h1>
      <p className="text-slate-400 mb-8">Tất cả giao dịch nạp tiền</p>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          {topups.length === 0 ? (
            <div className="text-center py-16 text-slate-400">{t('transactions.empty')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {[t('transactions.date'), t('transactions.amount'), t('transactions.credit'), t('transactions.transferContent'), t('transactions.status')].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topups.map((row) => (
                    <tr key={row._id.toString()} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {new Date(row.created_at).toLocaleString(locale)}
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-medium">{formatVND(row.vnd_amount)}</td>
                      <td className="px-6 py-4 text-sm text-green-400 font-medium">+{formatUSD(row.credit_amount)}</td>
                      <td className="px-6 py-4">
                        <code className="text-xs text-purple-300 bg-purple-900/20 px-2 py-1 rounded">
                          {row.transfer_content}
                        </code>
                      </td>
                      <td className="px-6 py-4">{statusBadge(row.status)}</td>
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
