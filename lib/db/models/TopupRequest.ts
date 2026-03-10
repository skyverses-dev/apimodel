import mongoose, { Schema, Model, Types } from 'mongoose'

export type TopupStatus = 'pending' | 'approved' | 'rejected'
export type TopupType = 'credit' | 'plan'

export interface ITopupRequest {
    _id: Types.ObjectId
    user_id: Types.ObjectId
    vnd_amount: number
    usd_amount: number
    credit_amount: number
    exchange_rate: number
    leverage: number
    transfer_content: string
    status: TopupStatus
    type: TopupType
    plan_name: string | null
    admin_note: string | null
    approved_by: Types.ObjectId | null
    approved_at: Date | null
    created_at: Date
    updated_at: Date
}

const TopupRequestSchema = new Schema<ITopupRequest>(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        vnd_amount: { type: Number, required: true },
        usd_amount: { type: Number, required: true },
        credit_amount: { type: Number, required: true },
        exchange_rate: { type: Number, required: true },
        leverage: { type: Number, required: true },
        transfer_content: { type: String, required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
        type: { type: String, enum: ['credit', 'plan'], default: 'credit' },
        plan_name: { type: String, default: null },
        admin_note: { type: String, default: null },
        approved_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        approved_at: { type: Date, default: null },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
)

export const TopupRequest: Model<ITopupRequest> =
    mongoose.models.TopupRequest || mongoose.model<ITopupRequest>('TopupRequest', TopupRequestSchema)
