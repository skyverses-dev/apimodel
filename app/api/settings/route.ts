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
      bank_account: settings?.bank_account || '11975151',
      bank_name: settings?.bank_name || 'ACB',
      bank_holder: settings?.bank_holder || 'PHAN DINH DUC',
      bank_bin: settings?.bank_bin || '970416',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}
