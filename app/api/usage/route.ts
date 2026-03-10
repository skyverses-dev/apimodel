import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('rb_users')
      .select('ezai_user_id')
      .eq('id', user.id)
      .single()

    if (!profile?.ezai_user_id) {
      return NextResponse.json(ZERO_USAGE)
    }

    const ezaiUserId = profile.ezai_user_id

    // Start of current month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [ezaiUserResult, ezaiTxResult, topupsResult] = await Promise.allSettled([
      ezai.getUser(ezaiUserId),
      ezai.getTransactions(ezaiUserId, 20),
      admin
        .from('rb_topup_requests')
        .select('vnd_amount, credit_amount')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .gte('approved_at', monthStart),
    ])

    // EzAI user data
    const ezaiUser = ezaiUserResult.status === 'fulfilled' ? ezaiUserResult.value : null

    // EzAI transactions (already filtered by end_user_id on server)
    const userTx = ezaiTxResult.status === 'fulfilled' ? ezaiTxResult.value.transactions : []

    // Monthly topups from our DB
    const topups = topupsResult.status === 'fulfilled' ? (topupsResult.value.data ?? []) : []
    const monthly_topup_vnd = topups.reduce((s, t) => s + Number(t.vnd_amount), 0)
    const monthly_topup_credit = topups.reduce((s, t) => s + Number(t.credit_amount), 0)

    const result: UsageData = {
      balance: ezaiUser?.balance ?? 0,
      plan_type: ezaiUser?.plan_type ?? 'none',
      daily_limit: ezaiUser?.daily_limit ?? 0,
      daily_used: ezaiUser?.daily_used ?? 0,
      plan_expires_at: ezaiUser?.plan_expires_at ?? null,
      transactions: userTx,
      monthly_topup_vnd,
      monthly_topup_credit,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Usage API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
