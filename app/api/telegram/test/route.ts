import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models'
import { notifyTelegram } from '@/lib/telegram'

/**
 * POST /api/telegram/test — Send a test Telegram notification (admin only)
 * Body: { chat_id?: string }
 * 
 * If chat_id is provided, it will be used directly.
 * Otherwise, auto-detection is attempted.
 */
export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const admin = await User.findById(session.userId).select('role').lean()
        if (admin?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json().catch(() => ({}))
        const chatId = body.chat_id

        // If chat_id is provided, set it as env for this process
        if (chatId) {
            process.env.TELEGRAM_CHAT_ID = chatId
        }

        const testMsg = [
            '🧪 <b>TEST NOTIFICATION</b>',
            '',
            '✅ Telegram bot kết nối thành công!',
            `🕐 ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
            '',
            '<i>Bot sẽ gửi thông báo nạp tiền tự động vào group này.</i>',
        ].join('\n')

        await notifyTelegram(testMsg)

        return NextResponse.json({ success: true, message: 'Test notification sent' })
    } catch (err) {
        console.error('[Telegram Test] Error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Server error' },
            { status: 500 }
        )
    }
}
