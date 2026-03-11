import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, TopupRequest, AuditLog, WebhookLog } from '@/lib/db/models'
import { ezai } from '@/lib/ezai/client'

/**
 * POST /webhook/pm — Payment webhook
 * 
 * Supports multiple formats:
 * 1. Transactions array: { transactions: [{ content, transferAmount, ... }] }
 * 2. Flat body: { content, amount, ... }
 * 
 * Content matching: extracts "2BRAIN UXXXX RXXXX" from anywhere in the string
 * (banks often prepend account/phone numbers)
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

    // Support transactions array format (from payment providers)
    const transactions = Array.isArray(body.transactions) ? body.transactions : [body]
    const results = []

    for (const tx of transactions) {
        const result = await processTransaction(tx, body, rawHeaders, ip)
        results.push(result)
    }

    return NextResponse.json({
        success: results.some(r => r.success),
        results,
    })
}

async function processTransaction(
    tx: Record<string, unknown>,
    fullBody: Record<string, unknown>,
    rawHeaders: Record<string, string>,
    ip: string
) {
    // Extract content from various field names
    const rawContent: string = (
        tx.content || tx.description || tx.addInfo || tx.memo || tx.transferContent || ''
    ).toString().trim().toUpperCase()

    // Extract amount
    const amount: number = Number(tx.transferAmount || tx.amount || tx.value || 0)

    // Extract "2BRAIN UXXXX RXXXX" from anywhere in the content
    // Bank content can be: "120930457758-0899028898-2BRAIN U0004 RAFB3"
    // Match: "2BRAIN CR U0002 R7A3F1B9C2" or "2BRAIN PL STARTER U0002 R7A3F1B9C2"
    // Also backward compatible: "2BRAIN U0002 RA3F1"
    const match = rawContent.match(/2BRAIN\s+(?:CR|PL\s+\w+)?\s*U\d+\s+R[A-F0-9]+/i)

    if (!match) {
        const log = await WebhookLog.create({
            source: 'payment', method: 'POST', headers: rawHeaders, body: fullBody,
            result: 'no_match', result_message: `No 2BRAIN code found in "${rawContent}"`, ip,
        })
        console.log(`[Webhook] #${log._id} — No match: "${rawContent}"`)
        return { success: false, message: 'Not a 2brain payment' }
    }

    const transferCode = match[0] // "2BRAIN U0004 RAFB3"
    console.log(`[Webhook] Payment received: "${transferCode}" — ${amount} VND (raw: "${rawContent}")`)

    // Find matching pending topup
    const topup = await TopupRequest.findOne({
        transfer_content: transferCode,
        status: 'pending',
    }).lean()

    if (!topup) {
        const log = await WebhookLog.create({
            source: 'payment', method: 'POST', headers: rawHeaders, body: fullBody,
            result: 'no_match', result_message: `No pending topup for "${transferCode}"`, ip,
        })
        console.log(`[Webhook] #${log._id} — No pending request for "${transferCode}"`)
        return { success: false, message: 'No matching pending topup' }
    }

    // Verify amount (1% tolerance)
    if (amount > 0 && Math.abs(amount - topup.vnd_amount) > topup.vnd_amount * 0.01) {
        const log = await WebhookLog.create({
            source: 'payment', method: 'POST', headers: rawHeaders, body: fullBody,
            matched_topup_id: topup._id, result: 'amount_mismatch',
            result_message: `Expected ${topup.vnd_amount}, got ${amount}`, ip,
        })
        console.log(`[Webhook] #${log._id} — Amount mismatch`)
        return { success: false, message: 'Amount mismatch' }
    }

    // Get user
    const userProfile = await User.findById(topup.user_id).select('ezai_user_id email').lean()

    // Try EzAI credit (non-blocking — admin can do manually later)
    let ezaiCredited = false
    if (userProfile?.ezai_user_id) {
        try {
            if (topup.type === 'plan' && topup.plan_name) {
                await ezai.activatePlan(userProfile.ezai_user_id, topup.plan_name as 'starter' | 'pro' | 'max' | 'ultra')
            } else {
                await ezai.topupUser(userProfile.ezai_user_id, topup.usd_amount)
            }
            ezaiCredited = true
        } catch (ezaiErr) {
            console.log(`[Webhook] EzAI credit failed (will approve anyway):`, ezaiErr instanceof Error ? ezaiErr.message : ezaiErr)
        }
    }

    // Approve topup
    const txId = tx.id || tx.transactionNumber || tx.transferId || ''
    const ezaiNote = ezaiCredited ? '' : ' [EzAI pending - admin cần credit thủ công]'
    await TopupRequest.findByIdAndUpdate(topup._id, {
        status: 'approved',
        admin_note: `Auto-approved via webhook${txId ? ` (ref: ${txId})` : ''}${ezaiNote}`,
        approved_at: new Date(),
    })

    const userEmail = userProfile?.email || 'unknown'

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
            ezai_credited: ezaiCredited,
        },
    })

    // Webhook log — success
    const log = await WebhookLog.create({
        source: 'payment', method: 'POST', headers: rawHeaders, body: fullBody,
        matched_topup_id: topup._id, matched_user_email: userEmail,
        result: 'success',
        result_message: `Approved ${topup.type === 'plan' ? `plan ${topup.plan_name}` : `$${topup.usd_amount}`} for ${userEmail}${ezaiCredited ? '' : ' (EzAI pending)'}`,
        ip,
    })

    console.log(`[Webhook] #${log._id} ✅ Auto-approved topup ${topup._id} for ${userEmail}`)

    return {
        success: true,
        message: 'Payment verified and approved',
        topup_id: topup._id.toString(),
        user_email: userEmail,
        vnd_amount: topup.vnd_amount,
        ezai_credited: ezaiCredited,
    }
}
