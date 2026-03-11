import mongoose, { Schema, Model } from 'mongoose'

export interface ISettings {
    _id: mongoose.Types.ObjectId
    exchange_rate: number
    user_leverage: number
    bank_account: string
    bank_name: string
    bank_holder: string
    bank_bin: string
    plan_starter_vnd: number
    plan_pro_vnd: number
    plan_max_vnd: number
    plan_ultra_vnd: number
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
    },
    {
        timestamps: { createdAt: false, updatedAt: 'updated_at' },
    }
)

export const Settings: Model<ISettings> =
    mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema)
