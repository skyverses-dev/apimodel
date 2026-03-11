import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, TopupRequest, AuditLog, WebhookLog } from '@/lib/db/models'
import { ezai } from '@/lib/ezai/client'

/**
 * POST /webhook/pm — Payment webhook
 * 
 * Called by 3rd party payment provider when a QR bank transfer is received.
 * Logs full request body, matches with pending topup, auto-approves.
 */
export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rawHeaders: Record<string, string> = {}
    request.headers.forEach((v, k) => { rawHeaders[k] = v })

    let body: Record<string, unknown> = {}

    try {
        body = await request.json()
    } catch {
        await connectDB()
        await WebhookLog.create({
            source: 'payment', method: 'POST', headers: rawHeaders, body: {},
            result: 'error', result_message: 'Invalid JSON body', ip,
        })
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    await connectDB()

    // Extract transfer content (support multiple field names)
    const content: string = (
        body.content || body.description || body.addInfo || body.memo || body.transferContent || ''
    ).toString().trim().toUpperCase()

    const amount: number = Number(body.amount || body.transferAmount || body.value || 0)

    // Not a 2brain payment
    if (!content || !content.includes('2BRAIN')) {
        const log = await WebhookLog.create({
            source: 'payment', method: 'POST', headers: rawHeaders, body,
            result: 'no_match', result_message: `Content "${content}" does not match 2BRAIN format`, ip,
        })
        console.log(`[Webhook] #${log._id} — No match: "${content}"`)
        return NextResponse.json({ success: false, message: 'Not a 2brain payment' })
    }

    console.log(`[Webhook] Payment received: "${content}" — ${amount} VND`)

    // Find matching pending topup
    const topup = await TopupRequest.findOne({
        transfer_content: content,
        status: 'pending',
    }).lean()

    if (!topup) {
        const log = await WebhookLog.create({
            source: 'payment', method: 'POST', headers: rawHeaders, body,
            result: 'no_match', result_message: `No pending topup for "${content}"`, ip,
        })
        console.log(`[Webhook] #${log._id} — No pending request`)
        return NextResponse.json({ success: false, message: 'No matching pending topup' })
    }

    // Verify amount (1% tolerance)
    if (amount > 0 && Math.abs(amount - topup.vnd_amount) > topup.vnd_amount * 0.01) {
        const log = await WebhookLog.create({
            source: 'payment', method: 'POST', headers: rawHeaders, body,
            matched_topup_id: topup._id, result: 'amount_mismatch',
            result_message: `Expected ${topup.vnd_amount}, got ${amount}`, ip,
        })
        console.log(`[Webhook] #${log._id} — Amount mismatch`)
        return NextResponse.json({ success: false, message: `Amount mismatch` })
    }

    // Get user
    const userProfile = await User.findById(topup.user_id).select('ezai_user_id email').lean()
    if (!userProfile?.ezai_user_id) {
        const log = await WebhookLog.create({
            source: 'payment', method: 'POST', headers: rawHeaders, body,
            matched_topup_id: topup._id, result: 'no_ezai',
            result_message: `User ${topup.user_id} has no EzAI account`, ip,
        })
        console.log(`[Webhook] #${log._id} — No EzAI account`)
        return NextResponse.json({ success: false, message: 'User has no EzAI account' }, { status: 400 })
    }

    // Call EzAI
    try {
        if (topup.type === 'plan' && topup.plan_name) {
            await ezai.activatePlan(userProfile.ezai_user_id, topup.plan_name as 'starter' | 'pro' | 'max' | 'ultra')
        } else {
            await ezai.topupUser(userProfile.ezai_user_id, topup.usd_amount)
        }
    } catch (ezaiErr) {
        const log = await WebhookLog.create({
            source: 'payment', method: 'POST', headers: rawHeaders, body,
            matched_topup_id: topup._id, matched_user_email: userProfile.email,
            result: 'error', result_message: `EzAI: ${ezaiErr instanceof Error ? ezaiErr.message : 'Unknown'}`, ip,
        })
        console.log(`[Webhook] #${log._id} — EzAI error`)
        return NextResponse.json({ success: false, message: 'EzAI credit failed' }, { status: 500 })
    }

    // Approve topup
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
        },
    })

    // Webhook log — success
    const log = await WebhookLog.create({
        source: 'payment', method: 'POST', headers: rawHeaders, body,
        matched_topup_id: topup._id, matched_user_email: userProfile.email,
        result: 'success',
        result_message: `Credited ${topup.type === 'plan' ? `plan ${topup.plan_name}` : `$${topup.usd_amount}`} to ${userProfile.email}`,
        ip,
    })

    console.log(`[Webhook] #${log._id} ✅ Auto-approved topup ${topup._id} for ${userProfile.email}`)

    return NextResponse.json({
        success: true,
        message: 'Payment verified and credited',
        topup_id: topup._id.toString(),
        user_email: userProfile.email,
        vnd_amount: topup.vnd_amount,
        credit_amount: topup.credit_amount,
    })
}
