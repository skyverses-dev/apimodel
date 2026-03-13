import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { PricingPlan } from '@/lib/db/models'

// Public endpoint — no auth needed
export async function GET() {
    try {
        await connectDB()
        const plans = await PricingPlan.find({ is_active: true }).sort({ order: 1 }).lean()
        return NextResponse.json({ plans })
    } catch (err) {
        console.error('Public pricing error:', err)
        return NextResponse.json({ plans: [] })
    }
}
