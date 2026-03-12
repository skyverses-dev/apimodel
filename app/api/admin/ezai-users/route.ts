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

        const page = Number(request.nextUrl.searchParams.get('page')) || 1
        const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 20, 100)
        const search = request.nextUrl.searchParams.get('search') || ''

        const result = await ezai.listUsers(page, limit)

        // Client-side search filter (EzAI API doesn't support search)
        let filtered = result.users
        if (search) {
            const q = search.toLowerCase()
            filtered = result.users.filter(u =>
                u.email?.toLowerCase().includes(q) ||
                u.name?.toLowerCase().includes(q) ||
                u.id?.toLowerCase().includes(q)
            )
        }

        return NextResponse.json({
            users: filtered,
            total: search ? filtered.length : result.total,
            page,
            limit,
        })
    } catch (err) {
        console.error('Admin EzAI users error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
