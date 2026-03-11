import { NextRequest } from 'next/server'

const EZAI_BASE = process.env.EZAI_BASE_URL || 'https://api-v2.itera102.cloud'

/**
 * Proxy all requests: /v1/* → api-v2.itera102.cloud/v1/*
 * Supports both regular JSON and streaming (SSE) responses
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params
    const targetPath = `/v1/${path.join('/')}`
    const targetUrl = `${EZAI_BASE}${targetPath}`

    // Get all headers from original request
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
        // Skip hop-by-hop headers
        if (['host', 'connection', 'transfer-encoding', 'content-length'].includes(key.toLowerCase())) return
        headers[key] = value
    })

    const body = await request.text()

    // Forward to EzAI
    const ezaiRes = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body,
    })

    // Check if streaming response
    const isStream = ezaiRes.headers.get('content-type')?.includes('text/event-stream')

    if (isStream && ezaiRes.body) {
        // Stream response back to client
        return new Response(ezaiRes.body, {
            status: ezaiRes.status,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        })
    }

    // Regular JSON response
    const data = await ezaiRes.text()
    return new Response(data, {
        status: ezaiRes.status,
        headers: {
            'Content-Type': ezaiRes.headers.get('content-type') || 'application/json',
        },
    })
}

// Also support GET for model listing, etc.
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params
    const targetPath = `/v1/${path.join('/')}`
    const targetUrl = `${EZAI_BASE}${targetPath}`

    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
        if (['host', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) return
        headers[key] = value
    })

    const ezaiRes = await fetch(targetUrl, { headers })
    const data = await ezaiRes.text()

    return new Response(data, {
        status: ezaiRes.status,
        headers: {
            'Content-Type': ezaiRes.headers.get('content-type') || 'application/json',
        },
    })
}
