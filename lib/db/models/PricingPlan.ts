import mongoose, { Schema, Document } from 'mongoose'

export interface IPricingPlan extends Document {
    name: string
    subtitle: string
    price_label: string
    description: string
    description_sub: string
    is_featured: boolean
    order: number
    is_active: boolean
    created_at: Date
    updated_at: Date
}

const PricingPlanSchema = new Schema<IPricingPlan>({
    name: { type: String, required: true },
    subtitle: { type: String, default: '' },
    price_label: { type: String, required: true },
    description: { type: String, default: '' },
    description_sub: { type: String, default: '' },
    is_featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export const PricingPlan = mongoose.models.PricingPlan || mongoose.model<IPricingPlan>('PricingPlan', PricingPlanSchema)
