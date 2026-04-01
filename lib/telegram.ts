/**
 * Telegram Bot Notification Service
 * Sends payment/topup notifications to a Telegram group.
 */

const TELEGRAM_BOT_TOKEN = '8723085941:AAGl1z8DtwQgy-mV3emBS6IQEDChW2m8c7Y'

// Will be set after first successful getUpdates or from env
let TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1003815729122'

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

/**
 * Send a message to the configured Telegram chat
 */
async function sendMessage(chatId: string, text: string): Promise<boolean> {
    try {
        const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            }),
        })

        const data = await res.json()
        if (!data.ok) {
            console.error('[Telegram] sendMessage failed:', data.description)
            return false
        }
        return true
    } catch (err) {
        console.error('[Telegram] sendMessage error:', err instanceof Error ? err.message : err)
        return false
    }
}

/**
 * Auto-detect the chat ID by fetching recent updates.
 * The bot must have been added to the group and someone must have sent a message.
 */
async function detectChatId(): Promise<string | null> {
    try {
        const res = await fetch(`${TELEGRAM_API}/getUpdates?limit=10`)
        const data = await res.json()

        if (!data.ok || !data.result?.length) return null

        // Look for group/supergroup chats
        for (const update of data.result) {
            const chat = update.message?.chat || update.my_chat_member?.chat
            if (chat && (chat.type === 'group' || chat.type === 'supergroup')) {
                console.log(`[Telegram] Auto-detected group chat: "${chat.title}" (ID: ${chat.id})`)
                return String(chat.id)
            }
        }
        return null
    } catch (err) {
        console.error('[Telegram] detectChatId error:', err instanceof Error ? err.message : err)
        return null
    }
}

/**
 * Get or auto-detect the chat ID
 */
async function getChatId(): Promise<string | null> {
    if (TELEGRAM_CHAT_ID) return TELEGRAM_CHAT_ID

    const detected = await detectChatId()
    if (detected) {
        TELEGRAM_CHAT_ID = detected
        return detected
    }

    return null
}

// ─── Format helpers ───

function formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫'
}

function formatUSD(amount: number): string {
    return '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

function formatCredits(amount: number): string {
    return new Intl.NumberFormat('en-US').format(amount)
}

// ─── Notification templates ───

interface TopupNotifyData {
    userEmail: string
    userName?: string
    vndAmount: number
    usdAmount: number
    creditAmount: number
    transferCode: string
    type: 'credit' | 'plan'
    planName?: string
    ezaiCredited: boolean
    autoProvisioned: boolean
    topupId: string
}

/**
 * Send a topup success notification to the Telegram group
 */
export async function notifyTopupSuccess(data: TopupNotifyData): Promise<void> {
    const chatId = await getChatId()
    if (!chatId) {
        console.warn('[Telegram] No chat ID available — skipping notification')
        return
    }

    const isPlan = data.type === 'plan' && data.planName

    const lines = [
        `💰 <b>NẠP TIỀN THÀNH CÔNG</b>`,
        ``,
        `👤 <b>User:</b> ${escapeHtml(data.userEmail)}`,
        ...(data.userName ? [`📛 <b>Tên:</b> ${escapeHtml(data.userName)}`] : []),
        ``,
        isPlan
            ? `📦 <b>Gói:</b> ${escapeHtml(data.planName!.toUpperCase())}`
            : `💎 <b>Credits:</b> ${formatCredits(data.creditAmount)}`,
        `💵 <b>Số tiền:</b> ${formatVND(data.vndAmount)} (${formatUSD(data.usdAmount)})`,
        `📝 <b>Mã GD:</b> <code>${escapeHtml(data.transferCode)}</code>`,
        ``,
        `✅ <b>EzAI:</b> ${data.ezaiCredited ? 'Đã cộng credits' : '⚠️ Chưa cộng (cần xử lý thủ công)'}`,
        ...(data.autoProvisioned ? [`🆕 <i>Tài khoản EzAI mới được tạo tự động</i>`] : []),
        ``,
        `🕐 ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
        `🆔 <code>${data.topupId}</code>`,
    ]

    await sendMessage(chatId, lines.join('\n'))
}

/**
 * Send a generic notification
 */
export async function notifyTelegram(text: string): Promise<void> {
    const chatId = await getChatId()
    if (!chatId) {
        console.warn('[Telegram] No chat ID available — skipping notification')
        return
    }
    await sendMessage(chatId, text)
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}
