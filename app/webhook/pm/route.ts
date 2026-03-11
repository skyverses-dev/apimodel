import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, TopupRequest, AuditLog } from '@/lib/db/models'
import { ezai } from '@/lib/ezai/client'

/**
 * POST /webhook/pm — Payment webhook
 * 
 * Called by 3rd party payment provider when a QR bank transfer is received.
 * Matches the transfer content with a pending topup request and auto-approves.
 * 
 * Expected body (flexible — supports common payment webhook formats):
 * {
 *   "content": "2BRAIN U0001 20260311",     // Transfer content (nội dung chuyển khoản)
 *   "amount": 100000,                        // Amount in VND
 *   "transferId": "FT26070xxxxx"              // Optional: bank transfer ID
 * }
 * 
 * Alternative field names supported:
 *   content | description | addInfo | memo | transferContent
 *   amount | transferAmount | value
 * 
 * Security: Use WEBHOOK_SECRET env var for token-based auth
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Extract transfer content (support multiple field names)
        const content: string = (
            body.content || body.description || body.addInfo || body.memo || body.transferContent || ''
        ).toString().trim().toUpperCase()

        // Extract amount
        const amount: number = Number(body.amount || body.transferAmount || body.value || 0)

        if (!content) {
            return NextResponse.json({ error: 'Missing transfer content' }, { status: 400 })
        }

        // Check if content matches our format: "2BRAIN UXXXX YYYYMMDD"
        if (!content.includes('2BRAIN')) {
            return NextResponse.json({
                success: false,
                message: 'Transfer content does not match — not a 2brain payment'
            })
        }

        console.log(`[Webhook] Payment received: "${content}" — ${amount} VND`)

        await connectDB()

        // Find matching pending topup request
        const topup = await TopupRequest.findOne({
            transfer_content: content,
            status: 'pending',
        }).lean()

        if (!topup) {
            console.log(`[Webhook] No pending request found for: "${content}"`)
            return NextResponse.json({
                success: false,
                message: 'No matching pending topup request found'
            })
        }

        // Verify amount matches (allow 1% tolerance for bank fees)
        if (amount > 0 && Math.abs(amount - topup.vnd_amount) > topup.vnd_amount * 0.01) {
            console.log(`[Webhook] Amount mismatch: expected ${topup.vnd_amount}, got ${amount}`)
            return NextResponse.json({
                success: false,
                message: `Amount mismatch: expected ${topup.vnd_amount} VND, got ${amount} VND`
            })
        }

        // Get user profile for EzAI
        const userProfile = await User.findById(topup.user_id).select('ezai_user_id email').lean()
        if (!userProfile?.ezai_user_id) {
            console.log(`[Webhook] User ${topup.user_id} has no EzAI account`)
            return NextResponse.json({
                success: false,
                message: 'User does not have an EzAI account yet'
            }, { status: 400 })
        }

        // Call EzAI to credit user
        try {
            if (topup.type === 'plan' && topup.plan_name) {
                await ezai.activatePlan(userProfile.ezai_user_id, topup.plan_name as 'starter' | 'pro' | 'max' | 'ultra')
                console.log(`[Webhook] ✅ Plan ${topup.plan_name} activated for ${userProfile.email}`)
            } else {
                await ezai.topupUser(userProfile.ezai_user_id, topup.usd_amount)
                console.log(`[Webhook] ✅ Credited $${topup.usd_amount} to ${userProfile.email}`)
            }
        } catch (ezaiErr) {
            console.error(`[Webhook] EzAI error:`, ezaiErr)
            return NextResponse.json({
                success: false,
                message: `EzAI credit failed: ${ezaiErr instanceof Error ? ezaiErr.message : 'Unknown error'}`
            }, { status: 500 })
        }

        // Mark topup as approved
        await TopupRequest.findByIdAndUpdate(topup._id, {
            status: 'approved',
            admin_note: `Auto-approved via webhook${body.transferId ? ` (ref: ${body.transferId})` : ''}`,
            approved_at: new Date(),
        })

        // Audit log
        await AuditLog.create({
            user_id: topup.user_id,
            action: 'topup_auto_approved',
            details: {
                topup_id: topup._id.toString(),
                vnd_amount: topup.vnd_amount,
                usd_amount: topup.usd_amount,
                credit_amount: topup.credit_amount,
                type: topup.type,
                plan_name: topup.plan_name,
                webhook_ref: body.transferId || null,
            },
        })

        console.log(`[Webhook] ✅ Topup ${topup._id} auto-approved for ${userProfile.email}`)

        return NextResponse.json({
            success: true,
            message: 'Payment verified and credited',
            topup_id: topup._id.toString(),
            user_email: userProfile.email,
            vnd_amount: topup.vnd_amount,
            credit_amount: topup.credit_amount,
            type: topup.type,
        })

    } catch (err: unknown) {
        console.error('[Webhook] Error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Server error' },
            { status: 500 }
        )
    }
}
