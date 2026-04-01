import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models'

const TELEGRAM_BOT_TOKEN = '8723085941:AAGl1z8DtwQgy-mV3emBS6IQEDChW2m8c7Y'
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

/**
 * GET /api/telegram/detect — Detect the group chat ID from recent bot updates (admin only)
 * 
 * Returns all found group/supergroup chats so the admin can pick the right one.
 * Instructions: 
 *   1. Add the bot to the Telegram group
 *   2. Send /start or any message in the group
 *   3. Call this endpoint to detect the group chat ID
 *   4. Use the returned chat_id in the test endpoint
 */
export async function GET() {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const admin = await User.findById(session.userId).select('role').lean()
        if (admin?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const res = await fetch(`${TELEGRAM_API}/getUpdates?limit=100`)
        const data = await res.json()

        if (!data.ok) {
            return NextResponse.json({ error: 'Telegram API error', details: data.description }, { status: 500 })
        }

        const chats = new Map<string, { id: number; title: string; type: string }>()

        for (const update of (data.result || [])) {
            const chat = update.message?.chat || update.my_chat_member?.chat
            if (chat && (chat.type === 'group' || chat.type === 'supergroup')) {
                chats.set(String(chat.id), {
                    id: chat.id,
                    title: chat.title,
                    type: chat.type,
                })
            }
        }

        return NextResponse.json({
            success: true,
            current_env: process.env.TELEGRAM_CHAT_ID || null,
            found_groups: Array.from(chats.values()),
            hint: chats.size === 0
                ? 'No groups found. Make sure: 1) Bot is added to the group, 2) Someone sent a message with /start@ezapi_2brain_bot in the group, 3) Bot has "Group Privacy Mode" disabled in @BotFather settings.'
                : `Found ${chats.size} group(s). Use the chat ID with POST /api/telegram/test to set it.`,
        })
    } catch (err) {
        console.error('[Telegram Detect] Error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Server error' },
            { status: 500 }
        )
    }
}
