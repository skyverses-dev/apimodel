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
        const profile = await User.findById(session.userId).select('ezai_user_id').lean()

        if (!profile?.ezai_user_id) {
            return NextResponse.json({ usage: [] })
        }

        const result = await ezai.getUsage(profile.ezai_user_id, 100)
        return NextResponse.json(result)
    } catch (err) {
        console.error('Usage history API error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
