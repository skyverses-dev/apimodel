import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatVND } from '@/lib/utils/currency'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { AdminUsageTable } from '@/components/dashboard/AdminUsageTable'

export default async function AdminPage() {
  const t = await getTranslations()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const [
    { count: totalUsers },
    { count: pendingCount },
    { count: approvedCount },
    { data: recentTopups },
    { data: settingsRows },
  ] = await Promise.all([
    admin.from('rb_users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    admin.from('rb_topup_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('rb_topup_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('rb_topup_requests').select('*').order('created_at', { ascending: false }).limit(5),
    admin.from('rb_settings').select('*'),
  ])

  const settings: Record<string, string> = {}
  settingsRows?.forEach(r => { settings[r.key] = r.value })

  const stats = [
    {
      label: 'Tổng người dùng',
      value: totalUsers || 0,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      href: '/admin/users',
    },
    {
      label: 'Chờ duyệt',
      value: pendingCount || 0,
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      href: '/admin/topups',
    },
    {
      label: 'Đã duyệt',
      value: approvedCount || 0,
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      href: '/admin/topups',
    },
    {
      label: 'Tỷ giá hiện tại',
      value: `1 USD = ${Number(settings.exchange_rate || 26000).toLocaleString('vi-VN')} VND`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      href: '/admin/settings',
    },
  ]

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
      <p className="text-slate-400 mb-8">Quản lý hệ thống 2brain</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm">{stat.label}</span>
                  <div className={`${stat.bg} p-2 rounded-lg`}>
                    <stat.icon size={16} className={stat.color} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent topup requests */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-lg">Yêu cầu nạp tiền gần đây</CardTitle>
            <Link href="/admin/topups" className="text-purple-400 text-sm hover:text-purple-300">
              Xem tất cả →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recentTopups || recentTopups.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Chưa có yêu cầu nào</p>
            ) : (
              recentTopups.map((topup) => (
                <div key={topup.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white text-sm font-medium">{formatVND(topup.vnd_amount)}</p>
                    <p className="text-slate-400 text-xs">{topup.transfer_content}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    topup.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                    topup.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {topup.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Duyệt nạp tiền', desc: `${pendingCount || 0} yêu cầu đang chờ`, href: '/admin/topups', color: 'text-yellow-400', icon: Clock },
              { label: 'Quản lý users', desc: `${totalUsers || 0} người dùng`, href: '/admin/users', color: 'text-blue-400', icon: Users },
              { label: 'Cài đặt hệ thống', desc: 'Tỷ giá, đòn bẩy, ngân hàng', href: '/admin/settings', color: 'text-purple-400', icon: TrendingUp },
            ].map((action) => (
              <Link key={action.label} href={action.href}>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <action.icon size={16} className={action.color} />
                  <div>
                    <p className="text-white text-sm font-medium">{action.label}</p>
                    <p className="text-slate-400 text-xs">{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Usage Overview */}
      <div className="mt-8">
        <AdminUsageTable />
      </div>
    </div>
  )
}
