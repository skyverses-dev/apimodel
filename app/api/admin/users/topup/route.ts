import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, AuditLog } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { ezai } from '@/lib/ezai/client'

/**
 * POST /api/admin/users/topup — Admin manually top up credit for a user
 * Body: { user_id: string, usd_amount: number }
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

    const { user_id, usd_amount } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    if (!usd_amount || usd_amount <= 0) return NextResponse.json({ error: 'usd_amount must be > 0' }, { status: 400 })

    const targetUser = await User.findById(user_id).lean()
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (!targetUser.ezai_user_id) {
      return NextResponse.json({ error: 'User chưa kích hoạt EzAI. Hãy kích hoạt trước.' }, { status: 400 })
    }

    // Top up on EzAI
    await ezai.topupUser(targetUser.ezai_user_id, usd_amount)

    // Audit log
    await AuditLog.create({
      user_id: session.userId,
      action: 'admin_manual_topup',
      details: {
        target_user_id: user_id,
        target_email: targetUser.email,
        usd_amount,
        ezai_user_id: targetUser.ezai_user_id,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Đã nạp $${usd_amount} cho ${targetUser.email}`,
      usd_amount,
    })
  } catch (err: unknown) {
    console.error('Admin manual topup error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
