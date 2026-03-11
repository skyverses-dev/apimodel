import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, AuditLog } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { ezai } from '@/lib/ezai/client'

// GET /api/admin/users — list all users
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const adminProfile = await User.findById(session.userId).select('role').lean()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await User.find().sort({ created_at: -1 }).lean()
    const serialized = users.map(u => ({
      ...u,
      id: u._id.toString(),
      _id: u._id.toString(),
      created_at: u.created_at.toISOString(),
      updated_at: u.updated_at.toISOString(),
    }))

    return NextResponse.json(serialized)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/admin/users — provision EzAI account for user
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const adminProfile = await User.findById(session.userId).select('role').lean()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { user_id } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const targetUser = await User.findById(user_id).lean()
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // If already provisioned, just return success
    if (targetUser.ezai_user_id) {
      return NextResponse.json({ message: 'Already activated', ezai_user_id: targetUser.ezai_user_id })
    }

    let ezaiUserId: string
    let ezaiApiKey: string

    try {
      // Try to create new EzAI user
      const ezaiUser = await ezai.createUser(targetUser.email, targetUser.name || targetUser.email)
      ezaiUserId = ezaiUser.id
      ezaiApiKey = ezaiUser.api_key
    } catch (createErr: unknown) {
      const errMsg = createErr instanceof Error ? createErr.message : ''

      // If email already exists on EzAI, find and link the existing account
      if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('exist') || errMsg.toLowerCase().includes('duplicate')) {
        console.log(`EzAI user ${targetUser.email} already exists, looking up...`)

        // Search through EzAI users to find the one with matching email
        const { users } = await ezai.listUsers(1, 200)
        const existing = users.find(u => u.email === targetUser.email)

        if (!existing) {
          return NextResponse.json({ error: 'EzAI user exists but could not be found via search' }, { status: 500 })
        }

        ezaiUserId = existing.id

        // Get API key from existing user
        const fullUser = await ezai.getUser(ezaiUserId)
        const activeKey = fullUser.api_keys?.find(k => k.is_active === 1)
        ezaiApiKey = activeKey?.full_key || fullUser.api_keys?.[0]?.full_key || ''

        // If no key exists, create one
        if (!ezaiApiKey) {
          const newKey = await ezai.createApiKey(ezaiUserId)
          ezaiApiKey = newKey.full_key || ''
        }
      } else {
        throw createErr
      }
    }

    // Update local profile with EzAI credentials
    const updated = await User.findByIdAndUpdate(user_id, {
      ezai_user_id: ezaiUserId,
      ezai_api_key: ezaiApiKey,
    }, { new: true }).lean()

    await AuditLog.create({
      user_id: session.userId,
      action: 'user_provisioned',
      details: { target_user_id: user_id, ezai_user_id: ezaiUserId },
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('Admin create user error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
