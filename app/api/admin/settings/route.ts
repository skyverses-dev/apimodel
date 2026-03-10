import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, Settings, AuditLog } from '@/lib/db/models'
import { getSession } from '@/lib/auth'

// GET /api/admin/settings
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const adminProfile = await User.findById(session.userId).select('role').lean()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await Settings.findOne().lean()
    return NextResponse.json(settings || {})
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/admin/settings — update settings
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const adminProfile = await User.findById(session.userId).select('role').lean()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Upsert: find existing or create new
    await Settings.findOneAndUpdate(
      {},
      { $set: body },
      { upsert: true, new: true }
    )

    await AuditLog.create({
      user_id: session.userId,
      action: 'settings_updated',
      details: body,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Admin settings error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
