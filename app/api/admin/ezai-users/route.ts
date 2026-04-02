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

        if (search) {
            // When searching, fetch all users to ensure we can find matches across pages
            const q = search.toLowerCase()
            const allResult = await ezai.listUsers(1, 200)
            const filtered = allResult.users.filter(u =>
                u.email?.toLowerCase().includes(q) ||
                u.name?.toLowerCase().includes(q) ||
                u.id?.toLowerCase().includes(q)
            )

            // Apply pagination on filtered results
            const start = (page - 1) * limit
            const paged = filtered.slice(start, start + limit)

            return NextResponse.json({
                users: paged,
                total: filtered.length,
                page,
                limit,
            })
        }

        // No search — normal paginated fetch
        const result = await ezai.listUsers(page, limit)

        return NextResponse.json({
            users: result.users,
            total: result.total,
            page,
            limit,
        })
    } catch (err) {
        console.error('Admin EzAI users error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
