import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { ezai } from '@/lib/ezai/client'

export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const admin = await User.findById(session.userId).select('role').lean()
        if (admin?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const userId = request.nextUrl.searchParams.get('user_id')
        const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 50, 100)

        if (!userId) {
            return NextResponse.json({ error: 'user_id required' }, { status: 400 })
        }

        const result = await ezai.getUsage(userId, limit)
        return NextResponse.json(result)
    } catch (err) {
        console.error('Admin usage logs error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
