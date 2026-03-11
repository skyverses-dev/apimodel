import mongoose, { Schema, Model } from 'mongoose'

export interface IWebhookLog {
    _id: mongoose.Types.ObjectId
    source: string
    method: string
    headers: Record<string, string>
    body: Record<string, unknown>
    matched_topup_id: mongoose.Types.ObjectId | null
    matched_user_email: string | null
    result: 'success' | 'no_match' | 'error' | 'amount_mismatch' | 'no_ezai'
    result_message: string
    ip: string | null
    created_at: Date
}

const WebhookLogSchema = new Schema<IWebhookLog>(
    {
        source: { type: String, default: 'payment' },
        method: { type: String, default: 'POST' },
        headers: { type: Schema.Types.Mixed, default: {} },
        body: { type: Schema.Types.Mixed, default: {} },
        matched_topup_id: { type: Schema.Types.ObjectId, default: null },
        matched_user_email: { type: String, default: null },
        result: { type: String, enum: ['success', 'no_match', 'error', 'amount_mismatch', 'no_ezai'], default: 'no_match' },
        result_message: { type: String, default: '' },
        ip: { type: String, default: null },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
)

WebhookLogSchema.index({ created_at: -1 })

export const WebhookLog: Model<IWebhookLog> =
    mongoose.models.WebhookLog || mongoose.model<IWebhookLog>('WebhookLog', WebhookLogSchema)
