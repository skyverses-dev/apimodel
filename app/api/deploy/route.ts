import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import crypto from 'crypto'
import path from 'path'

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || ''

function verifySignature(payload: string, signature: string | null): boolean {
    if (!WEBHOOK_SECRET || !signature) return !WEBHOOK_SECRET // allow if no secret configured
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
    hmac.update(payload)
    const expected = `sha256=${hmac.digest('hex')}`
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
    const body = await request.text()
    const signature = request.headers.get('x-hub-signature-256')
    const event = request.headers.get('x-github-event')

    // Verify GitHub signature
    if (!verifySignature(body, signature)) {
        console.log('[Deploy Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Only trigger on push events
    if (event !== 'push') {
        return NextResponse.json({ message: `Ignored event: ${event}` })
    }

    // Parse payload to check branch
    let payload
    try {
        payload = JSON.parse(body)
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const branch = payload.ref?.replace('refs/heads/', '') || ''
    const targetBranch = process.env.DEPLOY_BRANCH || 'v2'

    if (branch !== targetBranch) {
        return NextResponse.json({ message: `Ignored branch: ${branch}, waiting for: ${targetBranch}` })
    }

    const commitMsg = payload.head_commit?.message || 'unknown'
    const pusher = payload.pusher?.name || 'unknown'

    console.log(`[Deploy Webhook] Push to ${branch} by ${pusher}: ${commitMsg}`)

    // Run auto-deploy.sh in background (non-blocking)
    const scriptPath = path.resolve(process.cwd(), 'auto-deploy.sh')

    exec(`bash ${scriptPath} &`, {
        cwd: process.cwd(),
        env: { ...process.env, PATH: `/usr/local/bin:/usr/bin:/bin:${process.env.PATH}` },
    }, (error) => {
        if (error) {
            console.error('[Deploy Webhook] Script error:', error.message)
        }
    })

    return NextResponse.json({
        success: true,
        message: 'Deploy triggered',
        branch,
        commit: commitMsg,
        pusher,
        timestamp: new Date().toISOString(),
    })
}

// GET — check webhook status
export async function GET() {
    return NextResponse.json({
        status: 'active',
        service: '2BRAIN Auto Deploy',
        branch: process.env.DEPLOY_BRANCH || 'v2',
    })
}
