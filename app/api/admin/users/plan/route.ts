import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, AuditLog } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { ezai } from '@/lib/ezai/client'

const VALID_PLANS = ['starter', 'pro', 'max', 'ultra'] as const

/**
 * POST /api/admin/users/plan — Admin manually activate a plan for a user
 * Body: { user_id: string, plan: 'starter' | 'pro' | 'max' | 'ultra' }
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const adminProfile = await User.findById(session.userId).select('role').lean()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { user_id, plan } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    if (!plan || !VALID_PLANS.includes(plan)) {
      return NextResponse.json({ error: `Plan phải là: ${VALID_PLANS.join(', ')}` }, { status: 400 })
    }

    const targetUser = await User.findById(user_id).lean()
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (!targetUser.ezai_user_id) {
      return NextResponse.json({ error: 'User chưa kích hoạt EzAI. Hãy kích hoạt trước.' }, { status: 400 })
    }

    // Activate plan on EzAI
    await ezai.activatePlan(targetUser.ezai_user_id, plan as typeof VALID_PLANS[number])

    // Audit log
    await AuditLog.create({
      user_id: session.userId,
      action: 'admin_activate_plan',
      details: {
        target_user_id: user_id,
        target_email: targetUser.email,
        plan,
        ezai_user_id: targetUser.ezai_user_id,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Đã kích hoạt gói ${plan.toUpperCase()} cho ${targetUser.email}`,
      plan,
    })
  } catch (err: unknown) {
    console.error('Admin activate plan error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
