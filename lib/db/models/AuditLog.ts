import mongoose, { Schema, Model, Types } from 'mongoose'

export interface IAuditLog {
    _id: Types.ObjectId
    user_id: Types.ObjectId
    action: string
    details: Record<string, unknown> | null
    created_at: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        action: { type: String, required: true },
        details: { type: Schema.Types.Mixed, default: null },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
)

export const AuditLog: Model<IAuditLog> =
    mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
