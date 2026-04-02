import connectDB from '@/lib/db/mongodb'
import { TopupRequest } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { getTranslations, getLocale } from 'next-intl/server'
import TransactionsTable from './TransactionsTable'

export default async function TransactionsPage() {
  const t = await getTranslations()
  const locale = await getLocale()
  const session = await getSession()
  if (!session) return null

  await connectDB()
  const topups = await TopupRequest.find({ user_id: session.userId })
    .sort({ created_at: -1 })
    .lean()

  const serializedTopups = topups.map(row => ({
    id: row._id.toString(),
    vnd_amount: row.vnd_amount,
    credit_amount: row.credit_amount,
    transfer_content: row.transfer_content,
    status: row.status,
    type: row.type || 'credit',
    plan_name: row.plan_name || undefined,
    created_at: row.created_at.toISOString(),
  }))

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{t('transactions.title')}</h1>
        <p className="text-slate-400 text-sm">Tất cả giao dịch nạp tiền</p>
      </div>

      <TransactionsTable
        transactions={serializedTopups}
        locale={locale}
      />
    </div>
  )
}
