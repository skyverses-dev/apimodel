import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { Settings } from '@/lib/db/models'

export async function GET() {
  try {
    await connectDB()
    const settings = await Settings.findOne().lean()

    return NextResponse.json({
      exchange_rate: settings?.exchange_rate || 26000,
      user_leverage: settings?.user_leverage || 30,
      bank_account: settings?.bank_account || '',
      bank_name: settings?.bank_name || '',
      bank_holder: settings?.bank_holder || '',
      bank_bin: settings?.bank_bin || '',
      plan_starter_vnd: settings?.plan_starter_vnd || 299000,
      plan_pro_vnd: settings?.plan_pro_vnd || 599000,
      plan_max_vnd: settings?.plan_max_vnd || 999000,
      plan_ultra_vnd: settings?.plan_ultra_vnd || 1990000,
      plan_starter_limit: settings?.plan_starter_limit || '35 credits/5h',
      plan_pro_limit: settings?.plan_pro_limit || '80 credits/5h',
      plan_max_limit: settings?.plan_max_limit || '180 credits/5h',
      plan_ultra_limit: settings?.plan_ultra_limit || '400 credits/5h',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}
