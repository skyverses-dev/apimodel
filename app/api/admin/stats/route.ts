import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { ezai } from '@/lib/ezai/client'
import { AdminUserStat } from '@/types'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const adminProfile = await User.findById(session.userId).select('role').lean()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [rbUsers, ezaiUsersResult] = await Promise.allSettled([
      User.find({ ezai_user_id: { $ne: null } })
        .select('_id name email ezai_user_id')
        .sort({ created_at: -1 })
        .lean(),
      ezai.listUsers(1, 100),
    ])

    const users = rbUsers.status === 'fulfilled' ? rbUsers.value : []
    const ezaiUsers = ezaiUsersResult.status === 'fulfilled' ? ezaiUsersResult.value.users : []

    // Build EzAI data map
    const ezaiMap: Record<string, typeof ezaiUsers[0]> = {}
    ezaiUsers.forEach((eu) => { ezaiMap[eu.id] = eu })

    // Merge
    const stats: AdminUserStat[] = users.map((rb) => {
      const ezaiData = rb.ezai_user_id ? ezaiMap[rb.ezai_user_id] : null
      return {
        rb_user_id: rb._id.toString(),
        name: rb.name,
        email: rb.email,
        ezai_user_id: rb.ezai_user_id,
        balance: ezaiData?.balance ?? 0,
        plan_type: ezaiData?.plan_type ?? 'none',
        daily_limit: ezaiData?.daily_limit ?? 0,
        daily_used: ezaiData?.daily_used ?? 0,
        plan_expires_at: ezaiData?.plan_expires_at ?? null,
      }
    })

    stats.sort((a, b) => b.daily_used - a.daily_used)

    return NextResponse.json({ stats, total: stats.length })
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
