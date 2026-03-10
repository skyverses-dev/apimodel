import { createAdminClient } from '@/lib/supabase/admin'
import SettingsForm from './SettingsForm'

export default async function AdminSettingsPage() {
  const admin = createAdminClient()
  const { data } = await admin.from('rb_settings').select('*')

  const settings: Record<string, string> = {}
  data?.forEach(r => { settings[r.key] = r.value })

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-white mb-2">Cài đặt hệ thống</h1>
      <p className="text-slate-400 mb-8">Tỷ giá, đòn bẩy và thông tin ngân hàng</p>

      <SettingsForm
        initial={{
          exchange_rate: settings.exchange_rate || '26000',
          user_leverage: settings.user_leverage || '30',
          bank_account: settings.bank_account || '11975151',
          bank_name: settings.bank_name || 'ACB',
          bank_holder: settings.bank_holder || 'PHAN DINH DUC',
          bank_bin: settings.bank_bin || '970416',
          plan_starter_vnd: settings.plan_starter_vnd || '299000',
          plan_pro_vnd: settings.plan_pro_vnd || '599000',
          plan_max_vnd: settings.plan_max_vnd || '999000',
          plan_ultra_vnd: settings.plan_ultra_vnd || '1990000',
        }}
      />
    </div>
  )
}
