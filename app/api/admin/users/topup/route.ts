import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, AuditLog, Settings } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { ezai } from '@/lib/ezai/client'

/**
 * POST /api/admin/users/topup — Admin manually top up credit for a user
 * Body: { user_id: string, vnd_amount: number }
 * Auto-converts VND → USD using exchange rate from Settings
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    // Check admin role
    const adminProfile = await User.findById(session.userId).select('role').lean()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { user_id, vnd_amount } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    if (!vnd_amount || vnd_amount <= 0) return NextResponse.json({ error: 'vnd_amount must be > 0' }, { status: 400 })

    const [targetUser, settings] = await Promise.all([
      User.findById(user_id).lean(),
      Settings.findOne().lean(),
    ])

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (!targetUser.ezai_user_id) {
      return NextResponse.json({ error: 'User chưa kích hoạt EzAI. Hãy kích hoạt trước.' }, { status: 400 })
    }

    // Convert VND → USD → Credit (with leverage)
    const exchangeRate = settings?.exchange_rate || 26000
    const leverage = targetUser.leverage || settings?.user_leverage || 15
    const usdAmount = vnd_amount / exchangeRate
    const creditAmount = usdAmount * leverage

    // Top up on EzAI (send credit amount = USD × leverage)
    await ezai.topupUser(targetUser.ezai_user_id, creditAmount)

    // Audit log
    await AuditLog.create({
      user_id: session.userId,
      action: 'admin_manual_topup',
      details: {
        target_user_id: user_id,
        target_email: targetUser.email,
        vnd_amount,
        usd_amount: usdAmount,
        credit_amount: creditAmount,
        leverage,
        exchange_rate: exchangeRate,
        ezai_user_id: targetUser.ezai_user_id,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Đã nạp ${vnd_amount.toLocaleString()}đ ($${creditAmount.toFixed(2)} credit, x${leverage}) cho ${targetUser.email}`,
      vnd_amount,
      usd_amount: usdAmount,
      credit_amount: creditAmount,
      leverage,
      exchange_rate: exchangeRate,
    })
  } catch (err: unknown) {
    console.error('Admin manual topup error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
