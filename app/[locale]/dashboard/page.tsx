import connectDB from '@/lib/db/mongodb'
import { User, Settings } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { getTranslations } from 'next-intl/server'
import { ezai } from '@/lib/ezai/client'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const t = await getTranslations()
  const session = await getSession()
  if (!session) return null

  await connectDB()
  const [profile, settings] = await Promise.all([
    User.findById(session.userId).lean(),
    Settings.findOne().lean(),
  ])

  const baseUrl = settings?.ai_base_url || 'https://ezaiapi.com'

  // Get EzAI data if user has account
  let apiKey: string | null = profile?.ezai_api_key ?? null
  let isActive = true
  let lastUsed: string | null = null
  let ezaiBalance = 0
  let planType = 'none'
  let dailyLimit = 0
  let dailyUsed = 0

  if (profile?.ezai_user_id) {
    try {
      const ezaiUser = await ezai.getUser(profile.ezai_user_id)
      ezaiBalance = ezaiUser.balance ?? 0
      planType = ezaiUser.plan_type ?? 'none'
      dailyLimit = ezaiUser.daily_limit ?? 0
      dailyUsed = ezaiUser.daily_used ?? 0

      const activeKey = ezaiUser.api_keys?.find(k => k.is_active === 1)
      if (activeKey) {
        apiKey = activeKey.full_key
        isActive = true
        lastUsed = activeKey.last_used_at
      } else if (ezaiUser.api_keys && ezaiUser.api_keys.length > 0) {
        apiKey = ezaiUser.api_keys[0].full_key
        isActive = ezaiUser.api_keys[0].is_active === 1
        lastUsed = ezaiUser.api_keys[0].last_used_at
      }
    } catch {
      // EzAI unavailable
    }
  }

  if (!profile?.ezai_user_id) {
    return (
      <div className="p-8 max-w-5xl">
        <div className="flex items-center gap-3 p-6 rounded-xl bg-slate-800/60 border border-white/10 text-slate-400 text-sm">
          Tài khoản AI chưa được kích hoạt. Vui lòng liên hệ admin.
        </div>
      </div>
    )
  }

  return (
    <DashboardClient
      apiKey={apiKey}
      isActive={isActive}
      lastUsed={lastUsed}
      balance={ezaiBalance}
      planType={planType}
      dailyLimit={dailyLimit}
      dailyUsed={dailyUsed}
      baseUrl={baseUrl}
      ezaiUserId={profile.ezai_user_id!}
    />
  )
}
