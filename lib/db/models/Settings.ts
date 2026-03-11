import mongoose, { Schema, Model } from 'mongoose'

export interface ISettings {
    _id: mongoose.Types.ObjectId
    exchange_rate: number
    user_leverage: number
    bank_account: string
    bank_name: string
    bank_holder: string
    bank_bin: string
    // Plan pricing (VND)
    plan_starter_vnd: number
    plan_pro_vnd: number
    plan_max_vnd: number
    plan_ultra_vnd: number
    // Plan limits (credits per reset period)
    plan_starter_limit: string
    plan_pro_limit: string
    plan_max_limit: string
    plan_ultra_limit: string
    updated_at: Date
}

const SettingsSchema = new Schema<ISettings>(
    {
        exchange_rate: { type: Number, default: 26000 },
        user_leverage: { type: Number, default: 30 },
        bank_account: { type: String, default: '' },
        bank_name: { type: String, default: '' },
        bank_holder: { type: String, default: '' },
        bank_bin: { type: String, default: '' },
        plan_starter_vnd: { type: Number, default: 299000 },
        plan_pro_vnd: { type: Number, default: 599000 },
        plan_max_vnd: { type: Number, default: 999000 },
        plan_ultra_vnd: { type: Number, default: 1990000 },
        plan_starter_limit: { type: String, default: '35 credits/5h' },
        plan_pro_limit: { type: String, default: '80 credits/5h' },
        plan_max_limit: { type: String, default: '180 credits/5h' },
        plan_ultra_limit: { type: String, default: '400 credits/5h' },
    },
    {
        timestamps: { createdAt: false, updatedAt: 'updated_at' },
    }
)

export const Settings: Model<ISettings> =
    mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema)
