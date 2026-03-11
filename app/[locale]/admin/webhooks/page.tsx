import connectDB from '@/lib/db/mongodb'
import { WebhookLog } from '@/lib/db/models'
import WebhookLogsTable from './WebhookLogsTable'

export default async function WebhookLogsPage() {
    await connectDB()

    const logs = await WebhookLog.find()
        .sort({ created_at: -1 })
        .limit(100)
        .lean()

    const serialized = logs.map(log => ({
        id: log._id.toString(),
        source: log.source,
        method: log.method,
        headers: log.headers,
        body: log.body,
        matched_topup_id: log.matched_topup_id?.toString() || null,
        matched_user_email: log.matched_user_email,
        result: log.result,
        result_message: log.result_message,
        ip: log.ip,
        created_at: log.created_at.toISOString(),
    }))

    return (
        <div className="p-6 sm:p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Webhook Logs</h1>
                <p className="text-slate-400 text-sm mt-1">Lịch sử webhook từ bên thứ 3 — 100 bản ghi gần nhất</p>
            </div>
            <WebhookLogsTable logs={serialized} />
        </div>
    )
}
