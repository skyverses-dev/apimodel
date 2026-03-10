import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, TopupRequest, AuditLog } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { ezai } from '@/lib/ezai/client'

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

    const { topup_id, admin_note } = await request.json()
    if (!topup_id) return NextResponse.json({ error: 'topup_id required' }, { status: 400 })

    const topup = await TopupRequest.findById(topup_id).lean()
    if (!topup) return NextResponse.json({ error: 'Topup request not found' }, { status: 404 })
    if (topup.status !== 'pending') {
      return NextResponse.json({ error: `Cannot approve a ${topup.status} request` }, { status: 400 })
    }

    // Get user profile for EzAI user ID
    const userProfile = await User.findById(topup.user_id).select('ezai_user_id ezai_api_key').lean()
    if (!userProfile?.ezai_user_id) {
      return NextResponse.json({ error: 'User does not have an EzAI account' }, { status: 400 })
    }

    // Call EzAI
    if (topup.type === 'plan' && topup.plan_name) {
      await ezai.activatePlan(userProfile.ezai_user_id, topup.plan_name as 'starter' | 'pro' | 'max' | 'ultra')
    } else {
      await ezai.topupUser(userProfile.ezai_user_id, topup.usd_amount)
    }

    // Update topup request
    const updated = await TopupRequest.findByIdAndUpdate(topup_id, {
      status: 'approved',
      admin_note: admin_note || null,
      approved_by: session.userId,
      approved_at: new Date(),
    }, { new: true }).lean()

    // Audit log
    await AuditLog.create({
      user_id: session.userId,
      action: 'topup_approved',
      details: {
        topup_id,
        target_user_id: topup.user_id.toString(),
        vnd_amount: topup.vnd_amount,
        usd_amount: topup.usd_amount,
        credit_amount: topup.credit_amount,
      },
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('Topup approve error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
