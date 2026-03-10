import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('rb_settings').select('*')

    const settings: Record<string, string> = {}
    data?.forEach(row => { settings[row.key] = row.value })

    return NextResponse.json({
      exchange_rate: Number(settings.exchange_rate || 26000),
      user_leverage: Number(settings.user_leverage || 30),
      bank_account: settings.bank_account || '11975151',
      bank_name: settings.bank_name || 'ACB',
      bank_holder: settings.bank_holder || 'PHAN DINH DUC',
      bank_bin: settings.bank_bin || '970416',
      plan_starter_vnd: Number(settings.plan_starter_vnd || 299000),
      plan_pro_vnd: Number(settings.plan_pro_vnd || 599000),
      plan_max_vnd: Number(settings.plan_max_vnd || 999000),
      plan_ultra_vnd: Number(settings.plan_ultra_vnd || 1990000),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}
