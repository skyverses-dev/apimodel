import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, AuditLog } from '@/lib/db/models'
import { getSession } from '@/lib/auth'

/**
 * PATCH /api/admin/users/leverage — Update user leverage
 * Body: { user_id: string, leverage: number }
 */
export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const adminProfile = await User.findById(session.userId).select('role').lean()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { user_id, leverage } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    if (typeof leverage !== 'number' || leverage < 1 || leverage > 200) {
      return NextResponse.json({ error: 'Leverage phải từ 1 đến 200' }, { status: 400 })
    }

    const targetUser = await User.findById(user_id).lean()
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const oldLeverage = targetUser.leverage || 30

    await User.findByIdAndUpdate(user_id, { leverage })

    await AuditLog.create({
      user_id: session.userId,
      action: 'user_leverage_updated',
      details: {
        target_user_id: user_id,
        target_email: targetUser.email,
        old_leverage: oldLeverage,
        new_leverage: leverage,
      },
    })

    return NextResponse.json({
      success: true,
      leverage,
      message: `Đã cập nhật đòn bẩy x${leverage} cho ${targetUser.email}`,
    })
  } catch (err: unknown) {
    console.error('Admin update leverage error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
