import connectDB from '@/lib/db/mongodb'
import { Settings } from '@/lib/db/models'
import SettingsForm from './SettingsForm'

export default async function AdminSettingsPage() {
  await connectDB()
  const settings = await Settings.findOne().lean()

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-white mb-2">Cài đặt hệ thống</h1>
      <p className="text-slate-400 mb-8">Tỷ giá, đòn bẩy và thông tin ngân hàng</p>

      <SettingsForm
        initial={{
          exchange_rate: String(settings?.exchange_rate || '26000'),
          user_leverage: String(settings?.user_leverage || '30'),
          bank_account: settings?.bank_account || '11975151',
          bank_name: settings?.bank_name || 'ACB',
          bank_holder: settings?.bank_holder || 'PHAN DINH DUC',
          bank_bin: settings?.bank_bin || '970416',
          plan_starter_vnd: String((settings as unknown as Record<string, unknown>)?.plan_starter_vnd || '299000'),
          plan_pro_vnd: String((settings as unknown as Record<string, unknown>)?.plan_pro_vnd || '599000'),
          plan_max_vnd: String((settings as unknown as Record<string, unknown>)?.plan_max_vnd || '999000'),
          plan_ultra_vnd: String((settings as unknown as Record<string, unknown>)?.plan_ultra_vnd || '1990000'),
        }}
      />
    </div>
  )
}
