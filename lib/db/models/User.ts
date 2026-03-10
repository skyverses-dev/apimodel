import mongoose, { Schema, Model } from 'mongoose'

export interface IUser {
    _id: mongoose.Types.ObjectId
    email: string
    password: string
    name: string | null
    role: 'admin' | 'user'
    ezai_user_id: string | null
    ezai_api_key: string | null
    user_code: string | null
    leverage: number
    _supabase_id?: string | null
    created_at: Date
    updated_at: Date
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, select: false },
        name: { type: String, default: null },
        role: { type: String, enum: ['admin', 'user'], default: 'user' },
        ezai_user_id: { type: String, default: null },
        ezai_api_key: { type: String, default: null },
        user_code: { type: String, default: null },
        leverage: { type: Number, default: 1 },
        _supabase_id: { type: String, default: null, index: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
)

export const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
