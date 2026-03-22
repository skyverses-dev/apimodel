import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, TopupRequest } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { ezai } from '@/lib/ezai/client'
import { UsageData } from '@/types'

const ZERO_USAGE: UsageData = {
  balance: 0,
  plan_type: 'none',
  daily_limit: 0,
  daily_used: 0,
  plan_expires_at: null,
  transactions: [],
  monthly_topup_vnd: 0,
  monthly_topup_credit: 0,
  spending_today: 0,
  requests_today: 0,
  spending_30d: 0,
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const profile = await User.findById(session.userId).select('ezai_user_id').lean()

    if (!profile?.ezai_user_id) {
      return NextResponse.json(ZERO_USAGE)
    }

    const ezaiUserId = profile.ezai_user_id

    // Start of current month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [ezaiUserResult, ezaiTxResult, topups, usageLogs] = await Promise.allSettled([
      ezai.getUser(ezaiUserId),
      ezai.getTransactions(ezaiUserId, 20),
      TopupRequest.find({
        user_id: session.userId,
        status: 'approved',
        approved_at: { $gte: monthStart },
      }).select('vnd_amount credit_amount').lean(),
      ezai.getAllUsage(ezaiUserId),
    ])

    const ezaiUser = ezaiUserResult.status === 'fulfilled' ? ezaiUserResult.value : null
    const userTx = ezaiTxResult.status === 'fulfilled' ? ezaiTxResult.value.transactions : []
    const monthlyTopups = topups.status === 'fulfilled' ? topups.value : []
    const usage = usageLogs.status === 'fulfilled' ? usageLogs.value.usage : []

    const monthly_topup_vnd = monthlyTopups.reduce((s, t) => s + Number(t.vnd_amount), 0)
    const monthly_topup_credit = monthlyTopups.reduce((s, t) => s + Number(t.credit_amount), 0)

    // Compute spending stats from usage logs
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    let spending_today = 0
    let requests_today = 0
    let spending_30d = 0

    for (const log of usage) {
      const logDate = new Date(log.created_at)
      const cost = log.cost || 0

      if (logDate >= todayStart) {
        spending_today += cost
        requests_today += 1
      }
      if (logDate >= thirtyDaysAgo) {
        spending_30d += cost
      }
    }
    console.log('ezaiUser', ezaiUser)

    const result: UsageData = {
      balance: ezaiUser?.balance ?? 0,
      plan_type: ezaiUser?.plan_type ?? 'none',
      daily_limit: ezaiUser?.daily_limit ?? 0,
      daily_used: ezaiUser?.daily_used ?? 0,
      plan_expires_at: ezaiUser?.plan_expires_at ?? null,
      transactions: userTx,
      monthly_topup_vnd,
      monthly_topup_credit,
      spending_today,
      requests_today,
      spending_30d,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Usage API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
