'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Save, TrendingUp, Building2, Calendar } from 'lucide-react'

interface SettingsFormProps {
  initial: {
    exchange_rate: string
    user_leverage: string
    bank_account: string
    bank_name: string
    bank_holder: string
    bank_bin: string
    plan_starter_vnd: string
    plan_pro_vnd: string
    plan_max_vnd: string
    plan_ultra_vnd: string
  }
}

export default function SettingsForm({ initial }: SettingsFormProps) {
  const [values, setValues] = useState(initial)
  const [loading, setLoading] = useState(false)

  function update(key: string, value: string) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setLoading(true)
    try {
      // Convert numeric fields to proper numbers
      const payload = {
        exchange_rate: Number(values.exchange_rate),
        user_leverage: Number(values.user_leverage),
        bank_account: values.bank_account,
        bank_name: values.bank_name,
        bank_holder: values.bank_holder,
        bank_bin: values.bank_bin,
        plan_starter_vnd: Number(values.plan_starter_vnd),
        plan_pro_vnd: Number(values.plan_pro_vnd),
        plan_max_vnd: Number(values.plan_max_vnd),
        plan_ultra_vnd: Number(values.plan_ultra_vnd),
      }

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Đã lưu cài đặt!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu cài đặt')
    } finally {
      setLoading(false)
    }
  }

  const previewUsd = 100000 / Number(values.exchange_rate || 26000)
  const previewCredit = previewUsd * Number(values.user_leverage || 30)

  return (
    <div className="space-y-6">
      {/* Exchange Rate + Leverage */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-400" />
            Tỷ giá & Đòn bẩy
          </CardTitle>
          <CardDescription className="text-slate-400">
            Tỷ giá áp dụng cho tất cả giao dịch mới. Đòn bẩy mặc định cho user mới.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Tỷ giá (VND / 1 USD)</Label>
            <Input
              type="number"
              value={values.exchange_rate}
              onChange={e => update('exchange_rate', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              placeholder="26000"
            />
            <p className="text-xs text-slate-500">Hiện tại: 1 USD = {Number(values.exchange_rate).toLocaleString('vi-VN')} VND</p>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Đòn bẩy mặc định (x)</Label>
            <Input
              type="number"
              value={values.user_leverage}
              onChange={e => update('user_leverage', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              placeholder="30"
            />
            <p className="text-xs text-slate-500">User nạp 1 USD → nhận {values.user_leverage} USD credit</p>
          </div>

          {/* Preview */}
          <div className="sm:col-span-2 bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
            <p className="text-purple-300 text-sm font-medium mb-2">Ví dụ tính toán với cài đặt hiện tại:</p>
            <p className="text-slate-300 text-sm">
              Nạp <strong className="text-white">100.000 VND</strong>
              {' → '}<strong className="text-blue-300">${previewUsd.toFixed(4)} USD</strong>
              {' → '}<strong className="text-green-300">+${previewCredit.toFixed(2)} credit</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bank Info */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building2 size={18} className="text-blue-400" />
            Thông tin ngân hàng
          </CardTitle>
          <CardDescription className="text-slate-400">
            Tài khoản nhận chuyển khoản. Hiển thị trong QR code.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Tên ngân hàng</Label>
            <Input
              value={values.bank_name}
              onChange={e => update('bank_name', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              placeholder="ACB"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">BIN ngân hàng</Label>
            <Input
              value={values.bank_bin}
              onChange={e => update('bank_bin', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              placeholder="970416"
            />
            <p className="text-xs text-slate-500">Dùng cho VietQR URL</p>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Số tài khoản</Label>
            <Input
              value={values.bank_account}
              onChange={e => update('bank_account', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              placeholder="11975151"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Tên chủ tài khoản</Label>
            <Input
              value={values.bank_holder}
              onChange={e => update('bank_holder', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              placeholder="PHAN DINH DUC"
            />
          </div>
        </CardContent>
      </Card>

      {/* Plan Pricing */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar size={18} className="text-pink-400" />
            Giá gói tháng (VND)
          </CardTitle>
          <CardDescription className="text-slate-400">
            Giá hiển thị cho người dùng khi đăng ký gói tháng. Nhập bằng VND.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { key: 'plan_starter_vnd', label: '🌱 Starter', placeholder: '299000', hint: '35 credits/ngày · EzAI giá $10/tháng' },
            { key: 'plan_pro_vnd', label: '⚡ Pro', placeholder: '599000', hint: '80 credits/ngày · EzAI giá $20/tháng' },
            { key: 'plan_max_vnd', label: '🚀 Max', placeholder: '999000', hint: '180 credits/ngày · EzAI giá $40/tháng' },
            { key: 'plan_ultra_vnd', label: '👑 Ultra', placeholder: '1990000', hint: '400 credits/ngày · EzAI giá $80/tháng' },
          ].map(({ key, label, placeholder, hint }) => (
            <div key={key} className="space-y-2">
              <Label className="text-slate-300">{label}</Label>
              <Input
                type="number"
                value={(values as Record<string, string>)[key]}
                onChange={e => update(key, e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder={placeholder}
              />
              <p className="text-xs text-slate-500">{hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 px-8"
        >
          {loading ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          Lưu cài đặt
        </Button>
      </div>
    </div>
  )
}
