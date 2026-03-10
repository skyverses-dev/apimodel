import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { ezai } from '@/lib/ezai/client'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const profile = await User.findById(session.userId).select('role').lean()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stats = await ezai.getStats()
    return NextResponse.json(stats)
  } catch (err) {
    console.error('Reseller stats error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
