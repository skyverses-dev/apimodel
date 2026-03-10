import connectDB from '@/lib/db/mongodb'
import { User, TopupRequest } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { formatUSD, formatVND } from '@/lib/utils/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wallet, TrendingUp, Clock, ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { LiveStats } from '@/components/dashboard/LiveStats'

export default async function DashboardPage() {
  const t = await getTranslations()
  const locale = await getLocale()
  const session = await getSession()
  if (!session) return null

  await connectDB()
  const profile = await User.findById(session.userId).lean()

  // Fetch topup stats from DB
  const topups = await TopupRequest.find({ user_id: session.userId })
    .sort({ created_at: -1 })
    .lean()

  const approved = topups.filter(t => t.status === 'approved')
  const pending = topups.filter(t => t.status === 'pending')
  const totalCredit = approved.reduce((s, t) => s + Number(t.credit_amount), 0)
  const totalVND = approved.reduce((s, t) => s + Number(t.vnd_amount), 0)

  const recent = topups.slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t('dashboard.title')}</h1>
        <p className="text-slate-400 mt-1">Xin chào, {profile?.name || session.email} 👋</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{t('dashboard.totalTopup')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{formatVND(totalVND)}</div>
            <p className="text-xs text-slate-400 mt-1">= {formatUSD(totalCredit)} credit</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{t('dashboard.pendingTopup')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{pending.length}</div>
            <p className="text-xs text-slate-400 mt-1">Đang chờ xác nhận</p>
          </CardContent>
        </Card>
      </div>

      {/* Live AI Usage Stats */}
      {profile?.ezai_user_id ? (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap size={18} className="text-yellow-400" />
            Sử dụng AI
          </h2>
          <LiveStats />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/60 border border-white/10 text-slate-400 mb-8 text-sm">
          Tài khoản AI chưa được kích hoạt. Vui lòng liên hệ admin.
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href={`/${locale}/dashboard/topup`}>
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                <Wallet className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Nạp tiền ngay</p>
                <p className="text-slate-400 text-sm">QR VietQR — xác nhận nhanh</p>
              </div>
              <ArrowRight className="text-slate-500 group-hover:text-white transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/dashboard/api-keys`}>
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                <TrendingUp className="text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">API Key của bạn</p>
                <p className="text-slate-400 text-sm">Sao chép key để dùng ngay</p>
              </div>
              <ArrowRight className="text-slate-500 group-hover:text-white transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">{t('dashboard.recentTransactions')}</CardTitle>
          <Link href={`/${locale}/dashboard/transactions`}>
            <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
              Xem tất cả <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400">{t('dashboard.noTransactions')}</p>
              <Link href={`/${locale}/dashboard/topup`}>
                <Button className="mt-4 bg-purple-600 hover:bg-purple-700">{t('dashboard.topupNow')}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((topup) => (
                <div key={topup._id.toString()} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <p className="text-sm text-white">{topup.transfer_content}</p>
                    <p className="text-xs text-slate-500">{new Date(topup.created_at).toLocaleString(locale)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-400">+{formatUSD(topup.credit_amount)}</p>
                    <Badge
                      variant={topup.status === 'approved' ? 'default' : topup.status === 'rejected' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {topup.status === 'approved' ? t('topup.approved') : topup.status === 'rejected' ? t('topup.rejected') : t('topup.pending')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
