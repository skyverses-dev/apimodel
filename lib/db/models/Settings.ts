import mongoose, { Schema, Model } from 'mongoose'

export interface ISettings {
    _id: mongoose.Types.ObjectId
    exchange_rate: number
    user_leverage: number
    bank_account: string
    bank_name: string
    bank_holder: string
    bank_bin: string
    updated_at: Date
}

const SettingsSchema = new Schema<ISettings>(
    {
        exchange_rate: { type: Number, default: 25000 },
        user_leverage: { type: Number, default: 1 },
        bank_account: { type: String, default: '' },
        bank_name: { type: String, default: '' },
        bank_holder: { type: String, default: '' },
        bank_bin: { type: String, default: '' },
    },
    {
        timestamps: { createdAt: false, updatedAt: 'updated_at' },
    }
)

export const Settings: Model<ISettings> =
    mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema)
