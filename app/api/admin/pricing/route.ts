import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, PricingPlan } from '@/lib/db/models'
import { getSession } from '@/lib/auth'

// GET - list all pricing plans (admin)
export async function GET() {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const admin = await User.findById(session.userId).select('role').lean()
        if (admin?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const plans = await PricingPlan.find().sort({ order: 1 }).lean()
        return NextResponse.json({ plans })
    } catch (err) {
        console.error('Pricing GET error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST - create new plan
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const admin = await User.findById(session.userId).select('role').lean()
        if (admin?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const plan = await PricingPlan.create(body)
        return NextResponse.json({ plan })
    } catch (err) {
        console.error('Pricing POST error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// PUT - update plan
export async function PUT(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const admin = await User.findById(session.userId).select('role').lean()
        if (admin?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { _id, ...update } = body

        const plan = await PricingPlan.findByIdAndUpdate(_id, update, { new: true }).lean()
        if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        return NextResponse.json({ plan })
    } catch (err) {
        console.error('Pricing PUT error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE - delete plan
export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const admin = await User.findById(session.userId).select('role').lean()
        if (admin?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await request.json()
        await PricingPlan.findByIdAndDelete(id)

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Pricing DELETE error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
