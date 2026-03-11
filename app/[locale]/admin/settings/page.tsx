import connectDB from '@/lib/db/mongodb'
import { Settings } from '@/lib/db/models'
import SettingsForm from './SettingsForm'

export default async function AdminSettingsPage() {
  await connectDB()
  const settings = await Settings.findOne().lean()

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Cài đặt hệ thống</h1>
        <p className="text-slate-400 text-sm mt-1">Tỷ giá, đòn bẩy, ngân hàng và giá gói tháng</p>
      </div>

      <SettingsForm
        initial={{
          exchange_rate: String(settings?.exchange_rate || '26000'),
          user_leverage: String(settings?.user_leverage || '30'),
          bank_account: settings?.bank_account || '',
          bank_name: settings?.bank_name || '',
          bank_holder: settings?.bank_holder || '',
          bank_bin: settings?.bank_bin || '',
          plan_starter_vnd: String(settings?.plan_starter_vnd || '299000'),
          plan_pro_vnd: String(settings?.plan_pro_vnd || '599000'),
          plan_max_vnd: String(settings?.plan_max_vnd || '999000'),
          plan_ultra_vnd: String(settings?.plan_ultra_vnd || '1990000'),
          plan_starter_limit: settings?.plan_starter_limit || '35 credits/5h',
          plan_pro_limit: settings?.plan_pro_limit || '80 credits/5h',
          plan_max_limit: settings?.plan_max_limit || '180 credits/5h',
          plan_ultra_limit: settings?.plan_ultra_limit || '400 credits/5h',
        }}
      />
    </div>
  )
}
