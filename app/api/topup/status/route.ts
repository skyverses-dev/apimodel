import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { TopupRequest } from '@/lib/db/models'
import { getSession } from '@/lib/auth'

/**
 * GET /api/topup/status?id=TOPUP_ID
 * Poll endpoint — returns current status of a topup request
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const topupId = request.nextUrl.searchParams.get('id')
        if (!topupId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

        await connectDB()

        const topup = await TopupRequest.findOne({
            _id: topupId,
            user_id: session.userId,
        }).select('status type plan_name credit_amount vnd_amount').lean()

        if (!topup) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        return NextResponse.json({
            status: topup.status,
            type: topup.type,
            plan_name: topup.plan_name,
            credit_amount: topup.credit_amount,
            vnd_amount: topup.vnd_amount,
        })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
