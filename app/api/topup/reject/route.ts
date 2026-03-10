import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, TopupRequest, AuditLog } from '@/lib/db/models'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const adminProfile = await User.findById(session.userId).select('role').lean()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { topup_id, admin_note } = await request.json()
    if (!topup_id) return NextResponse.json({ error: 'topup_id required' }, { status: 400 })

    const topup = await TopupRequest.findById(topup_id).select('status').lean()
    if (!topup) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (topup.status !== 'pending') {
      return NextResponse.json({ error: `Cannot reject a ${topup.status} request` }, { status: 400 })
    }

    const updated = await TopupRequest.findByIdAndUpdate(topup_id, {
      status: 'rejected',
      admin_note: admin_note || null,
      approved_by: session.userId,
      approved_at: new Date(),
    }, { new: true }).lean()

    await AuditLog.create({
      user_id: session.userId,
      action: 'topup_rejected',
      details: { topup_id, admin_note },
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('Topup reject error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
