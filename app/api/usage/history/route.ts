import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { ezai } from '@/lib/ezai/client'

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const profile = await User.findById(session.userId).select('ezai_user_id').lean()

        if (!profile?.ezai_user_id) {
            return NextResponse.json({ usage: [], total: 0, page: 1, limit: 20 })
        }

        const { searchParams } = new URL(req.url)
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
        const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20')))

        // Fetch more records from EzAI to allow client-side pagination
        const result = await ezai.getUsage(profile.ezai_user_id, 500)
        const allUsage = result.usage || []
        const total = allUsage.length

        // Slice for current page
        const start = (page - 1) * limit
        const paged = allUsage.slice(start, start + limit)

        return NextResponse.json({
            usage: paged,
            total,
            page,
            limit,
        })
    } catch (err) {
        console.error('Usage history API error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
